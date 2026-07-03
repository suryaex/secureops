"""Single source of truth for the SecureOps version.

Imported by ``main.py`` (FastAPI app version) and ``updater.py`` (the in-app
self-update check). Override at runtime with ``SECUREOPS_VERSION`` if a build
pipeline injects a different tag.
"""
import os

APP_VERSION = os.getenv("SECUREOPS_VERSION", "1.2.5")
