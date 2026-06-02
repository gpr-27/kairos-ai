"""System-prompt and problem-context builders."""

from __future__ import annotations

from app.agent.prompts import build_problem_context, build_system_prompt


def test_system_prompt_combines_base_and_intent() -> None:
    prompt = build_system_prompt("hint")
    assert "Kairos" in prompt
    assert "MODE: hint" in prompt
    assert "progressive hints" in prompt


def test_system_prompt_defaults_to_general() -> None:
    prompt = build_system_prompt(None)
    assert "MODE: general" in prompt


def test_problem_context_is_empty_without_signal() -> None:
    assert build_problem_context(None, None, None, None) == ""


def test_problem_context_includes_fields_and_truncates_long_code() -> None:
    context = build_problem_context("two-sum", "x" * 5000, "python", "Traceback boom")
    assert "Problem: `two-sum`" in context
    assert "Language: python" in context
    assert "Traceback boom" in context
    assert "truncated" in context
