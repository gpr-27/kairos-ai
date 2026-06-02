"""End-to-end chat route tests with a stubbed coach (no live Groq call)."""

from __future__ import annotations

from conftest import FakeLLMProvider
from fastapi.testclient import TestClient

import app.routes.chat as chat_module
from app.agent.coach import CoachAgent
from app.main import create_app


def _client_with_fake_agent(
    monkeypatch: object,
    provider: FakeLLMProvider,
) -> TestClient:
    agent = CoachAgent(llm=provider)
    monkeypatch.setattr(chat_module, "_agent_instance", agent)  # type: ignore[attr-defined]
    return TestClient(create_app())


def test_chat_complete_returns_reply(monkeypatch, fake_provider: FakeLLMProvider) -> None:
    client = _client_with_fake_agent(monkeypatch, fake_provider)
    response = client.post("/chat", json={"message": "Hi", "intent": "ask"})

    assert response.status_code == 200
    assert response.json()["data"]["reply"] == "full reply"


def test_chat_stream_emits_tokens_then_done(monkeypatch, fake_provider: FakeLLMProvider) -> None:
    client = _client_with_fake_agent(monkeypatch, fake_provider)
    response = client.post("/chat/stream", json={"message": "Hi"})

    assert response.status_code == 200
    text = response.text
    assert '"type":"token"' in text
    assert "Hello" in text
    assert '"type":"done"' in text
    assert "fake-model-1" in text


def test_chat_rejects_empty_message(monkeypatch, fake_provider: FakeLLMProvider) -> None:
    client = _client_with_fake_agent(monkeypatch, fake_provider)
    response = client.post("/chat", json={"message": ""})
    assert response.status_code == 422


def test_chat_rejects_unknown_model(monkeypatch, fake_provider: FakeLLMProvider) -> None:
    client = _client_with_fake_agent(monkeypatch, fake_provider)
    response = client.post("/chat", json={"message": "Hi", "model": "no-such-model"})
    assert response.status_code == 422
    assert "no-such-model" in response.json()["detail"]
