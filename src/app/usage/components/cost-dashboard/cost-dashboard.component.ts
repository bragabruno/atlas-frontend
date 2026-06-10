import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { UsageService } from '../../services/usage.service';
import type { UsageRow } from '../../services/usage.service';

@Component({
  selector: 'atlas-cost-dashboard',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <section class="cost-dashboard">
      <header class="cost-dashboard__head">
        <span class="cost-dashboard__eyebrow">Ledger</span>
        <h1 class="cost-dashboard__title">Usage &amp; Cost</h1>
      </header>

      @if (loading()) {
        <p class="cost-dashboard__loading">Loading usage data…</p>
      } @else if (error()) {
        <p class="cost-dashboard__error" role="alert">{{ error() }}</p>
      } @else {
        <p class="cost-dashboard__since">Since {{ since() }}</p>

        @if (rows().length === 0) {
          <p class="cost-dashboard__empty">No usage recorded in this window.</p>
        } @else {
          <table class="usage-table">
            <thead>
              <tr>
                <th>App</th>
                <th>Model</th>
                <th class="usage-table__num">Input tokens</th>
                <th class="usage-table__num">Output tokens</th>
                <th class="usage-table__num">Cost (USD)</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.app + row.model) {
                <tr>
                  <td>{{ row.app }}</td>
                  <td>{{ row.model }}</td>
                  <td class="usage-table__num">{{ row.input_tokens | number }}</td>
                  <td class="usage-table__num">{{ row.output_tokens | number }}</td>
                  <td class="usage-table__num">{{ '$' + row.total_cost_usd }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      }
    </section>
  `,
  styles: `
    :host { display: block; height: 100%; overflow-y: auto; }

    .cost-dashboard {
      max-width: 960px;
      margin: 0 auto;
      padding: 2.5rem 1.75rem 3rem;
      animation: atlas-rise 0.4s ease both;
    }

    .cost-dashboard__head {
      margin-bottom: 1.25rem;
      padding-bottom: 1.1rem;
      border-bottom: 1px solid var(--line-2);
    }
    .cost-dashboard__eyebrow {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--gilt);
    }
    .cost-dashboard__title {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 500;
      color: var(--bone);
      margin: 0.35rem 0 0;
    }

    .cost-dashboard__since {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      color: var(--bone-mute);
      margin: 0 0 1.4rem;
    }

    .cost-dashboard__loading,
    .cost-dashboard__empty {
      font-family: var(--font-sans);
      font-size: 0.9rem;
      font-style: italic;
      color: var(--bone-mute);
      padding: 2rem 0;
    }

    .cost-dashboard__error {
      color: #efc7bd;
      background: var(--oxblood-bg);
      border: 1px solid rgba(168, 65, 47, 0.4);
      border-left: 3px solid var(--oxblood);
      padding: 0.7rem 0.9rem;
      border-radius: var(--r-md);
      font-family: var(--font-sans);
      font-size: 0.85rem;
    }

    .usage-table {
      width: 100%;
      border-collapse: collapse;
    }

    .usage-table th {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 500;
      color: var(--bone-mute);
      text-align: left;
      padding: 0 0.9rem 0.7rem;
      border-bottom: 1px solid var(--line-2);
    }

    .usage-table td {
      font-family: var(--font-sans);
      font-size: 0.9rem;
      color: var(--bone);
      padding: 0.85rem 0.9rem;
      border-bottom: 1px solid var(--line);
    }

    .usage-table tbody tr { transition: background 0.15s ease; }
    .usage-table tbody tr:hover { background: var(--gilt-wash); }

    .usage-table__num {
      text-align: right;
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
    }
    td.usage-table__num { color: var(--gilt-bright); }
  `,
})
export class CostDashboardComponent implements OnInit {
  private readonly usageService = inject(UsageService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rows = signal<UsageRow[]>([]);
  readonly since = signal<string>('');

  ngOnInit(): void {
    this.usageService.getUsage().subscribe({
      next: (resp) => {
        this.rows.set(resp.rows);
        this.since.set(resp.since);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load usage data.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }
}
