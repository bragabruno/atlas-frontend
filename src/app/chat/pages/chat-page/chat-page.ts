import { Component, inject } from '@angular/core';

import { ChatStateStore } from '../../store/chat-state-store';
import { MessageListComponent } from '../../components/message-list/message-list';
import { ComposerComponent } from '../../components/composer/composer';
import { CitationsPanelComponent } from '../../components/citations-panel/citations-panel';

/** Default model sent to the gateway. Can be made configurable later. */
const DEFAULT_MODEL = 'atlas-rag';

/**
 * ChatPageComponent — primary view for the RegDoc Q&A interface.
 *
 * Composes MessageList, Composer, and CitationsPanel around the ChatStateStore
 * (Signals-based service-store, ADR-018).  Drives all UI affordances — spinner,
 * disabled composer, error/rate-limited/budget banners — from the store status.
 */
@Component({
  selector: 'atlas-chat-page',
  standalone: true,
  imports: [MessageListComponent, ComposerComponent, CitationsPanelComponent],
  template: `
    <div class="chat-layout">
      <main class="chat-main">
        <atlas-message-list
          [messages]="store.messages()"
          [streamingContent]="store.streamingContent()"
        />

        <!-- Status banners ------------------------------------------------- -->
        @if (store.status() === 'error') {
          <div class="banner banner--error" role="alert">
            <span>Error: {{ store.error()?.message }}</span>
            <button class="banner__dismiss" (click)="store.dismiss()">Dismiss</button>
          </div>
        }

        @if (store.status() === 'rate_limited') {
          <div class="banner banner--warning" role="alert">
            <span>
              Rate limited.
              @if (store.retryAfter()) {
                Retry in {{ store.retryAfter() }}s.
              }
            </span>
            <button class="banner__dismiss" (click)="store.dismiss()">Dismiss</button>
          </div>
        }

        @if (store.status() === 'budget_exceeded') {
          <div class="banner banner--error" role="alert">
            <span>Budget exceeded for this API key.</span>
            <button class="banner__dismiss" (click)="store.dismiss()">Dismiss</button>
          </div>
        }
        <!-- ---------------------------------------------------------------- -->

        <atlas-composer [disabled]="store.isBusy()" (submitted)="onSubmit($event)" />
      </main>

      <atlas-citations-panel [citations]="citations" />
    </div>
  `,
  styles: `
    .chat-layout {
      display: flex;
      height: 100%;
      overflow: hidden;
    }

    .chat-main {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }

    .banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .banner--error {
      background: #f8d7da;
      color: #842029;
      border-top: 1px solid #f5c2c7;
    }

    .banner--warning {
      background: #fff3cd;
      color: #664d03;
      border-top: 1px solid #ffecb5;
    }

    .banner__dismiss {
      background: none;
      border: none;
      cursor: pointer;
      font-weight: 600;
      padding: 0 0.25rem;
      color: inherit;
      text-decoration: underline;
    }
  `,
})
export class ChatPageComponent {
  protected readonly store = inject(ChatStateStore);

  /**
   * Citations list — placeholder for the source_ids wire-up that comes in a
   * later ticket (CitationsPanel is rendered but empty until then).
   */
  protected readonly citations = [];

  protected onSubmit(question: string): void {
    void this.store.submit(question, DEFAULT_MODEL);
  }
}
