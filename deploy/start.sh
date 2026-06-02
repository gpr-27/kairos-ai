#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Kairos AI — single-container process supervisor (Render).
#
# Runs two processes in one container:
#   • Python ML service (uvicorn) — internal only, on $ML_HOST:$ML_PORT
#   • Node API (tsx)              — the ONLY public port; serves the built SPA,
#                                   hosts /api/v1 + the /ws WebSocket, and proxies
#                                   /ml/* to the local uvicorn above.
#
# If either process exits, the other is terminated and the container exits so
# Render restarts it. Kept dependency-free (plain bash) to stay lean.
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

ML_HOST="${ML_HOST:-127.0.0.1}"
ML_PORT="${ML_PORT:-8000}"

echo "▶ starting ML service (uvicorn) on ${ML_HOST}:${ML_PORT}"
uvicorn app.main:app --host "${ML_HOST}" --port "${ML_PORT}" --app-dir backend/ml &
ML_PID=$!

echo "▶ starting API + web (node/tsx) on :${API_PORT:-10000}"
node_modules/.bin/tsx backend/api/src/server.ts &
API_PID=$!

shutdown() {
  echo "✋ shutting down…"
  kill -TERM "${ML_PID}" "${API_PID}" 2>/dev/null || true
}
trap shutdown TERM INT

# Exit as soon as either child exits, then bring the other down.
wait -n
EXIT_CODE=$?
shutdown
wait 2>/dev/null || true
echo "container exiting (code ${EXIT_CODE})"
exit "${EXIT_CODE}"
