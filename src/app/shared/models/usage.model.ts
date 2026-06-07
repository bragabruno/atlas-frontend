/** Per-key token and cost accounting snapshot from the gateway. */
export interface Usage {
  apiKey: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** Cost in USD for this request. */
  costUsd: number;
}
