"""FastAPI app factory + ASGI entrypoint."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .logger import configure_logger, logger
from .routes import chat_router, health_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    configure_logger()
    settings = get_settings()
    logger.info(
        f"🧠 Kairos ML starting provider={settings.llm_provider} model={settings.llm_model}"
    )
    yield
    logger.info("👋 Kairos ML shutting down")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Kairos ML",
        description="LLM brain + agentic coach for Kairos AI.",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(chat_router)

    return app


app = create_app()
