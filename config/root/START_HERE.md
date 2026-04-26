# Start Here

If the repo feels big, follow this file only.

## 1) One-time setup

```bash
./scripts/setup.sh
```

This installs dependencies and creates `.env.local`.

## 2) Fill required env vars

Edit `.env.local` and set at least:

- `MONGODB_URI`
- `CLERK_SECRET_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `GROQ_API_KEY`

Use `config/root/.env.example` as reference.

## 3) Seed database

```bash
pnpm --filter api seed
```

## 4) Start services

Terminal 1:

```bash
pnpm dev
```

Terminal 2:

```bash
cd apps/ml
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

## 5) Open app

`http://localhost:5173`

## Where to read next

- Big-picture architecture: `docs/ARCHITECTURE.md`
- Deployment guide: `docs/DEPLOYMENT.md`
- Troubleshooting errors: `docs/TROUBLESHOOTING.md`
- Security checklist: `docs/SECURITY.md`
- Contribution flow: `docs/CONTRIBUTING.md`
