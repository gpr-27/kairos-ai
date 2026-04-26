# Kairos AI

AI-powered tutor for DSA, Competitive Programming, and System Design.

## Start Here

- First setup + run: `config/root/START_HERE.md`
- Full docs index: `docs/README.md`
- App-specific docs:
  - `apps/web/README.md`
  - `apps/api/README.md`
  - `apps/ml/README.md`

## Project Structure

```text
kairos-ai/
├── apps/
│   ├── web/        React + Vite frontend
│   ├── api/        Express + Mongo backend
│   └── ml/         FastAPI LLM coach
├── packages/
│   └── types/      Shared TypeScript/Zod contracts
├── docs/           Architecture, deployment, security, troubleshooting
├── scripts/        setup/check helper scripts
├── training/       Fine-tuning workspace (planned)
└── config/root/START_HERE.md
```

## Quick Run

```bash
git clone https://github.com/gpr-27/kairos-ai
cd kairos-ai
./scripts/setup.sh
```

Then:

```bash
pnpm --filter api seed
pnpm dev
```

In another terminal:

```bash
cd apps/ml
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:5173`.

## Common Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
./scripts/check.sh
```

## License

MIT - see `config/root/LICENSE`.
