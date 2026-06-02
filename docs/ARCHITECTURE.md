# Architecture

> A deep look at how Kairos AI is built — every layer, every contract, every trade-off.

## High-level diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         User's browser                           │
└──────────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  frontend   ─  React 18 + Vite + TS + Tailwind v4 + shadcn        │
│                Hosted on Vercel · CDN-served · code-split routes │
└──────────────────────────────────────────────────────────────────┘
              │                                    │
              │ Bearer JWT (Clerk)                 │ SSE stream
              ▼                                    ▼
┌────────────────────────────┐     ┌──────────────────────────────┐
│  backend/api  (Express + TS)  │     │  backend/ml  (FastAPI + Python) │
│  Mongoose · Zod · Helmet   │     │  LangGraph · Loguru · Pydantic│
│  Hosted on Render          │     │  Hosted on HuggingFace Spaces │
└────────────────────────────┘     └──────────────────────────────┘
              │                                    │
              │ MongoDB driver                     │ Provider abstraction
              ▼                                    ▼
┌────────────────────────────┐     ┌──────────────────────────────┐
│  MongoDB Atlas (M0)        │     │  Groq Llama-3.3-70B          │
│  problems · users ·        │     │  (+ Llama-3.1-8B fallback)    │
│  submissions · sessions    │     │                               │
└────────────────────────────┘     └──────────────────────────────┘

External:
  ├─ Clerk (auth, email verification, sessions, OAuth)
  └─ Piston API (sandboxed code execution, 15+ languages)
```

## Why three services and not a monolith?

Each service has a fundamentally different job:

| Service    | Job                                    | Runtime | Why a separate service?                                                   |
| ---------- | -------------------------------------- | ------- | ------------------------------------------------------------------------- |
| `frontend` | Render UI, talk to two APIs            | Browser | Static-deployable, CDN-cacheable, decoupled from server runtime           |
| `backend/api` | App data + auth + code execution proxy | Node.js | TypeScript-first, MongoDB-friendly, Clerk SDK-friendly                    |
| `backend/ml`  | LLM inference + agentic reasoning      | Python  | The Python ML ecosystem (transformers, LangGraph, vLLM) is non-negotiable |

The split lets us deploy `ml` to HuggingFace Spaces (free GPU) while `api` lives on Render (free Node hosting), and swap the LLM backend without touching the rest.

## Data flow: a complete chat round-trip

When the user types **"Give me a hint"** on the Two Sum page:

1. **Browser** — `<ChatPane>` sends `POST /chat/stream` directly to the ML service.
   Body includes the message, the user's current code, the language, the problem slug, and the intent.

2. **ML service** — `routes/chat.py` receives the request, hands it to `CoachAgent.stream_reply()`.

3. **CoachAgent** — `agent/coach.py` builds:
   - A system prompt tuned for the `hint` intent (`agent/prompts.py::INTENT_PROMPTS`)
   - A context block with the student's code, language, and last error
   - A user message

4. **LLM provider** — `llm/factory.py` picks the configured backend (Groq today). The provider streams tokens via Server-Sent Events.

5. **SSE stream** — Tokens stream back to the browser, the React `ChatPane` accumulates them into a markdown-rendered bubble in real time.

For **code execution**, the path is different — code runs through the Express API:

1. Browser → `POST /api/v1/submissions/run` (with Clerk JWT)
2. Express → Clerk middleware validates token → handler calls `submission.service.ts`
3. Service loads the Mongo `Problem`, fetches its visible test cases
4. For each test case, service calls Piston (`emkc.org/api/v2/piston/execute`) with stdin
5. Service compares stdout vs expected, builds a `RunCodeResponse`, persists a `Submission` doc
6. Browser renders pass/fail per-test in `<ResultsPanel>`

## Layer-by-layer breakdown

### `frontend` — Frontend

```
src/
├── App.tsx                    Top-level routes + Suspense + Protected guards
├── main.tsx                   Mount + providers (Clerk, QueryClient, Theme)
├── routes/                    One file per page
│   ├── landing.tsx            Public marketing
│   ├── auth/                  Clerk-themed sign-in / sign-up
│   ├── onboarding.tsx         3-step preference wizard
│   ├── dashboard.tsx          Stats + recommendations
│   ├── problems.tsx           Searchable + filterable list
│   ├── problem-detail.tsx     ★ Three-pane solver
│   ├── profile.tsx            User card + stats
│   ├── settings.tsx           Theme + account
│   └── not-found.tsx
├── components/
│   ├── ui/                    shadcn-style primitives (Button, Card, Select, …)
│   ├── auth/                  Route guards
│   ├── brand/                 Logo
│   ├── layout/                AppLayout + Navbar
│   └── solver/                ★ Three-pane composition
│       ├── problem-pane.tsx
│       ├── code-editor-pane.tsx     Monaco wrapper
│       ├── results-panel.tsx        Test case results
│       └── chat-pane.tsx            SSE-streaming AI chat
├── lib/
│   ├── env.ts                 Zod-validated env vars
│   ├── api-client.ts          Typed fetch wrapper with auth
│   └── utils.ts               cn(), formatters, helpers
├── providers/
│   └── theme-provider.tsx     Dark/light/system theme
├── data/
│   └── sample-problems.ts     Frontend-only sample data (fallback)
└── styles/
    └── globals.css            Tailwind v4 theme config + base styles
