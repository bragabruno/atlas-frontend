import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ConfigService } from './config.service';
import type { components } from '../api/gateway-types';
import type { ChatCompletionResponse, ChatCompletionChunk } from '../api/gateway-openai-types';

/** Request body sent to POST /v1/chat/completions. */
export type ChatCompletionRequest = components['schemas']['ChatCompletionRequest'];

/** Re-export for consumers that only import from this service. */
export type { ChatCompletionResponse, ChatCompletionChunk };

/**
 * GatewayService — typed HTTP client for the atlas-gateway OpenAI-compatible API.
 *
 * Covers the non-streaming `POST /v1/chat/completions` path.
 * For SSE streaming use SseService.
 *
 * Auth is attached transparently by the AuthInterceptor registered in
 * app.config.ts — no token handling here.
 */
@Injectable({ providedIn: 'root' })
export class GatewayService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  /**
   * Send a non-streaming chat completion request.
   *
   * @param body - Typed request body derived from the gateway OpenAPI spec.
   *               `stream` should be false (or omitted) for non-streaming mode.
   * @returns Observable that emits the single ChatCompletionResponse.
   */
  chatCompletion(body: ChatCompletionRequest): Observable<ChatCompletionResponse> {
    const url = `${this.config.gatewayUrl}/v1/chat/completions`;
    return this.http.post<ChatCompletionResponse>(url, body);
  }
}
