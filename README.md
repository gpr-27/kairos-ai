# Kairos AI

> An AI-powered, GROQ-accelerated Socratic tutor for DSA, competitive programming, and system design.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/gpr-27/kairos-ai)

Kairos is a coding-practice platform with an interactive playground, a problem
bank, and an LLM **AI Coach** that guides you Socratically instead of handing you
the answer. It runs entirely on Groq (Llama 3.3 70B + fast fallbacks).

## One-click deploy

Click the **Deploy to Render** button above. Render reads [`render.yaml`](./render.yaml)
and provisions the whole app as a **single web service**, then prompts you for a
handful of secrets:

| Secret | Where to get it |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` / `CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API keys (`pk_…`, public) |
| `CLERK_SECRET_KEY` | Clerk dashboard → API keys (`sk_…`) |
| `CLERK_JWT_KEY` | Clerk → JWT templates (optional) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `GROQ_API_KEY` | Groq console (`gsk_…`) |

`GUEST_TOKEN_SECRET` is generated automatically. Full walkthrough:
**[docs/DEPLOY_RENDER.md](./docs/DEPLOY_RENDER.md)**.

> ⚠️ Rotate any secret that was ever committed to git history before going live,
> and set the fresh value in the Render dashboard — never in `render.yaml`.

## Architecture

One Docker container, one public port. Node/Express is the only thing exposed: it
serves the built SPA, hosts the REST API and the playground WebSocket, and proxies
`/ml/*` to a co-located Python ML service — so everything is same-origin (no CORS).

```
                       ┌─────────────────── Render web service (one container) ──────────────────┐
  Browser  ──https──►  │  Node/Express (public)                                                   │
                       │    GET /          → built SPA (Vite/React)                                │
                       │    /api/v1/*       → REST API           ── MongoDB Atlas                  │
                       │    /ws/playground  → WebSocket          ── Piston (code execution)        │
                       │    /ml/*  ──proxy──► uvicorn 127.0.0.1  ── Groq API (AI Coach)            │
                       └──────────────────────────────────────────────────────────────────────────┘
```

| Service | Stack | Path |
| --- | --- | --- |
| Frontend | React 18 · Vite · Tailwind · Clerk · Monaco | [`frontend/`](./frontend) |
| API | Node · Express · MongoDB · WebSocket · Groq | [`backend/api/`](./backend/api) |
| AI Coach (ML) | Python · FastAPI · Groq · SSE | [`backend/ml/`](./backend/ml) |
| Shared types | TypeScript · Zod | [`backend/types/`](./backend/types) |

## Local development

```bash
cp .env.example .env.local   # fill in the values
npm install                  # installs all workspaces
npm run dev                  # web + api (concurrently)
npm run dev:ml               # AI Coach (FastAPI) in a separate terminal
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Frontend + API together |
| `npm run dev:ml` | Python ML service (FastAPI) |
| `npm run build` | Build types → API → frontend |
| `npm run typecheck` / `lint` / `test` | Quality gates across workspaces |

## Documentation

- [Deploy to Render](./docs/DEPLOY_RENDER.md) · [Architecture](./docs/ARCHITECTURE.md) · [Roadmap](./docs/ROADMAP.md)
- [Contributing](./docs/CONTRIBUTING.md) · [Security](./docs/SECURITY.md) · [Troubleshooting](./docs/TROUBLESHOOTING.md)

## License

MIT © [Praneeth Reddy Gandra](https://github.com/gpr-27)
