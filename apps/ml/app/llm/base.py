"""Provider-agnostic LLM interface."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Literal, Protocol

from pydantic import BaseModel, Field

Role = Literal["system", "user", "assistant", "tool"]


class Message(BaseModel):
    role: Role
    content: str
    name: str | None = None


class LLMRequest(BaseModel):
    messages: list[Message]
    temperature: float = Field(default=0.4, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=1)
    stop: list[str] | None = None


class LLMProvider(Protocol):
    """Streaming-only LLM provider contract.

    All providers must yield text deltas as strings.
    """

    name: str
    last_used_model: str

    async def stream(
        self, request: LLMRequest
    ) -> AsyncIterator[str]:  # pragma: no cover - protocol
        ...

    async def complete(self, request: LLMRequest) -> str:  # pragma: no cover - protocol
        ...
