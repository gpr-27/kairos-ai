"""Groq LLM provider with automatic rate-limit fallback."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import cast

import groq as groq_sdk
from groq import AsyncGroq
from groq.types.chat.chat_completion_message_param import ChatCompletionMessageParam
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import get_settings
from ..logger import logger
from .base import LLMRequest


def _groq_messages(request: LLMRequest) -> list[ChatCompletionMessageParam]:
    return cast(
        list[ChatCompletionMessageParam],
        [m.model_dump(exclude_none=True) for m in request.messages],
    )


def _fallback_model() -> str:
    """Read fallback model from settings (overridable via LLM_FALLBACK_MODEL env var)."""
    return get_settings().llm_fallback_model


class GroqProvider:
    """Streaming Groq client with automatic rate-limit fallback."""

    name = "groq"

    def __init__(self, model: str | None = None) -> None:
        settings = get_settings()
        if not settings.groq_api_key:
            raise ValueError("GROQ_API_KEY is required when LLM_PROVIDER=groq")
        self._client = AsyncGroq(api_key=settings.groq_api_key)
        self._model = model or settings.llm_model
        # Tracks which model actually served the most-recent request
        self._last_used_model: str = self._model

    @property
    def last_used_model(self) -> str:
        return self._last_used_model

    # ── Internal helpers ──────────────────────────────────────────────────────

    async def _do_stream(self, model: str, request: LLMRequest) -> AsyncIterator[str]:
        """Yield token deltas from a single Groq streaming call."""
        stream = await self._client.chat.completions.create(
            model=model,
            messages=_groq_messages(request),
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stop=request.stop,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                yield delta

    async def _do_complete(self, model: str, request: LLMRequest) -> str:
        """Return a full completion from a single Groq non-streaming call."""
        completion = await self._client.chat.completions.create(
            model=model,
            messages=_groq_messages(request),
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stop=request.stop,
            stream=False,
        )
        return completion.choices[0].message.content or ""

    # ── Model fallback list ───────────────────────────────────────────────────

    def _model_chain(self) -> list[str]:
        """Primary model first; fallback second (if different)."""
        fb = _fallback_model()
        models = [self._model]
        if self._model != fb:
            models.append(fb)
        return models

    # ── Public interface ──────────────────────────────────────────────────────

    async def stream(self, request: LLMRequest) -> AsyncIterator[str]:
        """Stream tokens, falling back to the smaller model on rate-limit."""
        logger.debug(f"[groq] streaming model={self._model} msgs={len(request.messages)}")

        last_exc: Exception | None = None

        for model in self._model_chain():
            try:
                self._last_used_model = model
                async for token in self._do_stream(model, request):
                    yield token
                return  # success — stop generator
            except groq_sdk.RateLimitError as exc:
                last_exc = exc
                fb = _fallback_model()
                if model == fb:
                    # Fallback is also rate-limited; give up
                    logger.error(f"[groq] rate-limited on fallback model {model} too — giving up")
                    break
                logger.warning(f"[groq] rate-limited on {model} (429), retrying with fallback {fb}")
                # continue to next model in chain
            except Exception as exc:
                logger.error(f"[groq] streaming failed on {model}: {exc}")
                raise

        # Both models exhausted
        raise last_exc or RuntimeError("Groq stream failed with no specific error")

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=1, max=4),
        reraise=True,
    )
    async def complete(self, request: LLMRequest) -> str:
        """Full completion with retry + rate-limit fallback."""
        last_exc: Exception | None = None

        for model in self._model_chain():
            try:
                logger.debug(f"[groq] complete model={model}")
                return await self._do_complete(model, request)
            except groq_sdk.RateLimitError as exc:
                last_exc = exc
                fb = _fallback_model()
                if model == fb:
                    logger.error(f"[groq] rate-limited on fallback model {model} too — giving up")
                    break
                logger.warning(f"[groq] rate-limited on {model} (429), retrying with fallback {fb}")
            except Exception:
                raise

        raise last_exc or RuntimeError("Groq complete failed with no specific error")
