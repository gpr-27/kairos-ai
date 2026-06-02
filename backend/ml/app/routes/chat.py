"""Chat endpoints — streaming SSE for the coach agent."""

from __future__ import annotations

from collections.abc import AsyncIterator

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from ..agent import CoachAgent
from ..config import get_settings
from ..logger import logger
from ..schemas import ChatRequest, StreamChunk

router = APIRouter(prefix="/chat", tags=["chat"])

_agent_instance: CoachAgent | None = None


def get_agent() -> CoachAgent:
    """Lazy singleton — initialized on first request, not at import time."""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = CoachAgent()
    return _agent_instance


def _validate_model(request: ChatRequest) -> None:
    """Reject a per-request model override that is not in the configured list."""
    settings = get_settings()
    if request.model is not None and request.model not in settings.available_model_ids:
        raise HTTPException(status_code=422, detail=f"Unknown model: {request.model}")
    logger.info(f"[chat] selected model={request.model or settings.default_model}")


@router.post("")
async def chat_complete(request: ChatRequest) -> dict[str, object]:
    """Non-streaming, full-response chat."""
    _validate_model(request)
    try:
        reply = await get_agent().reply(request)
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    except Exception as exc:
        logger.error(f"[chat] complete failed: {exc}")
        raise HTTPException(status_code=502, detail="LLM provider error") from exc
    return {"data": {"reply": reply}}


@router.post("/stream")
async def chat_stream(request: ChatRequest) -> EventSourceResponse:
    """Streaming SSE chat. Each event is JSON of `StreamChunk`."""
    _validate_model(request)

    async def event_generator() -> AsyncIterator[dict[str, str]]:
        try:
            agent = get_agent()
            async for token in agent.stream_reply(request):
                chunk = StreamChunk(type="token", content=token)
                yield {"event": "message", "data": chunk.model_dump_json(exclude_none=True)}

            done_chunk = StreamChunk(type="done", model=agent.last_used_model)
            yield {"event": "message", "data": done_chunk.model_dump_json(exclude_none=True)}
        except Exception as exc:
            logger.error(f"[chat] stream failed: {exc}")
            err_chunk = StreamChunk(type="error", error=str(exc))
            yield {"event": "message", "data": err_chunk.model_dump_json(exclude_none=True)}

    return EventSourceResponse(event_generator())
