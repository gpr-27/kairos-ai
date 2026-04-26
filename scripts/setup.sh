#!/usr/bin/env bash
#
# scripts/setup.sh — one-shot dev environment bootstrap for Kairos AI.
# Idempotent. Safe to re-run.
#
set -euo pipefail

cd "$(dirname "$0")/.."

bold() { printf "\033[1m%s\033[0m\n" "$*"; }
ok()   { printf "\033[32m✓\033[0m %s\n" "$*"; }
warn() { printf "\033[33m!\033[0m %s\n" "$*"; }

bold "▸ 1/5  Checking prerequisites"

if ! command -v node >/dev/null 2>&1; then
  echo "✗ Node.js not found. Install Node 22+ (https://nodejs.org)."
  exit 1
fi
node_major=$(node -v | sed -E 's/v([0-9]+)\..*/\1/')
if [ "$node_major" -lt 22 ]; then
  warn "Node $node_major detected; 22+ recommended (see config/root/.nvmrc)."
fi
ok "Node $(node -v)"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Installing pnpm via corepack..."
  corepack enable
  corepack prepare pnpm@latest --activate
fi
ok "pnpm $(pnpm --version)"

if ! command -v python3 >/dev/null 2>&1; then
  warn "python3 not found. apps/ml setup will be skipped."
  HAVE_PYTHON=false
else
  ok "Python $(python3 --version | awk '{print $2}')"
  HAVE_PYTHON=true
fi

bold "▸ 2/5  Installing Node dependencies"
pnpm install
ok "Node deps installed"

if [ "$HAVE_PYTHON" = "true" ]; then
  bold "▸ 3/5  Setting up apps/ml virtualenv"
  if [ ! -d "apps/ml/.venv" ]; then
    python3 -m venv apps/ml/.venv
  fi
  # shellcheck disable=SC1091
  source apps/ml/.venv/bin/activate
  pip install --quiet --upgrade pip
  pip install --quiet -r apps/ml/requirements.txt
  deactivate
  ok "apps/ml deps installed in apps/ml/.venv"
else
  warn "Skipping ML setup (no python3)"
fi

bold "▸ 4/5  Bootstrapping .env.local"
if [ ! -f ".env.local" ]; then
  cp config/root/.env.example .env.local
  ok "Created .env.local from config/root/.env.example"
else
  ok ".env.local already exists (untouched)"
fi

bold "▸ 5/5  Setup complete"
echo ""
echo "Next steps:"
echo ""
echo "  1. Open .env.local and fill in:"
echo "       - MONGODB_URI        (mongodb.com/cloud)"
echo "       - CLERK_SECRET_KEY + VITE_CLERK_PUBLISHABLE_KEY  (clerk.com)"
echo "       - GROQ_API_KEY       (console.groq.com)"
echo ""
echo "  2. Seed the database:"
echo "       pnpm --filter api seed"
echo ""
echo "  3. Run everything:"
echo "       pnpm dev                                      # web + api"
echo "       (cd apps/ml && source .venv/bin/activate \\"
echo "        && uvicorn app.main:app --reload --port 8000)  # ml"
echo ""
echo "  4. Open  http://localhost:5173"
echo ""
