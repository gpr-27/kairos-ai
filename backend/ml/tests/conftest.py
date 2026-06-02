"""Shared pytest fixtures for the ML service.

Sets deterministic env BEFORE the app is imported so settings validation does
not depend on the gitignored root `.env.local` (absent in CI).
"""

from __future__ import annotations

import os

os.environ.setdefault("GROQ_API_KEY", "gsk_test_dummy")
os.environ.setdefault("LLM_PROVIDER", "groq")
os.environ.setdefault("LOG_LEVEL", "ERROR")
os.environ.setdefault("ML_HOST", "0.0.0.0")
os.environ.setdefault("ML_PORT", "8000")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:4000")
os.environ.setdefault("DEFAULT_MODEL", "llama-3.3-70b-versatile")
os.environ.setdefault("LLM_FALLBACK_MODEL", "llama-3.1-8b-instant")
os.environ.setdefault(
    "AVAILABLE_MODELS",
    "llama-3.3-70b-versatile|Llama 3.3 70B,llama-3.1-8b-instant|Llama 3.1 8B",
)

from collections.abc import AsyncIterator  # noqa: E402

import pytest  # noqa: E402

from app.llm.base import LLMRequest  # noqa: E402


class FakeLLMProvider:
    """In-memory LLM provider for exercising the agent and routes without Groq."""

    name = "fake"

    def __init__(
        self,
        tokens: list[str] | None = None,
        reply_text: str = "full reply",
    ) -> None:
        self._tokens = tokens if tokens is not None else ["Hello", ", ", "world"]
        self._reply = reply_text
        self._last_used_model = "fake-model-1"

    @property
    def last_used_model(self) -> str:
        return self._last_used_model

    async def stream(self, request: LLMRequest) -> AsyncIterator[str]:
        for token in self._tokens:
            yield token

    async def complete(self, request: LLMRequest) -> str:
        return self._reply


@pytest.fixture
def fake_provider() -> FakeLLMProvider:
    return FakeLLMProvider()
