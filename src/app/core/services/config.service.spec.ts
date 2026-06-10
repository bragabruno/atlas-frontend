import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';

import { ConfigService, RuntimeConfig } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ConfigService,
      ],
    });
    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with null config', () => {
    expect(service.config()).toBeNull();
  });

  it('loads config from /config.json and exposes it', async () => {
    const mockConfig: RuntimeConfig = {
      gatewayUrl: 'http://test-gateway:8080',
    };

    const loadPromise = service.load();

    const req = httpMock.expectOne('/config.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);

    await loadPromise;

    expect(service.config()).toEqual(mockConfig);
    expect(service.gatewayUrl).toBe('http://test-gateway:8080');
  });

  it('gatewayUrl throws before load() completes', () => {
    expect(() => service.gatewayUrl).toThrowError(
      'ConfigService.load() has not completed yet.',
    );
  });

  it('loads optional bearerToken without hardcoding it', async () => {
    const mockConfig: RuntimeConfig = {
      gatewayUrl: 'http://test-gateway:8080',
      bearerToken: 'runtime-token-from-config',
    };

    const loadPromise = service.load();
    httpMock.expectOne('/config.json').flush(mockConfig);
    await loadPromise;

    // Token is present in runtime config, not embedded as a literal in source.
    expect(service.config()?.bearerToken).toBe('runtime-token-from-config');
  });

  it('does not contain any hardcoded API key or secret string', () => {
    // Ensure the source files themselves contain no literal secrets.
    // This is a canary: if any key/token string is accidentally baked in,
    // the test fails. Actual secrets should only arrive via config.json at runtime.
    const hardcodedPatterns = [
      /sk-[A-Za-z0-9]{20,}/,   // OpenAI-style key
      /Bearer\s+[A-Za-z0-9._-]{20,}/, // hardcoded bearer token
      /api[_-]?key\s*[:=]\s*['"][A-Za-z0-9._-]{8,}/i,
    ];

    // Validate ConfigService source text (injected at build time by Vitest's
    // import.meta.glob is unavailable in TestBed context, so we assert the
    // module's own exported symbol bears no key literals — structural guard).
    const serviceSource = ConfigService.toString();
    for (const pattern of hardcodedPatterns) {
      expect(serviceSource).not.toMatch(pattern);
    }
  });
});
