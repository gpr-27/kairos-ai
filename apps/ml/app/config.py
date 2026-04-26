"""Environment-driven settings for the ML service."""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All settings for the ML service.

    Loaded from environment variables (or `.env.local` at the repo root).
    """

    model_config = SettingsConfigDict(
        # Support both .env.local and .env at repo/app levels.
        env_file=(
            "../.env.local",
            "../../.env.local",
            ".env.local",
            "../.env",
            "../../.env",
            ".env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Service
    ml_host: str = Field(default="0.0.0.0")
    ml_port: int = Field(default=8000)
    log_level: str = Field(default="INFO")

    # Allowed CORS origins
    allowed_origins: str = Field(default="http://localhost:5173,http://localhost:4000")

    # LLM provider
    llm_provider: Literal["groq", "hf_space", "openai"] = Field(default="groq")
    llm_model: str = Field(default="llama-3.3-70b-versatile")
    # Fallback model used automatically when the primary model returns HTTP 429
    llm_fallback_model: str = Field(default="llama-3.1-8b-instant")
    llm_temperature: float = Field(default=0.4, ge=0.0, le=2.0)
    llm_max_tokens: int = Field(default=2048, ge=1)

    # Groq
    groq_api_key: str = Field(default="")

    # HuggingFace (Week 3+)
    huggingface_token: str = Field(default="")
    huggingface_username: str = Field(default="")
    hf_space_url: str = Field(default="")

    # OpenAI fallback (optional)
    openai_api_key: str = Field(default="")

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
