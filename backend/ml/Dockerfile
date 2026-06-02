FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# The listen port is provided at runtime via $ML_PORT (Render/compose env);
# there is no hardcoded default, so EXPOSE is intentionally omitted.

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:$ML_PORT/health" || exit 1

# Shell form so $ML_HOST / $ML_PORT expand from the runtime environment.
CMD uvicorn app.main:app --host "$ML_HOST" --port "$ML_PORT"
