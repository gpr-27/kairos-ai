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

### Web shows "Missing Clerk publishable key"

Your `apps/web/.env.local` (or root `.env.local`) is missing `VITE_CLERK_PUBLISHABLE_KEY`.

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
- `WEB_ORIGIN` includes a trailing slash (it shouldn't)

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
3. **CORS:** the API's `WEB_ORIGIN` env var must match your browser origin (`http://localhost:5173`).

### Monaco editor shows a blank white square

Monaco's web workers couldn't load. Usually a Vite config issue.

**Fix:** restart `pnpm --filter web dev` and hard-reload the browser (Cmd+Shift+R). If it persists, check the browser console — there's almost always a clear error.

### ML chat hangs forever

The Groq API key is missing or invalid.

**Fix:**

1. `apps/ml/.env` (or root `.env.local`) needs `GROQ_API_KEY=gsk_…`.
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
- Missing `requirements.txt` at the build root — the `apps/ml/Dockerfile` uses `COPY requirements.txt .` so make sure you're building from `apps/ml/`

## Still stuck?

Open an issue with:

1. What you ran
2. The exact error message
3. Your OS, Node version, Python version
4. Whether the same thing happens after `pnpm install --force` and a fresh shell
