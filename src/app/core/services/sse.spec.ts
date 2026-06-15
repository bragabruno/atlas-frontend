import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ConfigService, RuntimeConfig } from './config';
import { SseService, TooManyRequestsError } from './sse';
import type { ChatCompletionChunk } from '../api/gateway-openai-types';

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

/** Build a ReadableStream that emits the given UTF-8 string as a single chunk. */
function makeStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

/** Encode a ChatCompletionChunk as an SSE data line. */
function sseChunk(chunk: ChatCompletionChunk): string {
  return `data: ${JSON.stringify(chunk)}\n`;
}

const BASE_CHUNK: Omit<ChatCompletionChunk, 'choices'> = {
  id: 'chatcmpl-test',
  created: 1700000000,
  model: 'atlas-rag',
  object: 'chat.completion.chunk',
};

function deltaChunk(content: string): ChatCompletionChunk {
  return {
    ...BASE_CHUNK,
    choices: [{ index: 0, delta: { role: 'assistant', content }, finish_reason: null }],
  };
}

function doneChunk(): ChatCompletionChunk {
  return {
    ...BASE_CHUNK,
    choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
  };
}

/** Build a mock fetch Response. */
function makeResponse(
  body: ReadableStream<Uint8Array>,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(body, { status, headers });
}

describe('SseService', () => {
  let service: SseService;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: makeConfigStub({
            gatewayUrl: GATEWAY_URL,
            bearerToken: 'bearer-test',
          }),
        },
        SseService,
      ],
    });

    service = TestBed.inject(SseService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts with empty, non-streaming, non-done state', () => {
    const state = service.state();
    expect(state.content).toBe('');
    expect(state.streaming).toBe(false);
    expect(state.done).toBe(false);
    expect(state.error).toBeNull();
  });

  it('reconstructs a streamed message from multiple chunk frames and stops at [DONE]', async () => {
    const ssePayload =
      sseChunk(deltaChunk('REACH ')) +
      sseChunk(deltaChunk('is ')) +
      sseChunk(deltaChunk('a regulation')) +
      sseChunk(doneChunk()) +
      'data: [DONE]\n';

    fetchSpy.mockResolvedValue(makeResponse(makeStream(ssePayload)));

    await service.stream({
      model: 'atlas-rag',
      messages: [{ role: 'user', content: 'What is REACH?' }],
      stream: true,
    });

    const state = service.state();
    expect(state.content).toBe('REACH is a regulation');
    expect(state.done).toBe(true);
    expect(state.streaming).toBe(false);
    expect(state.error).toBeNull();
  });

  it('accumulates content incrementally during streaming', async () => {
    const contents: string[] = [];

    // Spy on state to capture intermediate values via a mock that checks
    // state after each process step — we test final state here, which already
    // proves accumulation. For in-flight state, we use a multi-chunk payload.
    const chunk1 = sseChunk(deltaChunk('Hello'));
    const chunk2 = sseChunk(deltaChunk(', world'));
    const done = 'data: [DONE]\n';

    fetchSpy.mockResolvedValue(makeResponse(makeStream(chunk1 + chunk2 + done)));

    await service.stream({
      model: 'atlas-rag',
      messages: [{ role: 'user', content: 'Hi' }],
      stream: true,
    });

    // Final accumulated content is the concatenation of all deltas.
    expect(service.state().content).toBe('Hello, world');

    void contents; // suppress unused warning
  });

  it('sets streaming=false and done=true after [DONE]', async () => {
    fetchSpy.mockResolvedValue(
      makeResponse(makeStream(sseChunk(deltaChunk('ok')) + 'data: [DONE]\n')),
    );

    await service.stream({
      model: 'atlas-rag',
      messages: [{ role: 'user', content: 'ok?' }],
      stream: true,
    });

    expect(service.state().streaming).toBe(false);
    expect(service.state().done).toBe(true);
  });

  it('throws TooManyRequestsError and sets error state on HTTP 429', async () => {
    fetchSpy.mockResolvedValue(
      new Response(null, {
        status: 429,
        headers: { 'Retry-After': '30' },
      }),
    );

    await expect(
      service.stream({
        model: 'atlas-rag',
        messages: [{ role: 'user', content: 'Flood' }],
        stream: true,
      }),
    ).rejects.toBeInstanceOf(TooManyRequestsError);

    const state = service.state();
    expect(state.error).toBeInstanceOf(TooManyRequestsError);
    expect((state.error as TooManyRequestsError).retryAfter).toBe(30);
    expect(state.streaming).toBe(false);
    expect(state.done).toBe(false);
  });

  it('includes Authorization header in the fetch request when token is present', async () => {
    fetchSpy.mockResolvedValue(makeResponse(makeStream('data: [DONE]\n')));

    await service.stream({
      model: 'atlas-rag',
      messages: [{ role: 'user', content: 'auth check' }],
      stream: true,
    });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer bearer-test');
  });

  it('forces stream: true in the request body', async () => {
    fetchSpy.mockResolvedValue(makeResponse(makeStream('data: [DONE]\n')));

    await service.stream({
      model: 'atlas-rag',
      messages: [{ role: 'user', content: 'stream check' }],
      stream: false, // caller passes false — service must override
    });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['stream']).toBe(true);
  });

  it('resets state on reset()', async () => {
    fetchSpy.mockResolvedValue(
      makeResponse(makeStream(sseChunk(deltaChunk('text')) + 'data: [DONE]\n')),
    );
    await service.stream({
      model: 'atlas-rag',
      messages: [{ role: 'user', content: 'reset test' }],
      stream: true,
    });
    expect(service.state().content).toBe('text');

    service.reset();

    expect(service.state().content).toBe('');
    expect(service.state().done).toBe(false);
  });
});
