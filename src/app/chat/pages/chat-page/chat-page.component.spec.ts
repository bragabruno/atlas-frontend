import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { ChatPageComponent } from './chat-page.component';
import { ChatStateStore } from '../../store/chat-state.store';
import type { ChatStatus } from '../../store/chat-state.store';

// ---------------------------------------------------------------------------
// Stub factory
// ---------------------------------------------------------------------------

interface StubOverrides {
  status?: ChatStatus;
  error?: Error | null;
  retryAfter?: number | null;
  isBusy?: boolean;
}

function makeStoreStub(overrides: StubOverrides = {}): Partial<ChatStateStore> {
  const status = overrides.status ?? 'idle';
  const err = overrides.error ?? null;
  const retryAfter = overrides.retryAfter ?? null;
  const isBusy = overrides.isBusy ?? false;

  return {
    // Signals must be read-only signal instances
    status: signal<ChatStatus>(status).asReadonly(),
    messages: signal([]).asReadonly(),
    streamingContent: signal('').asReadonly(),
    isBusy: signal(isBusy).asReadonly(),
    isStreaming: signal(false).asReadonly(),
    isSubmitting: signal(false).asReadonly(),
    error: signal<Error | null>(err).asReadonly(),
    retryAfter: signal<number | null>(retryAfter).asReadonly(),
    citations: signal([]).asReadonly(),
    submit: vi.fn(() => Promise.resolve()),
    dismiss: vi.fn(),
    reset: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function configure(stub: Partial<ChatStateStore>) {
  await TestBed.configureTestingModule({
    imports: [ChatPageComponent],
    providers: [{ provide: ChatStateStore, useValue: stub }],
  }).compileComponents();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChatPageComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('creates the component', async () => {
    await configure(makeStoreStub());
    const fixture = TestBed.createComponent(ChatPageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the composer', async () => {
    await configure(makeStoreStub());
    const fixture = TestBed.createComponent(ChatPageComponent);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('atlas-composer'))).toBeTruthy();
  });

  it('renders the message list', async () => {
    await configure(makeStoreStub());
    const fixture = TestBed.createComponent(ChatPageComponent);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('atlas-message-list'))).toBeTruthy();
  });

  it('renders the citations panel', async () => {
    await configure(makeStoreStub());
    const fixture = TestBed.createComponent(ChatPageComponent);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('atlas-citations-panel'))).toBeTruthy();
  });

  it('calls store.submit when composer emits submitted', async () => {
    const stub = makeStoreStub();
    await configure(stub);
    const fixture = TestBed.createComponent(ChatPageComponent);
    fixture.detectChanges();

    const composer = fixture.debugElement.query(By.css('atlas-composer'));
    composer.triggerEventHandler('submitted', 'What is REACH?');

    expect(stub.submit).toHaveBeenCalledWith('What is REACH?', 'atlas-rag');
  });

  it('shows error banner when status is error', async () => {
    await configure(makeStoreStub({ status: 'error', error: new Error('Network offline') }));
    const fixture = TestBed.createComponent(ChatPageComponent);
    fixture.detectChanges();

    const banner = fixture.debugElement.query(By.css('.banner--error'));
    expect(banner).toBeTruthy();
    expect(banner.nativeElement.textContent).toContain('Network offline');
  });

  it('shows rate_limited banner when status is rate_limited', async () => {
    await configure(makeStoreStub({ status: 'rate_limited', retryAfter: 60 }));
    const fixture = TestBed.createComponent(ChatPageComponent);
    fixture.detectChanges();

    const banner = fixture.debugElement.query(By.css('.banner--warning'));
    expect(banner).toBeTruthy();
    expect(banner.nativeElement.textContent).toContain('Rate limited');
  });

  it('shows budget_exceeded banner when status is budget_exceeded', async () => {
    await configure(makeStoreStub({ status: 'budget_exceeded' }));
    const fixture = TestBed.createComponent(ChatPageComponent);
    fixture.detectChanges();

    const banner = fixture.debugElement.query(By.css('.banner--error'));
    expect(banner).toBeTruthy();
    expect(banner.nativeElement.textContent).toContain('Budget exceeded');
  });

  it('calls store.dismiss when dismiss button is clicked in error banner', async () => {
    const stub = makeStoreStub({ status: 'error', error: new Error('oops') });
    await configure(stub);
    const fixture = TestBed.createComponent(ChatPageComponent);
    fixture.detectChanges();

    const dismissBtn = fixture.debugElement.query(By.css('.banner__dismiss'));
    dismissBtn.triggerEventHandler('click', null);

    expect(stub.dismiss).toHaveBeenCalled();
  });

  it('no banners shown in idle state', async () => {
    await configure(makeStoreStub({ status: 'idle' }));
    const fixture = TestBed.createComponent(ChatPageComponent);
    fixture.detectChanges();

    const banners = fixture.debugElement.queryAll(By.css('.banner'));
    expect(banners).toHaveLength(0);
  });
});
