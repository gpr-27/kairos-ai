"""LLM provider factory selection."""

from __future__ import annotations

import pytest

from app.config import get_settings
from app.llm import get_llm_provider
from app.llm.groq_provider import GroqProvider


def _reset_caches() -> None:
    get_settings.cache_clear()
    get_llm_provider.cache_clear()


def test_factory_builds_groq_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test_dummy")
    _reset_caches()
    try:
        provider = get_llm_provider()
        assert isinstance(provider, GroqProvider)
        assert provider.name == "groq"
    finally:
        _reset_caches()


def test_factory_rejects_unknown_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "hf_space")
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test_dummy")
    _reset_caches()
    try:
        with pytest.raises(ValueError, match="Unsupported LLM_PROVIDER"):
            get_llm_provider()
    finally:
        _reset_caches()


def test_groq_provider_requires_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_API_KEY", "")
    _reset_caches()
    try:
        # The centralised settings fail fast (SystemExit) when GROQ_API_KEY is
        # missing for the groq provider, before GroqProvider's own guard runs.
        with pytest.raises(SystemExit):
            GroqProvider()
    finally:
        _reset_caches()
