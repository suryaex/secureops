"""
Shared pytest fixtures for the SecureOps backend test suite.

Boots the real FastAPI app ONCE per test session, wired to a throwaway
SQLite file under pytest's tmp_path — never controller/backend/secureops.db.
Env vars are set before `import main` so database.py picks up the temp DB.
"""
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def app(tmp_path_factory):
    db_path = tmp_path_factory.mktemp("secureops-test") / "test.db"
    os.environ["SECUREOPS_DATABASE_URL"] = f"sqlite:///{db_path}"
    os.environ.setdefault("SECUREOPS_JWT_SECRET", "test-only-secret-not-for-prod")
    os.environ.setdefault("SECUREOPS_ADMIN_PASSWORD", "test-admin-pw")

    import main  # noqa: PLC0415 — must import after env vars are set
    return main.app


@pytest.fixture(scope="session")
def client(app):
    with TestClient(app) as c:
        yield c
