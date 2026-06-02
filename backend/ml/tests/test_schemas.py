"""Request/response schema validation."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas import ChatRequest, StreamChunk


def test_chat_request_accepts_camelcase_aliases() -> None:
    request = ChatRequest.model_validate(
        {
            "sessionId": "s1",
            "problemId": "two-sum",
            "message": "help me",
            "intent": "hint",
            "context": {
                "currentCode": "print(1)",
                "language": "python",
                "lastError": "boom",
            },
        }
    )

    assert request.session_id == "s1"
    assert request.problem_id == "two-sum"
    assert request.context is not None
    assert request.context.current_code == "print(1)"
    assert request.context.language == "python"
    assert request.context.last_error == "boom"


def test_message_is_required_and_bounded() -> None:
    with pytest.raises(ValidationError):
        ChatRequest.model_validate({"message": ""})
    with pytest.raises(ValidationError):
        ChatRequest.model_validate({"message": "x" * 8001})


def test_history_is_capped_at_ten() -> None:
    history = [{"role": "user", "content": "q"} for _ in range(11)]
    with pytest.raises(ValidationError):
        ChatRequest.model_validate({"message": "hi", "history": history})


def test_unknown_language_is_rejected() -> None:
    with pytest.raises(ValidationError):
        ChatRequest.model_validate({"message": "hi", "context": {"language": "cobol"}})


def test_stream_chunk_drops_none_fields() -> None:
    chunk = StreamChunk(type="token", content="hi")
    assert chunk.model_dump(exclude_none=True) == {"type": "token", "content": "hi"}
