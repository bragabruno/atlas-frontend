import { Injectable, inject, signal } from '@angular/core';

import { ConfigService } from './config.service';
import type { ChatCompletionChunk, ChatCompletionResponse } from '../api/gateway-openai-types';
import type { components } from '../api/gateway-types';

/** Request type derived from the gateway OpenAPI spec. */
export type ChatCompletionRequest = components['schemas']['ChatCompletionRequest'];

/** Error thrown when the gateway returns HTTP 429 Too Many Requests. */
export class TooManyRequestsError extends Error {
  override readonly name = 'TooManyRequestsError';
  constructor(
    /** Retry-After header value if present, in seconds. */
    readonly retryAfter: number | null = null,
  ) {
    super('Gateway rate limit exceeded (429 Too Many Requests).');
  }
}

/** Streaming state exposed via Angular Signals. */
export interface StreamState {
  /** Accumulated content from all deltas received so far. */
  content: string;
  /** True while the stream is active (not yet [DONE] or errored). */
  streaming: boolean;
  /** Non-null if the stream terminated with an error. */
  error: Error | null;
  /** True once [DONE] is received and the stream is cleanly finished. */
  done: boolean;
}

const initialState = (): StreamState => ({
  content: '',
  streaming: false,
  error: null,
  done: false,
});

/**
 * SseService — consumes the atlas-gateway SSE streaming response.
 *
 * Uses the Fetch API + ReadableStream to read `chat.completion.chunk` SSE
 * deltas and accumulates content in an Angular Signal. Terminates cleanly on
 * the `data: [DONE]` sentinel. Surfaces HTTP 429 as TooManyRequestsError.
 *
 * EventSource is not used because it cannot send the `Authorization: Bearer`
 * header required by the gateway.
 */
@Injectable({ providedIn: 'root' })
export class SseService {
  private readonly config = inject(ConfigService);

  private readonly _state = signal<StreamState>(initialState());

  /** Read-only signal of the current stream state. */
  readonly state = this._state.asReadonly();

  /**
   * Start a new SSE streaming request.
   *
   * Resets state, then opens a fetch stream to POST /v1/chat/completions with
   * `stream: true`. Each SSE data line is parsed as a ChatCompletionChunk and
   * the delta content is appended. When `data: [DONE]` is received the stream
   * is closed and `done` is set to true.
   *
   * @param body - Chat completion request; `stream` is forced to `true`.
   * @returns Promise that resolves when the stream is complete or rejects on error.
   */
  async stream(body: ChatCompletionRequest): Promise<void> {
    this._state.set(initialState());
    this._state.update((s) => ({ ...s, streaming: true }));

    const url = `${this.config.gatewayUrl}/v1/chat/completions`;
    const cfg = this.config.config();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };
    if (cfg?.bearerToken) {
      headers['Authorization'] = `Bearer ${cfg.bearerToken}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...body, stream: true }),
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this._state.update((s) => ({ ...s, streaming: false, error }));
      throw error;
    }

    if (response.status === 429) {
      const retryAfterRaw = response.headers.get('Retry-After');
      const retryAfter = retryAfterRaw !== null ? parseInt(retryAfterRaw, 10) : null;
      const error = new TooManyRequestsError(
        retryAfter !== null && !isNaN(retryAfter) ? retryAfter : null,
      );
      this._state.update((s) => ({ ...s, streaming: false, error }));
      throw error;
    }

    if (!response.ok) {
      const error = new Error(`Gateway error ${response.status}: ${response.statusText}`);
      this._state.update((s) => ({ ...s, streaming: false, error }));
      throw error;
    }

    if (!response.body) {
      const error = new Error('Response body is null; expected a readable stream.');
      this._state.update((s) => ({ ...s, streaming: false, error }));
      throw error;
    }

    try {
      await this._consumeStream(response.body);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this._state.update((s) => ({ ...s, streaming: false, error }));
      throw error;
    }
  }

  /** Non-streaming convenience: parse a full ChatCompletionResponse and set state. */
  setFromResponse(response: ChatCompletionResponse): void {
    const content = response.choices[0]?.message.content ?? '';
    this._state.set({
      content,
      streaming: false,
      error: null,
      done: true,
    });
  }

  /** Reset state to initial (e.g. on new conversation). */
  reset(): void {
    this._state.set(initialState());
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async _consumeStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last (potentially incomplete) line in the buffer.
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          this._processLine(line.trim());
        }
      }

      // Flush any remaining buffered text.
      if (buffer.trim()) {
        this._processLine(buffer.trim());
      }
    } finally {
      reader.releaseLock();
    }
  }

  private _processLine(line: string): void {
    if (!line.startsWith('data:')) return;

    const payload = line.slice('data:'.length).trim();

    if (payload === '[DONE]') {
      this._state.update((s) => ({ ...s, streaming: false, done: true }));
      return;
    }

    let chunk: ChatCompletionChunk;
    try {
      chunk = JSON.parse(payload) as ChatCompletionChunk;
    } catch {
      // Malformed JSON in a chunk — skip silently (SSE spec allows comment lines).
      return;
    }

    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) {
      this._state.update((s) => ({ ...s, content: s.content + delta }));
    }
  }
}
