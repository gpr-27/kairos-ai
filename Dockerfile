# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# Kairos AI — single-container production image (Render).
#
# One public Node/Express server is the only exposed port. It serves the built
# Vite SPA, hosts the REST API (/api/v1) and the playground WebSocket (/ws), and
# proxies /ml/* to a co-located Python (FastAPI) ML service. Both processes are
# launched by deploy/start.sh.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build the Vite frontend ─────────────────────────────────────────
FROM node:20-slim AS web-builder
WORKDIR /app

# Public, build-time SPA config. Render passes a service's env vars as Docker
# build args automatically. ONLY non-secret values are referenced here: the
# Clerk *publishable* key is public by design (it ships in the client bundle).
# API/ML/WebSocket URLs are intentionally NOT passed — the production build is
# same-origin and derives them from window.location at runtime.
ARG VITE_APP_ENV=production
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_LLM_PROVIDER
ARG VITE_DEFAULT_MODEL
ARG VITE_AVAILABLE_MODELS
ENV VITE_APP_ENV=$VITE_APP_ENV \
    VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY \
    VITE_LLM_PROVIDER=$VITE_LLM_PROVIDER \
    VITE_DEFAULT_MODEL=$VITE_DEFAULT_MODEL \
    VITE_AVAILABLE_MODELS=$VITE_AVAILABLE_MODELS

# Install workspace deps (cached on manifest changes only).
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/api/package.json backend/api/package.json
COPY backend/types/package.json backend/types/package.json
RUN npm ci

# Build the SPA (needs the shared @kairos/types source + root tsconfig).
COPY tsconfig.base.json ./
COPY backend/types ./backend/types
COPY frontend ./frontend
RUN npm run build --workspace frontend

# ── Stage 2: runtime (Node + Python in one image) ────────────────────────────
FROM node:20-slim AS runtime
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Python 3.11 (bookworm) for the ML service + curl for healthchecks.
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 python3-venv curl \
    && rm -rf /var/lib/apt/lists/*

# Python virtualenv with the ML service dependencies.
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv "$VIRTUAL_ENV"
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
COPY backend/ml/requirements.txt backend/ml/requirements.txt
RUN pip install --no-cache-dir -r backend/ml/requirements.txt

# Node deps (incl. tsx + the workspace symlinks) reused from the build stage.
# The API runs TypeScript directly via tsx — identical to the dev runtime — so
# there is no fragile compile step or @kairos/types resolution to break.
COPY --from=web-builder /app/node_modules ./node_modules

# Application source, shared TS types, and the built SPA.
COPY package.json package-lock.json tsconfig.base.json ./
COPY backend ./backend
COPY frontend/package.json ./frontend/package.json
COPY --from=web-builder /app/frontend/dist ./frontend/dist
COPY deploy/start.sh ./deploy/start.sh
RUN chmod +x deploy/start.sh

# Render injects PORT=10000 by default; render.yaml sets API_PORT to match it.
CMD ["./deploy/start.sh"]
