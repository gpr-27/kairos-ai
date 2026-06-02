#!/usr/bin/env bash
# One-shot local setup: deps + .env.local from template.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example — edit it with your real keys."
else
  echo ".env.local already exists; skipping copy."
fi

echo "Installing Node dependencies..."
npm install

if [[ -d backend/ml ]]; then
  PY=""
  for cmd in python3.13 python3.12 python3.11 python3; do
    if command -v "$cmd" >/dev/null 2>&1; then
      minor="$("$cmd" -c 'import sys; print(sys.version_info.minor)')"
      major="$("$cmd" -c 'import sys; print(sys.version_info.major)')"
      if [[ "$major" -eq 3 && "$minor" -ge 11 ]]; then
        PY="$cmd"
        break
      fi
    fi
  done
  if [[ -z "$PY" ]]; then
    echo "Warning: Python 3.11+ not found — skip ML venv (brew install python@3.13)."
  elif [[ ! -d backend/ml/.venv ]]; then
    echo "Creating Python venv in backend/ml with $PY ..."
    "$PY" -m venv backend/ml/.venv
  fi
  if [[ -n "$PY" && -d backend/ml/.venv ]]; then
    # shellcheck disable=SC1091
    source backend/ml/.venv/bin/activate
    pip install -q -r backend/ml/requirements.txt
    deactivate
  fi
fi

cat <<'EOF'

Next steps:
  1. Edit .env.local (Clerk, MongoDB, Groq) if you have not already.
  2. npm run dev          # frontend + API
  3. npm run dev:ml       # ML coach (optional, separate terminal)

If port 5173 is busy, Vite will pick the next free port (5174, …).
EOF
