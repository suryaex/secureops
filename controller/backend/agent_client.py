"""
Agent client — forwards API calls from the central Controller to a remote
Agent running SecureOps in AGENT_MODE.

Auth model:
   Controller signs each outbound request with header  X-Agent-Key: <shared>
   Agent verifies it and skips JWT/PAM (controller already authenticated user).

The controller-to-agent network is assumed to be private (Tailscale, WireGuard,
or LAN). Even so, the shared key prevents lateral movement.
"""
import asyncio
import json
from datetime import datetime, timedelta
from typing import Any, Optional

import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session

import models

DEFAULT_TIMEOUT  = 15.0
HEALTH_CACHE_TTL = 10        # seconds — avoid hammering agents


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        timeout=DEFAULT_TIMEOUT,
        verify=False,        # private network — self-signed allowed
        follow_redirects=True,
    )


def resolve_server(db: Session, server_id: Optional[int]) -> Optional[models.MonitoredServer]:
    """
    Return the target server or None for the local controller itself.

    - server_id=None or 0  → controller-local (no forwarding)
    - server_id=<int>      → look up; raise 404 if missing or disabled
    """
    if not server_id or server_id == 0:
        return None
    srv = db.query(models.MonitoredServer).filter(
        models.MonitoredServer.id == server_id,
        models.MonitoredServer.enabled == True,
    ).first()
    if not srv:
        raise HTTPException(404, f"Server id={server_id} not found or disabled")
    if srv.is_local:
        return None
    return srv


async def agent_request(srv: models.MonitoredServer,
                        method: str,
                        path: str,
                        *,
                        params: Optional[dict] = None,
                        json_body: Any = None) -> httpx.Response:
    """
    Send a request to the agent and return the raw httpx Response.
    Caller is responsible for handling the response (proxying body/status).
    """
    url = f"{srv.api_url.rstrip('/')}{path}"
    headers = {"X-Agent-Key": srv.api_key, "User-Agent": "SecureOps-Controller/1.2"}
    try:
        async with _client() as c:
            return await c.request(method, url, params=params, json=json_body, headers=headers)
    except (httpx.ConnectError, httpx.ConnectTimeout) as e:
        raise HTTPException(502, f"Agent '{srv.name}' unreachable: {e}")
    except httpx.HTTPError as e:
        raise HTTPException(502, f"Agent '{srv.name}' error: {e}")


async def agent_get_json(srv: models.MonitoredServer, path: str,
                         params: Optional[dict] = None) -> Any:
    """Convenience: GET → parse JSON, raise on non-2xx."""
    r = await agent_request(srv, "GET", path, params=params)
    if r.status_code >= 400:
        raise HTTPException(r.status_code, r.text)
    return r.json()


async def agent_post_json(srv: models.MonitoredServer, path: str,
                          json_body: Any = None) -> Any:
    r = await agent_request(srv, "POST", path, json_body=json_body)
    if r.status_code >= 400:
        raise HTTPException(r.status_code, r.text)
    return r.json()


async def _probe_one(url: str, api_key: str, timeout: float = 4.0) -> bool:
    """True jika /api/health di url merespons 200."""
    try:
        async with _client() as c:
            r = await c.get(
                f"{url.rstrip('/')}/api/health",
                headers={"X-Agent-Key": api_key},
                timeout=timeout,
            )
        return r.status_code == 200
    except Exception:
        return False


def _candidate_urls(srv: models.MonitoredServer) -> list:
    """
    Susun daftar URL kandidat untuk dicoba, urut prioritas:
    1. api_url aktif saat ini (yang terakhir berhasil)
    2. daftar candidates JSON (Tailscale, LAN, hostname)
    Tanpa duplikat, mempertahankan urutan.
    """
    urls = []
    if srv.api_url:
        urls.append(srv.api_url.rstrip("/"))
    if srv.candidates:
        try:
            for u in json.loads(srv.candidates):
                u = (u or "").rstrip("/")
                if u and u not in urls:
                    urls.append(u)
        except Exception:
            pass
    return urls


async def ping_agent(srv: models.MonitoredServer, db: Session) -> dict:
    """
    Health probe cerdas multi-jaringan.

    Mencoba SEMUA URL kandidat (api_url aktif + Tailscale + LAN + hostname).
    URL pertama yang merespons dipromosikan menjadi api_url aktif, sehingga
    agent tetap terjangkau baik di LAN yang sama maupun lintas jaringan via VPN.
    """
    candidates = _candidate_urls(srv)
    if not candidates:
        srv.last_status = "offline"
        srv.last_error  = "Tidak ada URL kandidat"
        srv.last_seen   = datetime.utcnow()
        db.commit()
        return {"status": "offline", "error": srv.last_error}

    # Coba URL aktif dulu (cepat), lalu kandidat lain secara paralel
    active = candidates[0]
    if await _probe_one(active, srv.api_key):
        srv.last_status = "online"
        srv.last_error  = None
        srv.last_seen   = datetime.utcnow()
        db.commit()
        return {"status": "online", "active_url": active}

    # URL aktif gagal — uji semua kandidat lain bersamaan
    others = candidates[1:]
    if others:
        results = await asyncio.gather(*(_probe_one(u, srv.api_key) for u in others))
        for url, ok in zip(others, results):
            if ok:
                # Promosikan kandidat yang berhasil jadi api_url aktif
                srv.api_url     = url
                srv.last_status = "online"
                srv.last_error  = None
                srv.last_seen   = datetime.utcnow()
                db.commit()
                return {"status": "online", "active_url": url, "switched": True}

    # Semua kandidat gagal
    srv.last_status = "offline"
    srv.last_error  = f"Semua {len(candidates)} URL tidak terjangkau"
    srv.last_seen   = datetime.utcnow()
    db.commit()
    return {"status": "offline", "error": srv.last_error, "tried": candidates}


async def ping_all(db: Session) -> dict:
    """Refresh online status for all enabled remote servers (parallel)."""
    servers = db.query(models.MonitoredServer).filter(
        models.MonitoredServer.enabled == True,
        models.MonitoredServer.is_local == False,
    ).all()
    if not servers:
        return {"checked": 0}
    await asyncio.gather(*(ping_agent(s, db) for s in servers))
    return {"checked": len(servers)}
