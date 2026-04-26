"""Coach agent — the heart of Kairos."""

from __future__ import annotations

from collections.abc import AsyncIterator

from ..config import get_settings
from ..llm import LLMProvider, Message, get_llm_provider
from ..llm.base import LLMRequest
from ..logger import logger
from ..schemas import ChatRequest
from .prompts import build_problem_context, build_system_prompt


class CoachAgent:
    """Single-turn (for now) Socratic coach.

    LangGraph multi-step orchestration is added in Week 2 once tools land.
    """

    def __init__(self, llm: LLMProvider | None = None) -> None:
        self._llm = llm or get_llm_provider()
        settings = get_settings()
        self._temperature = settings.llm_temperature
        self._max_tokens = settings.llm_max_tokens

    def _build_messages(self, request: ChatRequest) -> list[Message]:
        system_prompt = build_system_prompt(request.intent)
        ctx = request.context
        problem_context = build_problem_context(
            request.problem_id,
            ctx.current_code if ctx else None,
            ctx.language if ctx else None,
            ctx.last_error if ctx else None,
        )
        full_system = system_prompt + problem_context

        messages: list[Message] = [Message(role="system", content=full_system)]

        # Replay conversation history so the model remembers prior turns
        for h in request.history:
            messages.append(Message(role=h.role, content=h.content))

        messages.append(Message(role="user", content=request.message))
        return messages

    @property
    def last_used_model(self) -> str:
        return self._llm.last_used_model

    async def stream_reply(self, request: ChatRequest) -> AsyncIterator[str]:
        messages = self._build_messages(request)
        logger.info(
            f"[coach] streaming intent={request.intent or 'general'} "
            f"problem={request.problem_id} model={self._llm.name}"
        )

        llm_request = LLMRequest(
            messages=messages,
            temperature=self._temperature,
            max_tokens=self._max_tokens,
        )

        async for token in self._llm.stream(llm_request):
            yield token

    async def reply(self, request: ChatRequest) -> str:
        messages = self._build_messages(request)
        llm_request = LLMRequest(
            messages=messages,
            temperature=self._temperature,
            max_tokens=self._max_tokens,
        )
        return await self._llm.complete(llm_request)
