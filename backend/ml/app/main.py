"""FastAPI app factory + ASGI entrypoint."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings, log_settings_diagnostics
from .logger import configure_logger, logger
from .routes import chat_router, health_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    configure_logger()
    log_settings_diagnostics()
    logger.info("🧠 Kairos AI Coach starting")
    yield
    logger.info("👋 Kairos ML shutting down")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Kairos AI Coach",
        description="LLM brain + agentic coach for Kairos AI.",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        # Configured origins come from ALLOWED_ORIGINS. We also allow any localhost
        # origin (any port) as a dev convenience — the web dev server may land on an
        # alternate port (5174+) when 5173 is taken. This mirrors the API's CORS and
        # is safe: a deployed browser client never originates from localhost.
        allow_origins=settings.origins_list,
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(chat_router)

    return app


app = create_app()
