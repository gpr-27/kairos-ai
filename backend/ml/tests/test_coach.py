"""Coach agent behaviour with an injected fake provider."""

from __future__ import annotations

from conftest import FakeLLMProvider

from app.agent.coach import CoachAgent
from app.schemas import ChatRequest


async def test_reply_returns_full_completion(fake_provider: FakeLLMProvider) -> None:
    agent = CoachAgent(llm=fake_provider)
    reply = await agent.reply(ChatRequest(message="What is a hash map?", intent="explain_concept"))
    assert reply == "full reply"
    assert agent.last_used_model == "fake-model-1"


async def test_stream_reply_yields_token_sequence(fake_provider: FakeLLMProvider) -> None:
    agent = CoachAgent(llm=fake_provider)
    tokens = [token async for token in agent.stream_reply(ChatRequest(message="hi"))]
    assert "".join(tokens) == "Hello, world"


def test_build_messages_orders_system_history_then_user(fake_provider: FakeLLMProvider) -> None:
    agent = CoachAgent(llm=fake_provider)
    request = ChatRequest(
        message="latest question",
        intent="hint",
        history=[
            {"role": "user", "content": "earlier-q"},
            {"role": "assistant", "content": "earlier-a"},
        ],
    )

    messages = agent._build_messages(request)
    assert messages[0].role == "system"
    assert "MODE: hint" in messages[0].content
    assert messages[1].content == "earlier-q"
    assert messages[2].content == "earlier-a"
    assert messages[-1].role == "user"
    assert messages[-1].content == "latest question"
