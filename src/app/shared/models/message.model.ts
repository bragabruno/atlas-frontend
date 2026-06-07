/** Role of a conversation turn. */
export type MessageRole = 'user' | 'assistant';

/** A single chat message in the conversation history. */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  /** ISO-8601 timestamp. */
  createdAt: string;
}
