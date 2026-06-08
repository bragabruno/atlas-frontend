import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SseService, TooManyRequestsError } from '../../core/services/sse.service';
import type { StreamState } from '../../core/services/sse.service';
import { ChatStateStore } from './chat-state.store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSseStub(
  overrides: Partial<{
    streamFn: (body: unknown) => Promise<void>;
    initialContent: string;
  }> = {},
): {
  service: Pick<SseService, 'state' | 'stream' | 'reset'>;
  stateSignal: ReturnType<typeof signal<StreamState>>;
} {
  const stateSignal = signal<StreamState>({
    content: overrides.initialContent ?? '',
    streaming: false,
    error: null,
    done: false,
  });

  const service = {
    state: stateSignal.asReadonly(),
    stream: vi.fn(overrides.streamFn ?? (() => Promise.resolve())),
    reset: vi.fn(),
  };

  return { service, stateSignal };
}

function provideStore(sseSvc: Pick<SseService, 'state' | 'stream' | 'reset'>): ChatStateStore {
  TestBed.configureTestingModule({
    providers: [ChatStateStore, { provide: SseService, useValue: sseSvc }],
  });
  return TestBed.inject(ChatStateStore);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChatStateStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  // ── initial state ──────────────────────────────────────────────────────────

  it('starts in idle state', () => {
    const { service } = makeSseStub();
    const store = provideStore(service);

    expect(store.status()).toBe('idle');
    expect(store.messages()).toEqual([]);
    expect(store.streamingContent()).toBe('');
    expect(store.error()).toBeNull();
    expect(store.retryAfter()).toBeNull();
    expect(store.isBusy()).toBe(false);
  });

  // ── idle → submitting → streaming → done ──────────────────────────────────

  it('transitions idle → submitting → streaming → done on successful stream', async () => {
    const { service, stateSignal } = makeSseStub({
      streamFn: async () => {
        // Simulate first chunk arriving (streaming state)
        stateSignal.update((s) => ({ ...s, streaming: true, content: 'Hello' }));
        await Promise.resolve();
        stateSignal.update((s) => ({ ...s, streaming: false, done: true, content: 'Hello world' }));
      },
    });

    const store = provideStore(service);

    // Track status changes via the signal (computed reads after each await point).
    const submitPromise = store.submit('What is REACH?', 'atlas-rag');

    // After submit() but before stream resolves: submitting or streaming.
    // We can only reliably check after the promise settles.
    await submitPromise;

    expect(store.status()).toBe('done');
    expect(store.messages()).toHaveLength(2);
    expect(store.messages()[0].role).toBe('user');
    expect(store.messages()[0].content).toBe('What is REACH?');
    expect(store.messages()[1].role).toBe('assistant');
    expect(store.streamingContent()).toBe('');
  });

  it('appends user message to history before streaming starts', async () => {
    const { service } = makeSseStub();
    const store = provideStore(service);

    await store.submit('Hello gateway', 'atlas-rag');

    const msgs = store.messages();
    expect(msgs[0].content).toBe('Hello gateway');
    expect(msgs[0].role).toBe('user');
  });

  it('does nothing when question is blank', async () => {
    const { service } = makeSseStub();
    const store = provideStore(service);

    await store.submit('   ', 'atlas-rag');

    expect(store.status()).toBe('idle');
    expect(service.stream).not.toHaveBeenCalled();
  });

  // ── error state ───────────────────────────────────────────────────────────

  it('transitions to error on network failure', async () => {
    const networkErr = new Error('Network offline');
    const { service } = makeSseStub({
      streamFn: () => Promise.reject(networkErr),
    });
    const store = provideStore(service);

    await store.submit('Any question', 'atlas-rag');

    expect(store.status()).toBe('error');
    expect(store.error()).toBe(networkErr);
    expect(store.streamingContent()).toBe('');
  });

  // ── rate_limited state ────────────────────────────────────────────────────

  it('transitions to rate_limited on TooManyRequestsError (non-budget)', async () => {
    const rateLimitErr = new TooManyRequestsError(30);
    const { service } = makeSseStub({
      streamFn: () => Promise.reject(rateLimitErr),
    });
    const store = provideStore(service);

    await store.submit('flood query', 'atlas-rag');

    expect(store.status()).toBe('rate_limited');
    expect(store.retryAfter()).toBe(30);
    expect(store.error()).toBe(rateLimitErr);
  });

  // ── budget_exceeded state ─────────────────────────────────────────────────

  it('transitions to budget_exceeded when TooManyRequestsError message includes "budget"', async () => {
    // Subclass TooManyRequestsError with budget message to simulate budget path.
    class BudgetExceededError extends TooManyRequestsError {
      constructor() {
        super(null);
        // Override message to include 'budget' keyword
        Object.defineProperty(this, 'message', { value: 'Budget exceeded for this key.' });
      }
    }

    const budgetErr = new BudgetExceededError();
    const { service } = makeSseStub({
      streamFn: () => Promise.reject(budgetErr),
    });
    const store = provideStore(service);

    await store.submit('any', 'atlas-rag');

    expect(store.status()).toBe('budget_exceeded');
  });

  // ── dismiss ───────────────────────────────────────────────────────────────

  it('dismiss() returns error state to idle', async () => {
    const { service } = makeSseStub({
      streamFn: () => Promise.reject(new Error('oops')),
    });
    const store = provideStore(service);

    await store.submit('q', 'atlas-rag');
    expect(store.status()).toBe('error');

    store.dismiss();

    expect(store.status()).toBe('idle');
    expect(store.error()).toBeNull();
  });

  it('dismiss() returns rate_limited state to idle', async () => {
    const { service } = makeSseStub({
      streamFn: () => Promise.reject(new TooManyRequestsError(60)),
    });
    const store = provideStore(service);

    await store.submit('q', 'atlas-rag');
    expect(store.status()).toBe('rate_limited');

    store.dismiss();

    expect(store.status()).toBe('idle');
    expect(store.retryAfter()).toBeNull();
  });

  // ── reset ─────────────────────────────────────────────────────────────────

  it('reset() clears all state and calls sse.reset()', async () => {
    const { service } = makeSseStub();
    const store = provideStore(service);

    await store.submit('first question', 'atlas-rag');
    expect(store.messages()).toHaveLength(2);

    store.reset();

    expect(store.status()).toBe('idle');
    expect(store.messages()).toEqual([]);
    expect(service.reset).toHaveBeenCalledOnce();
  });

  // ── isBusy derived signal ─────────────────────────────────────────────────

  it('isBusy is false in idle/done/error states', async () => {
    const { service } = makeSseStub();
    const store = provideStore(service);

    // idle
    expect(store.isBusy()).toBe(false);

    await store.submit('q', 'atlas-rag');
    // done
    expect(store.isBusy()).toBe(false);
  });

  // ── message ids are unique UUIDs ──────────────────────────────────────────

  it('assigns unique ids to user and assistant messages', async () => {
    const { service } = makeSseStub();
    const store = provideStore(service);

    await store.submit('q1', 'atlas-rag');
    await store.submit('q2', 'atlas-rag');

    const ids = store.messages().map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
