# Contributing

Thanks for considering a contribution. This doc tells you the _how_; the _why_ lives in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## TL;DR

```bash
git clone https://github.com/gpr-27/kairos-ai
cd kairos-ai
./scripts/setup.sh         # installs node + python deps, copies .env.example
pnpm dev                   # web + api in parallel
cd backend/ml && uvicorn app.main:app --reload   # ml service
```

Open a PR, get a review, ship.

## Ground rules

1. **One concern per PR.** A 50-line PR gets reviewed in a day. A 1000-line PR gets reviewed in a month.
2. **Keep `main` deployable.** CI must be green before merge.
3. **No secrets in commits.** `.env.local` is gitignored — keep it that way.
4. **Layered code.** Routes call services; services call models. Never skip layers.
5. **Types are not optional.** No `any` without a comment explaining why.

## Setting up locally

### Prerequisites

- **Node 22+** — `nvm install 22 && nvm use 22` (or use `.nvmrc`)
- **pnpm 10+** — `corepack enable && corepack prepare pnpm@latest --activate`
- **Python 3.11+** — `pyenv install 3.11 && pyenv global 3.11`
- **MongoDB** — Atlas free tier or local Docker

### One-shot setup

```bash
./scripts/setup.sh
```

This will:

1. Install Node deps with pnpm
2. Create `backend/ml/.venv` and install Python deps
3. Copy `.env.example` → `.env.local` if it doesn't exist
4. Print a checklist of secrets you still need to fill

### Manual setup

```bash
pnpm install                                       # Node deps for all workspaces
cd backend/ml && python -m venv .venv && \           # Python venv
  source .venv/bin/activate && \
  pip install -r requirements.txt && cd ../..
cp .env.example .env.local
# Edit .env.local and add your Clerk, MongoDB, and Groq keys.
pnpm --filter api seed                             # populate Mongo with sample problems
```

## Daily workflow

```bash
pnpm dev                  # web (5173) + api (4000) in parallel
pnpm --filter web dev     # web only
pnpm --filter api dev     # api only

# ML service runs separately:
cd backend/ml && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

## Before pushing

```bash
./scripts/check.sh        # format + lint + typecheck across the repo
```

This is the same gate CI uses. If it passes locally, CI will pass.

Equivalent commands if you prefer manual:

```bash
pnpm format               # Prettier
pnpm lint                 # ESLint across all workspaces
pnpm typecheck            # tsc --noEmit across all workspaces
pnpm build                # full production build
```

## Commit style

We follow **Conventional Commits**:

```
feat(web): add language switcher to code editor
fix(api): handle null explanation in problem service
docs: clarify clerk redirect URLs
refactor(ml): extract intent prompt builder
chore(deps): bump zod to 3.23
test(api): cover submission service edge cases
```

Husky enforces this on `git commit`. If you mess up: `git commit --amend`.

## Branching

- `main` — always deployable
- `feat/<scope>-<short-description>` — new features
- `fix/<scope>-<short-description>` — bug fixes
- `chore/<scope>-<short-description>` — non-code changes

Rebase, don't merge `main` into your branch. Keep history linear.

## PR template

When you open a PR, you'll see a template. Fill in:

- **What** changed and **why**
- **Screenshots** for any UI change
- **Test plan** — exactly how you verified it
- **Risk** — what could break

PRs without screenshots for UI changes will be rejected.

## Code review philosophy

A reviewer's job is to **catch what the author missed**, not to demand stylistic preference. Specific things we care about:

- Does this PR solve the problem cleanly?
- Are the layers respected?
- Is there a test for non-trivial logic?
- Will this scale beyond 100 users / 1000 records / 1 region?
- Does it leak any secret or PII?

We do **not** care about:

- Personal style — Prettier handles that.
- "I would have done it differently" — that's not a review comment.

## Adding a new problem

```bash
# Edit backend/api/src/scripts/seed-problems.ts and add a new entry.
pnpm --filter api seed
```

Each problem must have:

- A unique `slug`
- `difficulty` (`easy` | `medium` | `hard`)
- `track` (`dsa` | `cp` | `system_design`)
- `topics[]`
- `examples[]`
- `testCases[]` — at least 3 visible + 2 hidden
- `starterCode` for at least Python and one other language

## Adding a new LLM provider

1. Implement `LLMProvider` (see `backend/ml/app/llm/base.py`)
2. Add it to `backend/ml/app/llm/factory.py::get_llm_provider`
3. Document the new provider in this file and the env vars it needs
4. Add a test in `backend/ml/tests/test_<provider>.py`

## Code of Conduct

Be kind, be specific, and assume good intent.
Personal attacks, harassment, or discrimination are not tolerated and will result in immediate ban.
