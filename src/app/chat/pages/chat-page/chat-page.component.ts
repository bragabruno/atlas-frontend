import { Component, signal } from '@angular/core';
import type { Message } from '../../../shared/models';

/**
 * ChatPageComponent — primary view for the RegDoc Q&A interface.
 * Uses Angular Signals as the service-store for stream lifecycle state
 * (per ADR-018).  Full chat UI is implemented in subsequent tickets.
 */
@Component({
  selector: 'atlas-chat-page',
  standalone: true,
  imports: [],
  template: `
    <section class="chat-page">
      <p>Chat page — coming soon.</p>
    </section>
  `,
  styles: `
    .chat-page {
      padding: 1rem;
    }
  `,
})
export class ChatPageComponent {
  /** Ordered list of messages in the current conversation. */
  readonly messages = signal<Message[]>([]);

  /** True while waiting for the first SSE chunk from the gateway. */
  readonly isStreaming = signal(false);
}
