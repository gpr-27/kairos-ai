# `backend/ml` — ML / Coach service

FastAPI + Pydantic, powered by **Groq**.

The coach's brain is **Llama 3.3 70B Versatile**, served on Groq's LPU for
sub-second first-token latency, with automatic fallback to **Llama 3.1 8B
Instant** when the primary model is rate-limited. Groq is the only supported
provider — keep `LLM_PROVIDER=groq`.

## Quick start

From the **repo root** (recommended — creates `.venv` with Python 3.11+):

```bash
npm run dev:ml
```

Manual setup (macOS often has `python3` but not `python`):

```bash
cd backend/ml
python3.13 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

If port 8000 is busy: `lsof -i :8000` to find the process, or `ML_PORT=8001 npm run dev:ml`.

Make sure your environment has:

```
GROQ_API_KEY=gsk_…
LLM_PROVIDER=groq
DEFAULT_MODEL=llama-3.3-70b-versatile
LLM_FALLBACK_MODEL=llama-3.1-8b-instant
AVAILABLE_MODELS=llama-3.3-70b-versatile|Llama 3.3 70B,llama-3.1-8b-instant|Llama 3.1 8B
ALLOWED_ORIGINS=http://localhost:5173
```

## Folder structure

```
app/
├── main.py             FastAPI factory + lifespan + CORS + routers
├── config.py           Pydantic Settings (env-driven)
├── logger.py           Loguru config
├── schemas.py          Pydantic models (parity with backend/types)
├── llm/                ★ Provider abstraction
│   ├── base.py         LLMProvider Protocol + Message + LLMRequest
│   ├── factory.py      get_llm_provider() picks the backend
│   └── groq_provider.py  Groq streaming impl (Day 1)
├── agent/              ★ Coach orchestration
│   ├── coach.py        CoachAgent: streams replies, builds context
│   └── prompts.py      Base system + per-intent overrides
└── routes/
    ├── health.py       GET  /health
    └── chat.py         POST /chat (sync) + POST /chat/stream (SSE)
```

## The provider abstraction

The whole point of the `llm/` folder is that swapping the backend is a one-env-var change:

```python
class LLMProvider(Protocol):
    name: str
    async def stream(self, request: LLMRequest) -> AsyncIterator[str]: ...
    async def complete(self, request: LLMRequest) -> str: ...
```

| Provider                                 | File                   | Status    |
| ---------------------------------------- | ---------------------- | --------- |
| **Groq** — Llama 3.3 70B (+ 8B fallback) | `llm/groq_provider.py` | ✅ Active |

`groq` is the only supported provider — `factory.py` raises a clear `ValueError`
for any other `LLM_PROVIDER` value. Leave `LLM_PROVIDER=groq`.

## The coach agent

`agent/coach.py::CoachAgent.stream_reply()` does the work:

1. Take the user's message + intent + problem context (slug, code, language, last error)
2. Build a system prompt by composing:
   - `BASE_SYSTEM_PROMPT` — Kairos's overall personality + Socratic rules
   - `INTENT_PROMPTS[intent]` — overrides for "hint" / "explain" / "review" / etc.
3. Call `provider.stream(request)` and yield chunks as they arrive
4. The route wraps the iterator in `EventSourceResponse` for SSE

**Why Socratic?** Because students who get the answer learn nothing. The agent's job is to ask the right question that unlocks the student.

## Routes

| Method | Path           | Description                     |
| ------ | -------------- | ------------------------------- |
| GET    | `/health`      | Liveness check                  |
| POST   | `/chat`        | Synchronous reply (full body)   |
| POST   | `/chat/stream` | Server-Sent Events token stream |

Request shape (mirrors `@kairos/types ChatRequest`):

```json
{
  "intent": "hint",
  "messages": [{ "role": "user", "content": "I'm stuck" }],
  "context": {
    "problemSlug": "two-sum",
    "language": "python",
    "code": "def twoSum(nums, target): pass",
    "lastError": null
  }
}
```

SSE stream shape:

```
data: {"type":"token","content":"Let"}
data: {"type":"token","content":" me"}
...
data: {"type":"done"}
```

## Deploying to HuggingFace Spaces

See [`docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md#3-ml-service--huggingface-spaces) for the full walkthrough.

TL;DR:

1. Create a Docker SDK Space named `kairos-ml`.
2. Push this folder to the Space's repo.
3. Add `GROQ_API_KEY` and `LLM_PROVIDER` as Space secrets.
4. Wait ~3 min for the build.

## Code quality

```bash
ruff check .       # lint
ruff format .      # format
mypy app           # type check
pytest             # tests (when written)
```

## Adding a new intent

1. Add a key to `agent/prompts.py::INTENT_PROMPTS`.
2. Add the literal to `schemas.py::CoachIntent` and `backend/types/src/chat.ts`.
3. Add a quick-action button in `frontend/src/components/solver/chat-pane.tsx`.

That's it — the routing is already intent-agnostic.
