#!/usr/bin/env bash
# Create/use backend/ml venv, install deps, free stale port, run uvicorn.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ML_DIR="$ROOT/backend/ml"
ML_PORT="${ML_PORT:-8000}"

pick_python() {
  local cmd ver major minor
  for cmd in python3.13 python3.12 python3.11 python3; do
    if command -v "$cmd" >/dev/null 2>&1; then
      ver="$("$cmd" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
      major="${ver%%.*}"
      minor="${ver##*.}"
      if [[ "$major" -eq 3 && "$minor" -ge 11 ]]; then
        echo "$cmd"
        return 0
      fi
    fi
  done
  echo "Python 3.11+ is required. Install with: brew install python@3.13" >&2
  return 1
}

PYTHON="$(pick_python)"
cd "$ML_DIR"

if [[ ! -d .venv ]]; then
  echo "[ml] Creating venv with $PYTHON ..."
  "$PYTHON" -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate

echo "[ml] Installing dependencies into .venv ..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

ML_ONLY=1 node "$ROOT/scripts/free-dev-ports.mjs"

echo "[ml] Starting coach service on http://127.0.0.1:${ML_PORT} ..."
exec .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port "$ML_PORT"
