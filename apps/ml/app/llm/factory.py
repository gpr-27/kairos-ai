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

    if settings.llm_provider == "groq":
        logger.info(f"[llm] using Groq provider with model={settings.llm_model}")
        return GroqProvider()

    if settings.llm_provider == "hf_space":
        # TODO(week-3): wire up HuggingFace Space client once your fine-tuned model is deployed.
        raise NotImplementedError("HuggingFace Space provider not implemented yet")

    if settings.llm_provider == "openai":
        raise NotImplementedError("OpenAI provider not implemented yet")

    raise ValueError(f"Unknown LLM_PROVIDER: {settings.llm_provider}")
