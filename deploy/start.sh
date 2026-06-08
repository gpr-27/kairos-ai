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

# Wait for the ML service to answer /health before starting the public API, so the
# API never proxies /ml/* to a not-yet-ready uvicorn (avoids a transient 502 window
# right after deploy). Bounded so a genuinely-stuck ML still lets `wait -n` fail loud.
echo "▶ waiting for ML /health on ${ML_HOST}:${ML_PORT}…"
for _ in $(seq 1 30); do
  if curl -sf "http://${ML_HOST}:${ML_PORT}/health" >/dev/null 2>&1; then
    echo "✓ ML service is ready"
    break
  fi
  # Stop waiting early if uvicorn already died — let the supervisor bring the container down.
  kill -0 "${ML_PID}" 2>/dev/null || { echo "✗ ML process exited during startup"; break; }
  sleep 1
done

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
