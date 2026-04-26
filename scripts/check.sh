#!/usr/bin/env bash
#
# scripts/check.sh — run all CI-equivalent checks locally before pushing.
#
set -euo pipefail

cd "$(dirname "$0")/.."

bold() { printf "\033[1m%s\033[0m\n" "$*"; }
ok()   { printf "\033[32m✓\033[0m %s\n" "$*"; }
fail() { printf "\033[31m✗\033[0m %s\n" "$*"; }

step() {
  bold "▸ $1"
  shift
  if "$@"; then
    ok "$1 passed"
    echo
  else
    fail "$1 failed"
    exit 1
  fi
}

step "Format check"            pnpm format:check
step "Lint (all workspaces)"   pnpm lint
step "Typecheck"               pnpm typecheck
step "Build"                   pnpm build

if [ -d "apps/ml/.venv" ]; then
  bold "▸ Python checks (apps/ml)"
  # shellcheck disable=SC1091
  source apps/ml/.venv/bin/activate
  ruff check apps/ml && ok "ruff check passed"
  ruff format --check apps/ml && ok "ruff format passed"
  deactivate
  echo
fi

bold "All checks passed. Safe to push."
