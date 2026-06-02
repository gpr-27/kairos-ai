"""Build the configured LLM provider."""

from __future__ import annotations

from functools import lru_cache

from ..config import get_settings
from ..logger import logger
from .base import LLMProvider
from .groq_provider import GroqProvider


@lru_cache
def get_llm_provider() -> LLMProvider:
    settings = get_settings()

    # The string literal below ("groq") is an implementation identifier — it maps
    # the configured provider id (settings.llm_provider, from env) to its concrete
    # class. It is not an environment-specific config value.
    if settings.llm_provider == "groq":
        logger.info(f"[llm] using Groq provider with model={settings.default_model}")
        return GroqProvider()

    raise ValueError(
        f"Unsupported LLM_PROVIDER: {settings.llm_provider}. Only 'groq' is supported."
    )
