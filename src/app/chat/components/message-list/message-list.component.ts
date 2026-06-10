import { Component, input, afterNextRender, ElementRef, viewChild } from '@angular/core';

import type { Message } from '../../../shared/models';
import { MessageComponent } from '../message/message.component';

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
          <p class="message__content">{{ streamingContent() }}<span class="caret" aria-hidden="true"></span></p>
        </div>
      }

      @if (messages().length === 0 && !streamingContent()) {
        <div class="message-list__empty">
          <span class="message-list__mark" aria-hidden="true">§</span>
          <p class="message-list__lead">Ask a regulatory question to get started.</p>
          <p class="message-list__sub">Every answer cites its sources. Try “What does GDPR Article 6 require for consent?”</p>
        </div>
      }
    </div>
  `,
  styles: `
    .message-list {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      overflow-y: auto;
      padding: 1.6rem 1.5rem;
      flex: 1;
      min-height: 0;
      scroll-behavior: smooth;
    }

    .message-list__empty {
      margin: auto;
      max-width: 44ch;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.55rem;
      animation: atlas-fade 0.9s ease both;
    }
    .message-list__mark {
      font-family: var(--font-display);
      font-size: 3.4rem;
      line-height: 1;
      color: var(--gilt-deep);
    }
    .message-list__lead {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.35rem;
      color: var(--bone);
    }
    .message-list__sub {
      margin: 0;
      font-family: var(--font-sans);
      font-size: 0.85rem;
      line-height: 1.55;
      color: var(--bone-mute);
    }

    .message--streaming {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      max-width: min(76ch, 94%);
      align-self: flex-start;
      animation: atlas-rise 0.3s ease both;
    }
    .message--streaming .message__role {
      font-family: var(--font-mono);
      font-size: 0.6rem;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: var(--gilt);
      padding: 0 0.15rem;
    }
    .message--streaming .message__content {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.62;
      font-family: var(--font-display);
      font-optical-sizing: auto;
      font-size: 1.14rem;
      color: var(--bone);
      background: var(--ink-800);
      border: 1px solid var(--line);
      border-left: 2px solid var(--gilt);
      border-radius: 3px 12px 12px 3px;
      padding: 1rem 1.3rem;
    }

    .caret {
      display: inline-block;
      width: 0.5ch;
      height: 1.05em;
      margin-left: 2px;
      background: var(--gilt-bright);
      vertical-align: text-bottom;
      animation: atlas-blink 1s step-end infinite;
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
