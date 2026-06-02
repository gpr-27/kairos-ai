"""Pydantic models — keep parity with packages/types when applicable."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

CoachIntent = Literal[
    "ask",
    "hint",
    "review_code",
    "check_complexity",
    "explain_concept",
    "general",
    "playground_explain",
    "playground_debug",
    "playground_optimize",
    "playground_ask",
]

SupportedLanguage = Literal[
    "python",
    "cpp",
    "java",
    "javascript",
    "typescript",
    "go",
    "rust",
    "ruby",
    "c",
    "csharp",
    "kotlin",
    "swift",
    "php",
    "scala",
    "bash",
]


class ChatContext(BaseModel):
    current_code: str | None = Field(default=None, alias="currentCode", max_length=50_000)
    language: SupportedLanguage | None = None
    last_error: str | None = Field(default=None, alias="lastError", max_length=5000)

    model_config = {"populate_by_name": True}


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=32_000)


class ChatRequest(BaseModel):
    session_id: str | None = Field(default=None, alias="sessionId")
    problem_id: str | None = Field(default=None, alias="problemId")
    message: str = Field(min_length=1, max_length=8000)
    intent: CoachIntent | None = None
    context: ChatContext | None = None
    history: list[HistoryMessage] = Field(default_factory=list, max_length=10)
    model: str | None = None

    model_config = {"populate_by_name": True}


class StreamChunk(BaseModel):
    type: Literal["token", "tool_call", "tool_result", "done", "error"]
    content: str | None = None
    tool_name: str | None = None
    tool_args: dict[str, Any] | None = None
    tool_result: Any | None = None
    error: str | None = None
    session_id: str | None = None
    message_id: str | None = None
    model: str | None = None
