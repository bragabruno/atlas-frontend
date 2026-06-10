import { Component, input } from '@angular/core';

import type { Citation } from '../../../shared/models';

/**
 * CitationsPanelComponent — sidebar panel listing source citations.
 *
 * Currently displays citations received from the RAG agent via source_ids.
 * When the citations array is empty the panel renders a placeholder so it
 * occupies the intended layout slot without shifting content.
 */
@Component({
  selector: 'atlas-citations-panel',
  standalone: true,
  imports: [],
  template: `
    <aside class="citations-panel">
      <h2 class="citations-panel__title">Sources</h2>

      @if (citations().length === 0) {
        <p class="citations-panel__empty">No sources cited yet.</p>
      } @else {
        <ul class="citations-panel__list">
          @for (cite of citations(); track cite.sourceId) {
            <li class="citation">
              <span class="citation__index" aria-hidden="true">{{ $index + 1 }}</span>
              <div class="citation__body">
                <span class="citation__id">{{ cite.sourceId }}</span>
                <strong class="citation__title">{{ cite.title }}</strong>
                @if (cite.excerpt) {
                  <p class="citation__excerpt">{{ cite.excerpt }}</p>
                }
                @if (cite.location) {
                  <span class="citation__location">{{ cite.location }}</span>
                }
              </div>
            </li>
          }
        </ul>
      }
    </aside>
  `,
  styles: `
    .citations-panel {
      width: 300px;
      min-width: 240px;
      flex: none;
      border-left: 1px solid var(--line-2);
      padding: 1.5rem 1.25rem;
      overflow-y: auto;
      background: var(--ink-850);
    }

    .citations-panel__title {
      font-family: var(--font-mono);
      font-size: 0.64rem;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--gilt);
      margin: 0 0 1.1rem;
      padding-bottom: 0.7rem;
      border-bottom: 1px solid var(--line);
    }

    .citations-panel__empty {
      font-family: var(--font-sans);
      font-size: 0.84rem;
      font-style: italic;
      color: var(--bone-faint);
    }

    .citations-panel__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .citation {
      display: flex;
      gap: 0.7rem;
      padding: 0.7rem 0.8rem;
      background: var(--ink-800);
      border: 1px solid var(--line);
      border-radius: var(--r-md);
      transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
      animation: atlas-rise 0.3s ease both;
    }
    .citation:hover {
      transform: translateY(-2px);
      border-color: var(--gilt-wash-2);
      box-shadow: 0 12px 26px -18px rgba(0, 0, 0, 0.85);
    }

    .citation__index {
      flex: none;
      width: 1.5rem;
      height: 1.5rem;
      display: grid;
      place-items: center;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--gilt-bright);
      background: var(--gilt-wash);
      border: 1px solid var(--gilt-wash-2);
      border-radius: 50%;
    }

    .citation__body {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-width: 0;
    }

    .citation__id {
      font-family: var(--font-mono);
      font-size: 0.66rem;
      letter-spacing: 0.04em;
      color: var(--bone-faint);
    }

    .citation__title {
      font-family: var(--font-display);
      font-weight: 500;
      font-size: 0.95rem;
      color: var(--bone);
      word-break: break-word;
    }

    .citation__excerpt {
      margin: 0.15rem 0 0;
      font-family: var(--font-sans);
      font-size: 0.8rem;
      line-height: 1.45;
      font-style: italic;
      color: var(--bone-mute);
    }

    .citation__location {
      font-family: var(--font-mono);
      font-size: 0.66rem;
      color: var(--bone-faint);
    }
  `,
})
export class CitationsPanelComponent {
  /** Source citations to display. Empty array = placeholder state. */
  readonly citations = input<Citation[]>([]);
}
