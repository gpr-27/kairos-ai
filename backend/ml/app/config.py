"""Centralised, environment-driven settings for the ML service.

Every value comes from the environment (or the repo-root ``.env.local`` / ``.env``).
There are NO environment-specific defaults: missing required values fail fast with
a clear error instead of silently falling back to localhost/dev values. The only
defaulted fields are model-tuning constants (temperature, max tokens), which are
identical across every environment.
"""

from __future__ import annotations

import sys
from functools import lru_cache
from pathlib import Path

from pydantic import Field, ValidationError, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Single source of truth: the shared .env(.local) lives ONLY at the monorepo root.
# Resolved absolutely so it is read no matter the working directory, and so no
# per-app (frontend/ or backend/) env file is ever picked up.
_REPO_ROOT = Path(__file__).resolve().parents[3]


def _prettify_model_id(model_id: str) -> str:
    """Best-effort human label for a model id (used when no explicit label given)."""
    parts = [
        p
        for chunk in model_id.replace("_", "-").replace("/", "-").split("-")
        if (p := chunk.strip())
    ]
    rendered = [p.upper() if any(ch.isdigit() for ch in p) else p.capitalize() for p in parts]
    return " ".join(rendered)


class Settings(BaseSettings):
    """All settings for the ML service, loaded from the environment."""

    model_config = SettingsConfigDict(
        # Read ONLY the shared root env files (.env.local preferred, then .env).
        env_file=(_REPO_ROOT / ".env.local", _REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ── Service (required — no env-specific defaults) ──────────────────────────
    ml_host: str
    ml_port: int
    log_level: str
    allowed_origins: str

    # ── LLM (required) ────────────────────────────────────────────────────────
    llm_provider: str
    default_model: str
    llm_fallback_model: str
    available_models: str
    # Tuning constants — identical across all environments (not env-specific).
    llm_temperature: float = Field(default=0.4, ge=0.0, le=2.0)
    llm_max_tokens: int = Field(default=2048, ge=1)

    # ── Provider credentials ──────────────────────────────────────────────────
    groq_api_key: str = ""

    # ── Derived views ─────────────────────────────────────────────────────────
    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def available_model_options(self) -> list[dict[str, str]]:
        """Parse ``AVAILABLE_MODELS`` — each entry is ``id`` or ``id|Label``."""
        options: list[dict[str, str]] = []
        for entry in self.available_models.split(","):
            entry = entry.strip()
            if not entry:
                continue
            model_id, _, label = entry.partition("|")
            model_id = model_id.strip()
            label = label.strip() or _prettify_model_id(model_id)
            options.append({"id": model_id, "label": label})
        return options

    @property
    def available_model_ids(self) -> list[str]:
        return [option["id"] for option in self.available_model_options]

    # ── Cross-field validation ────────────────────────────────────────────────
    @model_validator(mode="after")
    def _validate(self) -> Settings:
        ids = self.available_model_ids
        if not ids:
            raise ValueError("AVAILABLE_MODELS must list at least one model id")
        if self.default_model not in ids:
            raise ValueError(f"DEFAULT_MODEL '{self.default_model}' is not in AVAILABLE_MODELS")
        if self.llm_fallback_model not in ids:
            raise ValueError(
                f"LLM_FALLBACK_MODEL '{self.llm_fallback_model}' is not in AVAILABLE_MODELS"
            )
        if self.llm_provider == "groq" and not self.groq_api_key:
            raise ValueError("GROQ_API_KEY is required when LLM_PROVIDER=groq")
        return self


@lru_cache
def get_settings() -> Settings:
    """Return the validated singleton settings, failing fast on bad config."""
    try:
        # All fields are populated from the environment by pydantic-settings.
        # mypy reads BaseSettings' dataclass_transform and flags the no-arg call,
        # so the call-arg error is expected and suppressed here.
        return Settings()  # type: ignore[call-arg]
    except ValidationError as exc:
        sys.stderr.write("\n❌ Invalid or missing environment variables for the ML service:\n")
        for err in exc.errors():
            loc = ".".join(str(part) for part in err["loc"]) or "(config)"
            sys.stderr.write(f"   ❌ {loc.upper()}: {err['msg']}\n")
        sys.stderr.write("\n   Fix your .env.local (copy .env.example) and restart.\n\n")
        raise SystemExit(1) from exc


def log_settings_diagnostics() -> None:
    """Emit a concise startup banner of the active (non-secret) configuration."""
    from .logger import logger

    settings = get_settings()
    logger.info("=" * 49)
    logger.info(f"LOG_LEVEL={settings.log_level}")
    logger.info(f"ML_HOST={settings.ml_host}")
    logger.info(f"ML_PORT={settings.ml_port}")
    logger.info(f"LLM_PROVIDER={settings.llm_provider}")
    logger.info(f"DEFAULT_MODEL={settings.default_model}")
    logger.info(f"LLM_FALLBACK_MODEL={settings.llm_fallback_model}")
    logger.info(f"AVAILABLE_MODELS={len(settings.available_model_ids)}")
    logger.info(f"GROQ_API_KEY={'set ✓' if settings.groq_api_key else 'MISSING ✗'}")
    logger.info("=" * 49)