```

**Key choices:**

- **Vite over Next.js** — pure SPA fits this app (no SSR needed), faster builds, simpler deploys.
- **Tailwind v4** — modern CSS, no PostCSS config, design tokens live as CSS variables.
- **shadcn/ui pattern** — primitives copied into our codebase, full control, no opaque library.
- **TanStack Query for server state, Zustand for UI state** — never mix the two.
- **Strict env validation** at module load — fail fast with a clear error if misconfigured.
- **Route-level code splitting** via `lazy()` — initial bundle stays small, each route is its own chunk.

### `backend/api` — Backend

Layered architecture with strict boundaries:

```
src/
├── server.ts                  Bootstrap: connect DB → create app → listen
├── app.ts                     Express factory: middleware + router mount
├── config/
│   ├── env.ts                 Zod-validated env, exits on missing required keys
│   ├── database.ts            Mongoose connection + lifecycle
│   └── logger.ts              Pino structured logger
├── middleware/
│   ├── auth.ts                Clerk middleware + helpers
│   ├── error-handler.ts       Global handler + asyncHandler wrapper
│   └── validate.ts            validateBody/validateQuery/validateParams
├── errors/
│   └── app-error.ts           AppError, ValidationError, NotFoundError, …
├── models/                    Mongoose schemas (User, Problem, Submission)
├── services/                  Pure business logic (no req/res)
│   ├── problem.service.ts
│   ├── submission.service.ts
│   ├── user.service.ts
│   └── piston.service.ts      Sandboxed code execution
├── routes/                    Thin controllers — parse, validate, delegate
│   ├── index.ts               Mount all routers under /api/v1
│   ├── health.routes.ts
│   ├── problem.routes.ts
│   ├── submission.routes.ts
│   └── user.routes.ts
└── scripts/
    └── seed-problems.ts       Idempotent problem upsert with test cases
```

**Strict rules:**

- **Routes never touch Mongoose directly** — they call services.
- **Services never touch req/res** — they take typed args, throw `AppError`, return data.
- **All errors flow through one handler** that maps `AppError` → HTTP, `ZodError` → 400, anything else → 500 + log.
- **Every endpoint validates input with Zod** before reaching service code.
- **Auth is enforced at middleware, not service** — services trust their inputs.

### `backend/ml` — ML service

```
app/
├── main.py                    FastAPI factory + lifespan + CORS + routers
├── config.py                  Pydantic Settings (env-driven)
├── logger.py                  Loguru config
├── schemas.py                 Pydantic models (parity with backend/types)
├── llm/                       ★ Provider abstraction
│   ├── base.py                LLMProvider Protocol + Message
│   ├── factory.py             get_llm_provider() picks the backend
│   └── groq_provider.py       Groq streaming impl (Day 1)
├── agent/                     ★ Coach orchestration
│   ├── coach.py               CoachAgent: streams replies, builds context
│   └── prompts.py             Base system + per-intent overrides
└── routes/
    ├── health.py
    └── chat.py                POST /chat (sync) + POST /chat/stream (SSE)
```

**The provider abstraction is the key insight:**

```python
class LLMProvider(Protocol):
    name: str
    async def stream(self, request: LLMRequest) -> AsyncIterator[str]: ...
    async def complete(self, request: LLMRequest) -> str: ...
