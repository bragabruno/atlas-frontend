import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

import type { Message } from '../../../shared/models';

/**
 * MessageComponent — renders a single conversation turn.
 *
 * Accepts a Message model as input and applies a role-specific CSS class so
 * user and assistant bubbles can be styled independently.
 */
@Component({
  selector: 'atlas-message',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="message" [ngClass]="'message--' + message().role">
      <span class="message__role">{{ message().role }}</span>
      <p class="message__content">{{ message().content }}</p>
    </div>
  `,
  styles: `
    .message {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      max-width: 80%;
      animation: atlas-rise 0.35s ease both;
    }

    .message--user {
      align-self: flex-end;
      align-items: flex-end;
    }

    .message--assistant {
      align-self: flex-start;
      max-width: min(76ch, 94%);
    }

    .message__role {
      font-family: var(--font-mono);
      font-size: 0.6rem;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: var(--bone-faint);
      padding: 0 0.15rem;
    }
    .message--assistant .message__role { color: var(--gilt); }

    .message__content {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.62;
    }

    .message--user .message__content {
      font-family: var(--font-sans);
      font-size: 0.95rem;
      color: var(--bone);
      background: linear-gradient(180deg, var(--ink-700), var(--ink-750));
      border: 1px solid var(--line-2);
      border-radius: 12px 12px 4px 12px;
      padding: 0.7rem 1rem;
    }

    .message--assistant .message__content {
      font-family: var(--font-display);
      font-optical-sizing: auto;
      font-size: 1.14rem;
      font-weight: 400;
      color: var(--bone);
      background: var(--ink-800);
      border: 1px solid var(--line);
      border-left: 2px solid var(--gilt-deep);
      border-radius: 3px 12px 12px 3px;
      padding: 1rem 1.3rem;
      box-shadow: var(--shadow-card);
    }
  `,
})
export class MessageComponent {
  /** The message to render. */
  readonly message = input.required<Message>();
}
