import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { UsageService } from './usage.service';
import { ConfigService } from '../../core/services/config.service';

function provideService(): { service: UsageService; http: HttpTestingController } {
  const configStub = { gatewayUrl: 'http://gw' } as ConfigService;

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      UsageService,
      { provide: ConfigService, useValue: configStub },
    ],
  });

  return {
    service: TestBed.inject(UsageService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('UsageService', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('calls GET /v1/usage without since param by default', () => {
    const { service, http } = provideService();

    service.getUsage().subscribe();

    const req = http.expectOne((r) => r.url === 'http://gw/v1/usage');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('since')).toBe(false);
    req.flush({ since: '2026-06-01', rows: [] });
  });

  it('passes since param when provided', () => {
    const { service, http } = provideService();

    service.getUsage('2026-01-01').subscribe();

    const req = http.expectOne('http://gw/v1/usage?since=2026-01-01');
    expect(req.request.params.get('since')).toBe('2026-01-01');
    req.flush({ since: '2026-01-01', rows: [] });
  });

  it('emits the response rows', () => {
    const { service, http } = provideService();
    const mockResp = {
      since: '2026-06-01',
      rows: [
        { app: 'fe', model: 'gpt-4o', input_tokens: 100, output_tokens: 50, total_cost_usd: '0.01' },
      ],
    };

    let result: unknown;
    service.getUsage().subscribe((r) => { result = r; });

    http.expectOne((r) => r.url === 'http://gw/v1/usage').flush(mockResp);
    expect((result as typeof mockResp).rows).toHaveLength(1);
    expect((result as typeof mockResp).rows[0].model).toBe('gpt-4o');
  });
});
