import type { Message } from './message.model';

/** Payload sent to the gateway POST /v1/chat/completions. */
export interface ChatRequest {
  model: string;
  messages: Pick<Message, 'role' | 'content'>[];
  stream: true;
  /** Optional: max tokens for the completion. */
  maxTokens?: number;
}
