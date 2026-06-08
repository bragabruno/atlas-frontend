import { Component, input, afterNextRender, ElementRef, viewChild } from '@angular/core';

import type { Message } from '../../../shared/models';
import { MessageComponent } from '../message/message';

/**
 * MessageListComponent — scrollable list of completed conversation messages.
 *
 * Accepts a messages array signal input and optionally a streamingContent
 * string that shows the in-progress assistant response token-by-token while
 * status is 'streaming'.
 */
@Component({
  selector: 'atlas-message-list',
  standalone: true,
  imports: [MessageComponent],
  template: `
    <div class="message-list" #scrollContainer>
      @for (msg of messages(); track msg.id) {
        <atlas-message [message]="msg" />
      }

      @if (streamingContent()) {
        <div class="message message--assistant message--streaming">
          <span class="message__role">assistant</span>
          <p class="message__content">{{ streamingContent() }}</p>
        </div>
      }

      @if (messages().length === 0 && !streamingContent()) {
        <p class="message-list__empty">Ask a regulatory question to get started.</p>
      }
    </div>
  `,
  styles: `
    .message-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      overflow-y: auto;
      padding: 1rem;
      flex: 1;
    }

    .message-list__empty {
      color: #6c757d;
      text-align: center;
      margin-top: 2rem;
    }

    .message--streaming {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      max-width: 80%;
      align-self: flex-start;
      background: #f8f9fa;
      opacity: 0.85;
    }

    .message__role {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #6c757d;
    }

    .message__content {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }
  `,
})
export class MessageListComponent {
  /** Completed conversation messages. */
  readonly messages = input.required<Message[]>();
  /** Partial assistant content currently being streamed. Empty string when idle. */
  readonly streamingContent = input<string>('');

  private readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  constructor() {
    // Auto-scroll to bottom whenever new content arrives.
    afterNextRender(() => {
      this._scrollToBottom();
    });
  }

  private _scrollToBottom(): void {
    const el = this.scrollContainer()?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
