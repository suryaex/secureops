"""
Smoke tests for the SecureOps controller API.

This is not exhaustive coverage — it exists to catch "the app doesn't
boot anymore" and "auth stopped enforcing" regressions, since prior to
this file the project had zero automated tests.
"""
import pytest
from fastapi import HTTPException

import auth as auth_module
from appversion import APP_VERSION


def test_health_endpoint_reports_version(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["version"] == APP_VERSION
    assert body["mode"] == "controller"


def test_routes_are_registered(client):
    # Read the generated OpenAPI schema rather than FastAPI's internal
    # routing objects — those are private and have changed shape across
    # FastAPI releases; the schema is the stable, public contract.
    paths = client.get("/openapi.json").json()["paths"]
    assert "/api/health" in paths
    assert "/api/auth/login" in paths
    assert any(p.startswith("/api/activity-logs") for p in paths)


def test_protected_endpoint_rejects_unauthenticated(client):
    resp = client.get("/api/activity-logs/")
    assert resp.status_code == 401


def test_protected_endpoint_rejects_bad_bearer_token(client):
    resp = client.get(
        "/api/activity-logs/",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert resp.status_code == 401


class _FakeRequest:
    def __init__(self, headers):
        self.headers = headers


def test_agent_mode_rejects_missing_or_bad_key(monkeypatch):
    monkeypatch.setattr(auth_module, "AGENT_MODE", True)
    monkeypatch.setattr(auth_module, "AGENT_KEY", "supersecret")

    with pytest.raises(HTTPException) as missing:
        auth_module.get_current_user(_FakeRequest({}), db=None)
    assert missing.value.status_code == 401

    with pytest.raises(HTTPException) as bad:
        auth_module.get_current_user(_FakeRequest({"x-agent-key": "wrong"}), db=None)
    assert bad.value.status_code == 401


def test_agent_mode_accepts_correct_key(monkeypatch):
    monkeypatch.setattr(auth_module, "AGENT_MODE", True)
    monkeypatch.setattr(auth_module, "AGENT_KEY", "supersecret")

    principal = auth_module.get_current_user(
        _FakeRequest({"x-agent-key": "supersecret"}), db=None
    )
    assert principal.role == "admin"
