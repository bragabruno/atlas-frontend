import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { ConfigService, RuntimeConfig } from './config.service';
import { GatewayService } from './gateway.service';
import type { ChatCompletionRequest, ChatCompletionResponse } from './gateway.service';

const GATEWAY_URL = 'http://test-gateway:8080';

function makeConfigStub(cfg: RuntimeConfig): Pick<ConfigService, 'config' | 'gatewayUrl'> {
  const s = signal<RuntimeConfig | null>(cfg).asReadonly();
  return {
    config: s,
    get gatewayUrl() {
      return cfg.gatewayUrl;
    },
  };
}

describe('GatewayService', () => {
  let service: GatewayService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ConfigService,
          useValue: makeConfigStub({
            gatewayUrl: GATEWAY_URL,
            bearerToken: 'test-token',
          }),
        },
        GatewayService,
      ],
    });

    service = TestBed.inject(GatewayService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('issues a POST to /v1/chat/completions with the typed request body', () => {
    const request: ChatCompletionRequest = {
      model: 'atlas-rag',
      messages: [{ role: 'user', content: 'What is REACH regulation?' }],
      stream: false,
    };

    service.chatCompletion(request).subscribe();

    const req = httpMock.expectOne(`${GATEWAY_URL}/v1/chat/completions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({} as ChatCompletionResponse);
  });

  it('emits the typed ChatCompletionResponse returned by the gateway', async () => {
    const mockResponse: ChatCompletionResponse = {
      id: 'chatcmpl-abc123',
      created: 1700000000,
      model: 'atlas-rag',
      object: 'chat.completion',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'REACH is a regulation...' },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    };

    const result = new Promise<ChatCompletionResponse>((resolve) => {
      service
        .chatCompletion({
          model: 'atlas-rag',
          messages: [{ role: 'user', content: 'REACH?' }],
          stream: false,
        })
        .subscribe((response) => resolve(response));
    });

    httpMock.expectOne(`${GATEWAY_URL}/v1/chat/completions`).flush(mockResponse);

    expect(await result).toEqual(mockResponse);
  });

  it('constructs the URL from ConfigService.gatewayUrl', () => {
    service
      .chatCompletion({
        model: 'atlas-rag',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
      })
      .subscribe();

    const req = httpMock.expectOne(`${GATEWAY_URL}/v1/chat/completions`);
    expect(req.request.url).toBe(`${GATEWAY_URL}/v1/chat/completions`);
    req.flush({});
  });

  it('sends optional fields when provided', () => {
    const request: ChatCompletionRequest = {
      model: 'atlas-rag',
      messages: [{ role: 'user', content: 'Test' }],
      stream: false,
      max_tokens: 512,
      temperature: 0.7,
    };

    service.chatCompletion(request).subscribe();

    const req = httpMock.expectOne(`${GATEWAY_URL}/v1/chat/completions`);
    expect(req.request.body).toMatchObject({ max_tokens: 512, temperature: 0.7 });
    req.flush({});
  });
});