```

One concrete provider:

| Provider       | Status   | When to use                                   |
| -------------- | -------- | --------------------------------------------- |
| `GroqProvider` | ✅ Active | Llama-3.3-70B free tier — fast, capable, free |

`groq` is the only supported provider; `factory.py` raises a clear `ValueError`
for any other `LLM_PROVIDER` value.

### `backend/types` — Shared contracts

The single source of truth for cross-service types:

```
src/
├── index.ts        Re-export everything
├── common.ts       Pagination, Language enums, Piston/Monaco language maps
├── problem.ts      Problem, ProblemSummary, ProblemListQuery + Zod
├── submission.ts   RunCodeRequest/Response, SubmissionStatus + Zod
├── chat.ts         ChatRequest, ChatMessage, ChatStreamChunk + Zod
└── user.ts         UserProfile, UserPreferences, UserStats + Zod
```

**Why TS + Zod, not just types?** We need the same shape at runtime for validation. Zod gives us both (`z.infer<typeof schema>` produces a TS type from a runtime schema).

**Why not OpenAPI?** Over-engineered for a 2-service repo. Reach for it once we have third-party API consumers.

## Auth flow (Clerk)

1. User clicks "Sign up" → `frontend/src/routes/auth/sign-up.tsx` mounts `<SignUp>` from `@clerk/clerk-react`.
2. Clerk handles email + verification + OAuth fully — we never touch passwords.
3. After sign-up, Clerk redirects to `/onboarding`. After sign-in, to `/dashboard`.
4. `<ProtectedRoute>` checks `useAuth()` — redirects to `/sign-in` if not signed in.
5. On every API call, the browser fetches a fresh JWT via `getToken()` and sends `Authorization: Bearer <jwt>`.
6. `backend/api/src/middleware/auth.ts` validates the JWT against Clerk's public keys (cached) and exposes `userId`.
7. On the user's first authenticated request, `getOrCreateUser()` syncs their Clerk profile into Mongo (one-time, idempotent).

## State management

| State type                                | Tool                                | Rationale                                                   |
| ----------------------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| Server data (problems, user, submissions) | TanStack Query                      | Caching, revalidation, dedup, optimistic updates — for free |
| UI state (modals, drawers, current tab)   | Zustand or `useState`               | Simple, no boilerplate                                      |
| Form state                                | react-hook-form + Zod               | Best-in-class DX, schema-aligned validation                 |
| Theme                                     | Custom provider with `localStorage` | Three-line implementation, zero deps                        |
| Auth                                      | Clerk's built-in hooks              | Don't reinvent auth                                         |

## Performance budget

| Metric                      | Target      | Current                                         |
| --------------------------- | ----------- | ----------------------------------------------- |
| Initial JS (gzipped)        | < 100 KB    | ~85 KB (react + index)                          |
| LCP on landing              | < 1.5s      | TBD                                             |
| Per-route JS                | < 30 KB     | ~5–60 KB (Monaco is the heavy one, lazy-loaded) |
| API response (problem list) | < 200ms p50 | TBD                                             |
| LLM TTFT (Groq)             | < 500ms     | TBD                                             |

## Security posture

- **Secrets** never leave `.env.local` or hosting platform secret stores.
- **Helmet** sets standard security headers on every API response.
- **CORS** is allowlist-based; default-deny.
- **Rate limiting** at 120 req/min/IP in production.
- **Input validation** at the request boundary via Zod.
- **No `eval`, no string-built SQL** — Mongoose drivers + Piston handle the unsafe parts.
- **Code execution is sandboxed at Piston** — never on our infra.
- See [`docs/SECURITY.md`](./SECURITY.md) for the full policy.

## Testing strategy (planned)

| Layer               | Tool                           | Coverage target                             |
| ------------------- | ------------------------------ | ------------------------------------------- |
| Frontend unit       | Vitest + React Testing Library | Critical components only                    |
| Frontend E2E        | Playwright                     | One happy-path per route                    |
| Backend unit        | Vitest                         | Services + middleware (services especially) |
| Backend integration | Supertest + in-memory Mongo    | Each route at least once                    |
| ML                  | Pytest                         | Prompt builders + provider mocks            |

Tests are the **next** thing to land after Week 0 features stabilize.
