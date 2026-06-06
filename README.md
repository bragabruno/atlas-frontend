# atlas-frontend

RegDoc Q&A single-page application — Angular + TypeScript.

## Purpose

`atlas-frontend` is the browser client for the Atlas RegDoc Q&A demo. It lets users ask regulatory-document questions, receive streamed answers, inspect source citations, and monitor per-key token and cost usage. It mirrors Enhesa's Angular + TypeScript frontend stack.

## Architecture overview

The SPA is organized into four Angular modules:

| Module | Responsibility |
|---|---|
| `CoreModule` | `GatewayService`, `SseService`, `AuthInterceptor`, `ConfigService` |
| `ChatModule` | `ChatPageComponent`, `MessageListComponent`, `ComposerComponent`, `CitationsPanelComponent`, `MessageComponent` |
| `UsageModule` | `CostDashboardComponent` |
| `SharedModule` | Models: `Message`, `Citation`, `Usage`, `ChatRequest` |

State (request/stream lifecycle) is managed via a lightweight service-based store or NgRx. A route guard enforces authentication before any protected view is accessible.

## Gateway integration

The frontend talks **only** to `atlas-gateway` (OpenAI-compatible API):

- **Endpoint:** `POST /v1/chat/completions`
- **Transport:** SSE streaming — receives `chat.completion.chunk` deltas, terminates on `data: [DONE]`
- **Auth:** per-key bearer token passed in `Authorization: Bearer <token>`
- **Responses surface:**
  - Streamed answer text rendered incrementally in the chat view
  - `source_ids` from the RAG agent, rendered in the **Citations panel**
  - Per-key token counts and cost from the accounting layer, shown in the **Cost/Usage view**

## Secrets and configuration

**No API keys or tokens are ever hardcoded in the SPA.**

Keys/tokens are injected at runtime via one of:
- A **backend-for-frontend (BFF)** that proxies requests and attaches credentials server-side, or
- A **secured runtime config endpoint** (`/assets/config.json` served by a protected CDN/edge layer) consumed by `ConfigService` on app init.

The Angular build artifacts contain no secrets. `.env` files are git-ignored.

## Diagrams

| Diagram | Path |
|---|---|
| Angular module/component tree | [`docs/diagrams/component-tree.md`](docs/diagrams/component-tree.md) |
| Module/class relationships (PlantUML) | [`docs/diagrams/module-class.puml`](docs/diagrams/module-class.puml) |
| Screen wire-flow | [`docs/diagrams/screen-wireflow.md`](docs/diagrams/screen-wireflow.md) |
| Frontend ↔ gateway sequence | [`docs/diagrams/seq-frontend-gateway.md`](docs/diagrams/seq-frontend-gateway.md) |
| Chat request/stream state model | [`docs/diagrams/state-model.md`](docs/diagrams/state-model.md) |

## Related

- [`atlas-gateway`](../atlas-gateway) — OpenAI-compatible API gateway, RAG agent, accounting
- [`atlas-docs`](../atlas-docs) — system-wide architecture documentation

## Development

```bash
npm install
ng serve            # dev server on http://localhost:4200
ng build --prod     # production build → dist/
ng test             # unit tests (Karma/Jest)
ng lint             # ESLint
```

Runtime config is read from `src/assets/config.json` (not committed; provided by deployment). See `ConfigService` for the expected shape.
