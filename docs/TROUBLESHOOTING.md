# Troubleshooting

> Stuff that goes wrong, and how to unstick yourself.

## Setup issues

### `command not found: pnpm`

`npm install -g pnpm` failed because the global `npm` prefix points to a read-only directory (often the case with macOS Cursor / Homebrew Node).

**Fix:**

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
```

### `EBADENGINE` warning on `pnpm install`

You're on Node < 22. Either:

```bash
nvm install 22 && nvm use 22
# or
brew install node@22 && brew link --force node@22
```

### Python deps fail to compile (`grpcio` / `tokenizers` / etc.)

You're on Python < 3.11 or missing build tools.

**macOS:**

```bash
xcode-select --install
brew install python@3.11
pyenv local 3.11
```

**Linux:**

```bash
sudo apt-get install build-essential python3.11-dev
```

## Running locally

### `cp: keys: Not a directory` when copying env

You ran the setup line **without** treating `#` as a comment, e.g.:

```bash
cp .env.example .env.local then fill in keys   # wrong
```

The shell treats `then`, `fill`, `in`, and `keys` as extra copy targets.

**Fix:**

```bash
cp .env.example .env.local
# or
npm run setup
```

### API: `CLERK_PUBLISHABLE_KEY` / `MONGODB_URI` — "Required"

`.env.local` is missing at the repo root. The API only loads `/.env.local` or `/.env`, not `.env.example`.

**Fix:** `cp .env.example .env.local` (then edit values), or `npm run setup`.

### Web exits with code 143 after API fails

Exit code **143** means Vite received SIGTERM — usually because `concurrently` shut down all dev processes after the **API** crashed first.

Check the `[api]` lines above the web error. Common cause: **`EADDRINUSE` on port 4000** (a stale `tsx watch src/server.ts` still running).

**Fix:**

```bash
npm run predev    # stops stale Kairos API on 4000, if any
npm run dev
```

Or manually: `lsof -i :4000` then `kill <pid>`.

### ML: `command not found: python` / pip conflicts / port 8000 busy

macOS often ships **no `python` command** (only `python3`). If venv creation fails, `pip` installs into Homebrew’s global Python and you get langchain version warnings.

**Fix (from repo root):**

```bash
npm run dev:ml
```

That uses `python3.13` (or 3.11+), a local `.venv`, and isolated deps.

**Port 8000 in use** (`Address already in use`): another app owns it (e.g. `python run.py`). Check with `lsof -i :8000`, stop that process, or:

```bash
ML_PORT=8001 npm run dev:ml
```

(Set `VITE_ML_BASE_URL` / `ML_BASE_URL` to match if you change the port.)

### `listen EADDRINUSE :::4000`

Another process (often a previous Kairos API) is bound to port 4000.

**Fix:** `npm run predev` then `npm run dev`, or change `API_PORT` in `.env.local`.

### `Error: Port 5173 is already in use`

Another Vite app (often a different repo) is already on 5173. Kairos will try 5174, 5175, … automatically.

**Options:**

- Stop the other dev server, or
- Set a fixed port: `VITE_DEV_PORT=5180 npm run dev:web`

In development the API allows any `localhost` origin, so CORS still works on alternate ports.

### Web shows "Missing Clerk publishable key"

Your `frontend/.env.local` (or root `.env.local`) is missing `VITE_CLERK_PUBLISHABLE_KEY`.

**Fix:**

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → your app → **API Keys**.
2. Copy the **Publishable key** (`pk_test_…`).
3. Add to `.env.local`:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
   ```
4. Restart `pnpm dev`.

### API exits with `Invalid environment variables`

The API's Zod env schema rejected your config.

**Fix:** Read the printed `details` — it tells you exactly which key is missing or malformed. Common culprits:

- `MONGODB_URI` doesn't start with `mongodb+srv://` or `mongodb://`
- `CLERK_SECRET_KEY` doesn't start with `sk_`
- `ALLOWED_ORIGINS` (or `WEB_BASE_URL`) includes a trailing slash (it shouldn't)

### `MongoServerError: bad auth`

Your `MONGODB_URI` username or password is wrong, or your IP isn't on the Atlas allowlist.

**Fix:**

1. In Atlas → **Database Access** → confirm the user exists and the password matches.
2. In Atlas → **Network Access** → add your current IP, or `0.0.0.0/0` for dev (not for production).
3. Re-run `pnpm --filter api dev`.

### `pnpm --filter api seed` does nothing

The script is idempotent — if the slug already exists, it `updateOne` instead of insert. To force a refresh:

```bash
mongosh "$MONGODB_URI" --eval 'db.problems.deleteMany({})'
pnpm --filter api seed
```

### Web shows "Failed to fetch" on every request

Check three things in order:

1. **Is the API running?** `curl http://localhost:4000/api/v1/health` should return `{ status: "ok" }`.
2. **Is `VITE_API_BASE_URL` correct?** Should be `http://localhost:4000`, no trailing slash.
3. **CORS:** the API's `ALLOWED_ORIGINS` env var must include your browser origin (`http://localhost:5173`).

### Monaco editor shows a blank white square

Monaco's web workers couldn't load. Usually a Vite config issue.

**Fix:** restart `pnpm --filter web dev` and hard-reload the browser (Cmd+Shift+R). If it persists, check the browser console — there's almost always a clear error.

### ML chat hangs forever

The Groq API key is missing or invalid.

**Fix:**

1. `backend/ml/.env` (or root `.env.local`) needs `GROQ_API_KEY=gsk_…`.
2. Test directly:
   ```bash
   curl -X POST https://api.groq.com/openai/v1/chat/completions \
     -H "Authorization: Bearer $GROQ_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"llama-3.3-70b-versatile","messages":[{"role":"user","content":"hi"}]}'
   ```
   If this fails, the key is bad — generate a new one at [console.groq.com](https://console.groq.com).

## Type / build issues

### `Cannot find module '@kairos/types'`

Workspace symlinks are broken. Re-install:

```bash
pnpm install --force
```

### `tsc` is slow / never finishes

You're typechecking `node_modules` accidentally. Make sure your `tsconfig.json` has `"skipLibCheck": true` (the base config already does).

### Vite build fails with `Out of memory`

Increase Node's heap:

```bash
NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter web build
```

## Deployment issues

### Vercel build succeeds but the site is blank

Almost always a missing env var. Vercel doesn't fail the build for missing runtime env vars — it just gives you a broken site.

**Fix:** Vercel Dashboard → your project → **Settings → Environment Variables** → add `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`, `VITE_ML_BASE_URL`. Redeploy.

### Render API returns 502

Cold start. Render's free tier sleeps after 15 minutes of inactivity. The first request wakes it (10–30s).

**Fix for production:** upgrade to Render's $7/mo plan, or add a cron-job.org ping every 10 minutes.

### HF Space build fails on Dockerfile

Read the full build log. Common causes:

- Wrong base image — must be `python:3.11-slim` for ZeroGPU compat
- Port mismatch — Spaces expect port `7860`, our Dockerfile sets it correctly
- Missing `requirements.txt` at the build root — the `backend/ml/Dockerfile` uses `COPY requirements.txt .` so make sure you're building from `backend/ml/`

## Still stuck?

Open an issue with:

1. What you ran
2. The exact error message
3. Your OS, Node version, Python version
4. Whether the same thing happens after `pnpm install --force` and a fresh shell
