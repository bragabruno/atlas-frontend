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
              <span class="citation__id">{{ cite.sourceId }}</span>
              <strong class="citation__title">{{ cite.title }}</strong>
              @if (cite.excerpt) {
                <p class="citation__excerpt">{{ cite.excerpt }}</p>
              }
              @if (cite.location) {
                <span class="citation__location">{{ cite.location }}</span>
              }
            </li>
          }
        </ul>
      }
    </aside>
  `,
  styles: `
    .citations-panel {
      width: 260px;
      min-width: 200px;
      border-left: 1px solid #dee2e6;
      padding: 1rem;
      overflow-y: auto;
      background: #fafafa;
    }

    .citations-panel__title {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #6c757d;
      margin: 0 0 0.75rem;
    }

    .citations-panel__empty {
      font-size: 0.875rem;
      color: #adb5bd;
    }

    .citations-panel__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .citation {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 0.8125rem;
      border-left: 3px solid #0d6efd;
      padding-left: 0.5rem;
    }

    .citation__id {
      font-size: 0.7rem;
      color: #adb5bd;
    }

    .citation__title {
      font-weight: 600;
      color: #212529;
    }

    .citation__excerpt {
      margin: 0;
      color: #495057;
      font-style: italic;
    }

    .citation__location {
      color: #6c757d;
      font-size: 0.7rem;
    }
  `,
})
export class CitationsPanelComponent {
  /** Source citations to display. Empty array = placeholder state. */
  readonly citations = input<Citation[]>([]);
}
