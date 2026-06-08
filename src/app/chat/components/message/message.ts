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
      gap: 0.25rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      max-width: 80%;
    }

    .message--user {
      align-self: flex-end;
      background: #e8f0fe;
    }

    .message--assistant {
      align-self: flex-start;
      background: #f8f9fa;
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
export class MessageComponent {
  /** The message to render. */
  readonly message = input.required<Message>();
}
