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
      <h1 class="cost-dashboard__title">Usage &amp; Cost</h1>

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
    .cost-dashboard {
      padding: 1.5rem;
      max-width: 900px;
    }

    .cost-dashboard__title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem;
    }

    .cost-dashboard__since {
      font-size: 0.875rem;
      color: #6c757d;
      margin: 0 0 1rem;
    }

    .cost-dashboard__loading,
    .cost-dashboard__empty {
      color: #6c757d;
      font-size: 0.875rem;
    }

    .cost-dashboard__error {
      color: #842029;
      background: #f8d7da;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .usage-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .usage-table th,
    .usage-table td {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #dee2e6;
      text-align: left;
    }

    .usage-table th {
      font-weight: 600;
      background: #f8f9fa;
    }

    .usage-table__num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
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
