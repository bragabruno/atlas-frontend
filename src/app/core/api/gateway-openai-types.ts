/**
 * OpenAI-compatible wire types for the atlas-gateway chat completions endpoint.
 *
 * The gateway's OpenAPI spec marks the POST /v1/chat/completions 200 response
 * as `unknown` because it serves both streaming (SSE) and non-streaming JSON
 * from the same operation. These types are derived directly from the gateway's
 * Python domain model at atlas-gateway/app/domain/openai.py and must be kept
 * in sync with it manually whenever that file changes.
 *
 * Do NOT edit these shapes independently — always cross-check against
 * atlas-gateway/app/domain/openai.py.
 */

/** Token usage statistics returned in non-streaming and final-chunk responses. */
export interface CompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/** A single content delta within a streaming chunk. */
export interface ChoiceDelta {
  role?: string | null;
  content?: string | null;
}

/** A choice entry in a streaming chat.completion.chunk event. */
export interface ChunkChoice {
  index: number;
  delta: ChoiceDelta;
  finish_reason: string | null;
}

/**
 * A single Server-Sent Event payload parsed from a `data: {...}` line
 * where the object type is "chat.completion.chunk".
 * Streaming terminates on the synthetic `data: [DONE]` sentinel.
 */
export interface ChatCompletionChunk {
  id: string;
  created: number;
  model: string;
  object: 'chat.completion.chunk';
  choices: ChunkChoice[];
  usage?: CompletionUsage | null;
}

/** The assistant message in a non-streaming completion response. */
export interface ResponseMessage {
  role: string;
  content: string;
}

/** A choice entry in a non-streaming completion response. */
export interface Choice {
  index: number;
  message: ResponseMessage;
  finish_reason: string;
}

/** Full non-streaming response from POST /v1/chat/completions (stream: false). */
export interface ChatCompletionResponse {
  id: string;
  created: number;
  model: string;
  object: 'chat.completion';
  choices: Choice[];
  usage: CompletionUsage;
}
