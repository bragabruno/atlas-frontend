import { Injectable, computed, inject, signal } from '@angular/core';

import { SseService, TooManyRequestsError } from '../../core/services/sse.service';
import type { ChatCompletionRequest } from '../../core/services/sse.service';
import type { Citation } from '../../shared/models/citation.model';
import type { Message } from '../../shared/models';

// ---------------------------------------------------------------------------
// State model
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all possible request/stream lifecycle states.
 *
 * idle          → user hasn't submitted yet, or prior turn fully resolved
 * submitting    → POST sent, awaiting first SSE chunk
 * streaming     → first chunk received, accumulating deltas
 * done          → [DONE] sentinel received; answer complete
 * error         → network / HTTP 5xx / stream parse error
 * rate_limited  → HTTP 429 rate limit (Retry-After may be present)
 * budget_exceeded → HTTP 429 budget exhausted
 */
export type ChatStatus =
  | 'idle'
  | 'submitting'
  | 'streaming'
  | 'done'
  | 'error'
  | 'rate_limited'
  | 'budget_exceeded';

export interface ChatState {
  status: ChatStatus;
  /** Ordered conversation history (user + assistant turns). */
  messages: Message[];
  /** Partial assistant content being streamed (active during 'streaming'). */
  streamingContent: string;
  /** Non-null in 'error' state. */
  error: Error | null;
  /**
   * Seconds to wait before retrying, populated from Retry-After header in
   * 'rate_limited' state.
   */
  retryAfter: number | null;
  /** Source citations parsed from the last completed assistant turn. */
  citations: Citation[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const initialState = (): ChatState => ({
  status: 'idle',
  messages: [],
  streamingContent: '',
  error: null,
  retryAfter: null,
  citations: [],
});

/** Parse `[src:some-id]` markers from assistant content into Citation objects. */
export function parseCitations(content: string): Citation[] {
  const seen = new Set<string>();
  const result: Citation[] = [];
  for (const match of content.matchAll(/\[src:([^\]]+)\]/g)) {
    const sourceId = match[1];
    if (!seen.has(sourceId)) {
      seen.add(sourceId);
      result.push({ sourceId, title: sourceId });
    }
  }
  return result;
}

/**
 * ChatStateStore — Signals-based store for the request/stream lifecycle.
 *
 * Owns the state machine described in docs/diagrams/state-model.md:
 *   idle → submitting → streaming → done
 *                    ↘ error / rate_limited / budget_exceeded
 *
 * Wraps SseService and coordinates state transitions so components only need
 * to observe the single `state` signal.
 */
@Injectable({ providedIn: 'root' })
export class ChatStateStore {
  private readonly sse = inject(SseService);

  private readonly _state = signal<ChatState>(initialState());

  /** Read-only snapshot of the full chat state. */
  readonly state = this._state.asReadonly();

  // Derived signals — components can bind these directly.
  readonly status = computed(() => this._state().status);
  readonly messages = computed(() => this._state().messages);
  readonly streamingContent = computed(() => this._state().streamingContent);
  readonly isSubmitting = computed(() => this._state().status === 'submitting');
  readonly isStreaming = computed(() => this._state().status === 'streaming');
  readonly isBusy = computed(
    () =>
      this._state().status === 'submitting' ||
      this._state().status === 'streaming',
  );
  readonly error = computed(() => this._state().error);
  readonly retryAfter = computed(() => this._state().retryAfter);
  readonly citations = computed(() => this._state().citations);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Submit a user question and stream the assistant reply.
   *
   * Builds the messages array from existing history + the new user turn,
   * drives the state machine through submitting → streaming → done (or an
   * error state), and appends the completed assistant message once done.
   *
   * @param question - Raw text from the composer input.
   * @param model    - Gateway model id to use.
   */
  async submit(question: string, model: string): Promise<void> {
    const trimmed = question.trim();
    if (!trimmed) return;

    // Append user message to history.
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    this._state.update((s) => ({
      ...s,
      status: 'submitting',
      streamingContent: '',
      error: null,
      retryAfter: null,
      messages: [...s.messages, userMessage],
    }));

    // Build the request from full conversation history.
    const history = this._state().messages;
    const request: ChatCompletionRequest = {
      model,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    };

    try {
      // Start streaming — SseService updates its own state signal; we mirror
      // into our state as the stream progresses via a watcher approach below.
      const streamPromise = this.sse.stream(request);

      // Transition to streaming as soon as the promise is running.  The SSE
      // service starts updating its state signal synchronously on the first
      // chunk, so we set our own status here.
      this._state.update((s) => ({ ...s, status: 'streaming' }));

      // Poll the SseService signal during streaming to mirror content.
      // We use a reactive effect-less approach: after stream() resolves the
      // content is final; we rely on an effect-free tick loop that completes
      // with the promise.
      await this._mirrorStream(streamPromise);

      // Stream completed cleanly.
      const finalContent = this.sse.state().content;
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: finalContent,
        createdAt: new Date().toISOString(),
      };

      this._state.update((s) => ({
        ...s,
        status: 'done',
        streamingContent: '',
        messages: [...s.messages, assistantMessage],
        citations: parseCitations(finalContent),
      }));
    } catch (err) {
      this._handleStreamError(err);
    }
  }

  reset(): void {
    this.sse.reset();
    this._state.set(initialState());
  }

  /** Dismiss an error/rate_limited/budget_exceeded state back to idle. */
  dismiss(): void {
    this._state.update((s) => ({
      ...s,
      status: 'idle',
      error: null,
      retryAfter: null,
    }));
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Mirror SseService streaming content into our own state while the stream
   * promise is in-flight.  Uses a rAF/microtask loop so the signal updates
   * propagate to bound templates token-by-token.
   */
  private async _mirrorStream(streamPromise: Promise<void>): Promise<void> {
    let resolved = false;

    const done = streamPromise.then(() => {
      resolved = true;
    });

    const tick = (): Promise<void> =>
      new Promise<void>((resolve) => {
        const step = () => {
          this._state.update((s) => ({
            ...s,
            streamingContent: this.sse.state().content,
          }));
          if (resolved) {
            resolve();
          } else {
            requestAnimationFrame(step);
          }
        };
        requestAnimationFrame(step);
      });

    await Promise.race([done, tick()]);
    // Ensure the promise settles (rethrows if stream errored).
    await streamPromise;
  }

  private _handleStreamError(err: unknown): void {
    if (err instanceof TooManyRequestsError) {
      // Distinguish rate-limit from budget-exceeded by inspecting the error
      // message. The gateway sets a specific message for budget exhaustion.
      const isBudget = err.message.toLowerCase().includes('budget');
      this._state.update((s) => ({
        ...s,
        status: isBudget ? 'budget_exceeded' : 'rate_limited',
        streamingContent: '',
        error: err,
        retryAfter: err.retryAfter,
      }));
      return;
    }

    const error = err instanceof Error ? err : new Error(String(err));
    this._state.update((s) => ({
      ...s,
      status: 'error',
      streamingContent: '',
      error,
    }));
  }
}
