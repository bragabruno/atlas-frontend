import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CostDashboardComponent } from './cost-dashboard.component';
import { UsageService } from '../../services/usage.service';
import type { UsageResponse } from '../../services/usage.service';

function configure(usageStub: Partial<UsageService>) {
  TestBed.configureTestingModule({
    imports: [CostDashboardComponent],
    providers: [{ provide: UsageService, useValue: usageStub }],
  });
}

const SAMPLE: UsageResponse = {
  since: '2026-06-01',
  rows: [
    { app: 'atlas-frontend', model: 'gpt-4o', input_tokens: 1000, output_tokens: 500, total_cost_usd: '0.0123' },
  ],
};

describe('CostDashboardComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders a usage row with a $-prefixed cost on success', () => {
    configure({ getUsage: vi.fn(() => of(SAMPLE)) });
    const fixture = TestBed.createComponent(CostDashboardComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('atlas-frontend');
    expect(text).toContain('gpt-4o');
    expect(text).toContain('$0.0123');
    expect(text).toContain('Since 2026-06-01');
  });

  it('shows the empty state when there are no rows', () => {
    configure({ getUsage: vi.fn(() => of({ since: '2026-06-01', rows: [] })) });
    const fixture = TestBed.createComponent(CostDashboardComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No usage recorded');
  });

  it('shows an error banner when the request fails', () => {
    configure({ getUsage: vi.fn(() => throwError(() => new Error('boom'))) });
    const fixture = TestBed.createComponent(CostDashboardComponent);
    fixture.detectChanges();

    const banner = fixture.debugElement.query(By.css('.cost-dashboard__error'));
    expect(banner).toBeTruthy();
    expect(banner.nativeElement.textContent).toContain('boom');
  });
});
