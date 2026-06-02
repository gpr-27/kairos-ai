"""Health-check endpoints."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

from ..config import get_settings

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health() -> dict[str, object]:
    settings = get_settings()
    return {
        "data": {
            "status": "ok",
            "service": "kairos-ai-coach",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "provider": settings.llm_provider,
            "model": settings.default_model,
            "models": settings.available_model_options,
        }
    }
