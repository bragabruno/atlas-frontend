import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { ConfigService, RuntimeConfig } from '../services/config';
import { authInterceptor } from './auth-interceptor';

/** Build a minimal ConfigService stub with a preset RuntimeConfig. */
function makeConfigStub(cfg: RuntimeConfig | null): Pick<ConfigService, 'config'> {
  return { config: signal(cfg).asReadonly() };
}

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  function setup(cfg: RuntimeConfig | null) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: ConfigService,
          useValue: makeConfigStub(cfg),
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('attaches Authorization header to gateway requests when token is present', () => {
    setup({
      gatewayUrl: 'http://gateway:8080',
      bearerToken: 'test-token-xyz',
    });

    http.get('http://gateway:8080/v1/chat/completions').subscribe();

    const req = httpMock.expectOne('http://gateway:8080/v1/chat/completions');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-xyz');
    req.flush({});
  });

  it('does NOT attach Authorization header to non-gateway requests', () => {
    setup({
      gatewayUrl: 'http://gateway:8080',
      bearerToken: 'test-token-xyz',
    });

    http.get('http://other-service/api/data').subscribe();

    const req = httpMock.expectOne('http://other-service/api/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('does NOT attach Authorization header when bearerToken is absent', () => {
    setup({ gatewayUrl: 'http://gateway:8080' });

    http.get('http://gateway:8080/v1/chat/completions').subscribe();

    const req = httpMock.expectOne('http://gateway:8080/v1/chat/completions');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('passes through requests unmodified when config is null', () => {
    setup(null);

    http.get('http://gateway:8080/v1/chat/completions').subscribe();

    const req = httpMock.expectOne('http://gateway:8080/v1/chat/completions');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('does not contain any hardcoded bearer token or API key in source', () => {
    setup(null);

    const interceptorSource = authInterceptor.toString();
    const hardcodedPatterns = [
      /sk-[A-Za-z0-9]{20,}/,
      /Bearer\s+[A-Za-z0-9._-]{20,}/,
      /api[_-]?key\s*[:=]\s*['"][A-Za-z0-9._-]{8,}/i,
    ];

    for (const pattern of hardcodedPatterns) {
      expect(interceptorSource).not.toMatch(pattern);
    }
  });
});
