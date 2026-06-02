# Roadmap

> Honest, week-by-week. Crossed-out items are done; everything else has a checkbox.

## Status legend

- ✅ Done
- 🚧 In progress
- ⏳ Planned
- 💡 Stretch

---

## Week 0 — MVP shell (Day 1)

✅ pnpm monorepo with strict TS, ESLint, Prettier, Husky
✅ Shared `@kairos/types` package with Zod schemas
✅ React/Vite frontend with Clerk auth and themed layouts
✅ Three-pane solver UI (problem · code · chat)
✅ Express API with Mongo, Clerk middleware, Piston code-runner
✅ Seed script with 3 starter problems
✅ FastAPI ML service with Groq Socratic coach + SSE streaming
✅ Vercel + Render + HF Spaces deploy configs
✅ Documentation: README, ARCHITECTURE, ROADMAP, SECURITY, etc.

## Week 1 — Substance over scaffolding

⏳ **Problem catalog**: 30+ DSA problems across 6 topics (arrays, strings, hashmaps, two-pointers, recursion, trees)
⏳ **Submission persistence**: history page with filter by problem / verdict
⏳ **Editorial after AC**: store an editorial per problem, unlock on first accepted submission
⏳ **Profile page** with real stats from MongoDB (problems solved, by topic, by difficulty)
⏳ **CI tests**: Vitest suites for `api` services and middleware
⏳ **Frontend toasts**: success/error feedback for run/submit/save

## Week 2 — Real coaching

⏳ **Per-problem chat sessions** persisted in Mongo (resume across reload)
⏳ **Tool-using agent** via LangGraph: `read_code`, `run_tests`, `read_failing_case`
⏳ **Conversation memory** with summarization at N turns
⏳ **Hint ladder enforcement** — agent never gives full solutions before asking 2+ clarifying questions
⏳ **Intent classifier** (small LLM call) so the user doesn't have to pick the mode manually
⏳ **Latency budget**: TTFT < 500ms on Groq, surfaced in UI

## Week 3 — Coaching data collection

⏳ **Data collection** (~3–5k samples):

- LeetCode discuss style "hint" pairs
- Cleaned LangChain / community Q&A on system design
- Manually curated CP editorials (CF + AtCoder)

## Week 4 — System design track

⏳ **Whiteboard mode**: tldraw-powered canvas with the AI as commentator
⏳ **System design problem set**: 10 classics (URL shortener, news feed, chat, etc.)
⏳ **Coach grading rubric**: 6 axes (functional reqs, scale estimates, API, data model, deep dives, trade-offs)
⏳ **Voice mode** with Whisper.cpp (web) or HF Whisper-tiny (server)

## Week 5 — Competitive programming

⏳ **CF integration**: import a user's CF handle, pull rating + recent contests
⏳ **Topic detector** for any pasted CF problem (greedy / dp / graph / data-structures)
⏳ **Daily challenge** with a streak counter
⏳ **Virtual contest mode**: 90-min focused timer + post-mortem with the AI

## Beyond — stretch goals

💡 **Mobile-first companion** (PWA)
💡 **Local model mode** — run a 1.5B model in WebGPU for offline use
💡 **Team mode** — pair-program with a friend, AI as the third pair
💡 **Curriculum generator** — answer 10 questions, get a personalized 4-week plan
💡 **Recruiter mode** — share a link to your "Kairos profile" with verified solve history

---

## Done = shipped + verified

A feature is "done" only when:

1. Code is merged to `main`.
2. CI is green.
3. It works in production (not just localhost).
4. It's documented in README, ARCHITECTURE, or a per-feature doc.
5. There is at least one test or one screenshot proving it works.

Anything less stays in 🚧.
