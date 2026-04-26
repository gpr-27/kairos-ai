"""Structured logging via loguru."""

from __future__ import annotations

import sys

from loguru import logger

from .config import get_settings


def configure_logger() -> None:
    """Configure a single, well-formatted log sink."""
    settings = get_settings()

    logger.remove()
    logger.add(
        sys.stderr,
        level=settings.log_level.upper(),
        format=(
            "<green>{time:HH:mm:ss.SSS}</green> "
            "<level>{level: <7}</level> "
            "<cyan>{name}:{function}:{line}</cyan> - "
            "<level>{message}</level>"
        ),
        colorize=True,
        backtrace=False,
        diagnose=False,
    )


__all__ = ["logger", "configure_logger"]
