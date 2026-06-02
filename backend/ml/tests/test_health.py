"""Health endpoint smoke test."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app


def test_health_returns_ok() -> None:
    client = TestClient(create_app())
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["status"] == "ok"
    assert body["service"] == "kairos-ai-coach"
    assert body["provider"] == "groq"
    assert body["model"]

    models = body["models"]
    assert isinstance(models, list) and models
    for option in models:
        assert set(option) == {"id", "label"}
        assert option["id"] and option["label"]
