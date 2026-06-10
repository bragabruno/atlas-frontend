import { Component, inject } from '@angular/core';

import { ConfigService } from '../../../core/services/config.service';
import { ChatStateStore } from '../../store/chat-state.store';
import { MessageListComponent } from '../../components/message-list/message-list.component';
import { ComposerComponent } from '../../components/composer/composer.component';
import { CitationsPanelComponent } from '../../components/citations-panel/citations-panel.component';

/** Fallback model when runtime config does not specify `defaultModel`. */
const FALLBACK_MODEL = 'atlas-rag';

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

        <atlas-composer
          [disabled]="store.isBusy()"
          (submitted)="onSubmit($event)"
        />
      </main>

      <atlas-citations-panel [citations]="store.citations()" />
    </div>
  `,
  styles: `
    :host { display: block; height: 100%; }

    .chat-layout {
      display: flex;
      height: 100%;
      overflow: hidden;
    }

    .chat-main {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      background:
        radial-gradient(80% 50% at 50% 0%, rgba(201, 163, 91, 0.05), transparent 70%);
    }

    .banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin: 0 1.25rem 0.85rem;
      padding: 0.7rem 0.9rem;
      font-family: var(--font-sans);
      font-size: 0.84rem;
      border-radius: var(--r-md);
      border: 1px solid var(--line-2);
      animation: atlas-rise 0.3s ease both;
    }

    .banner--error {
      background: var(--oxblood-bg);
      color: #efc7bd;
      border-color: rgba(168, 65, 47, 0.45);
      border-left: 3px solid var(--oxblood);
    }

    .banner--warning {
      background: var(--amber-bg);
      color: #ecd2a3;
      border-color: rgba(207, 154, 69, 0.45);
      border-left: 3px solid var(--amber);
    }

    .banner__dismiss {
      flex: none;
      background: none;
      border: 1px solid var(--line-2);
      color: inherit;
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 0.3rem 0.65rem;
      border-radius: var(--r-sm);
      transition: background 0.15s ease, border-color 0.15s ease;
    }

    .banner__dismiss:hover {
      background: rgba(242, 234, 219, 0.06);
      border-color: var(--line-3);
    }

    @media (max-width: 860px) {
      .chat-layout { flex-direction: column; }
    }
  `,
})
export class ChatPageComponent {
  protected readonly store = inject(ChatStateStore);
  private readonly config = inject(ConfigService);

  protected onSubmit(question: string): void {
    const model = this.config.config()?.defaultModel ?? FALLBACK_MODEL;
    void this.store.submit(question, model);
  }
}
