"""Minimal StorageHub ingest client (service-key authenticated)."""
from __future__ import annotations

import httpx

from . import config


class StorageHubError(RuntimeError):
    pass


async def upload(content: bytes, filename: str, source: str | None = None) -> dict:
    """POST a backup archive to StorageHub's service ingest endpoint.

    Auth: shared service key in the `X-API-Key` header (constant-time compared
    on the StorageHub side). Returns the parsed JSON envelope on success.
    """
    if not config.backup_enabled():
        raise StorageHubError("StorageHub backup not configured "
                              "(set SECUREOPS_STORAGEHUB_URL + _API_KEY).")

    url = f"{config.STORAGEHUB_URL}/api/v1/ingest/logs"
    headers = {"X-API-Key": config.STORAGEHUB_API_KEY}
    data = {"source": source or config.STORAGEHUB_SOURCE}
    files = {"file": (filename, content, "application/gzip")}

    try:
        async with httpx.AsyncClient(
            timeout=60.0, verify=config.STORAGEHUB_VERIFY_TLS
        ) as client:
            resp = await client.post(url, headers=headers, data=data, files=files)
    except httpx.HTTPError as exc:
        raise StorageHubError(f"connection failed: {exc}") from exc

    if resp.status_code == 401 or resp.status_code == 403:
        raise StorageHubError("StorageHub rejected the service API key (401/403).")
    if resp.status_code >= 400:
        raise StorageHubError(f"StorageHub returned {resp.status_code}: {resp.text[:200]}")
    try:
        return resp.json()
    except ValueError:
        return {"raw": resp.text[:200]}
