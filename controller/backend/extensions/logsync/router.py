"""LogSync HTTP API — device ingest (ARM/MCU) + admin management."""
from __future__ import annotations

import hmac
import secrets
import time
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
import models
from auth import get_current_user
from . import config, service

router = APIRouter()

# --- naive per-device rate limiter (in-memory, per worker) ---
_RL: dict[str, list] = {}


def _rate_ok(device_id: str) -> bool:
    now = time.time()
    win = _RL.get(device_id)
    if not win or now - win[0] >= 60:
        _RL[device_id] = [now, 1]
        return True
    if win[1] >= config.INGEST_RATE_PER_MIN:
        return False
    win[1] += 1
    return True


# ----------------------------- schemas -----------------------------
class LogItem(BaseModel):
    message: str = Field(..., max_length=16384)
    severity: str = Field("info", max_length=20)
    facility: Optional[str] = Field(None, max_length=40)


class IngestBody(BaseModel):
    device_id: Optional[str] = Field(None, max_length=120)
    message: Optional[str] = Field(None, max_length=16384)
    severity: str = Field("info", max_length=20)
    messages: Optional[list[LogItem]] = None


class DeviceCreate(BaseModel):
    device_id: str = Field(..., max_length=120)
    label: Optional[str] = Field(None, max_length=160)
    kind: str = Field("microcontroller", max_length=40)


# ----------------------------- ingest ------------------------------
def _auth_device(db: Session, device_id: str, device_key: str) -> models.LogDevice:
    dev = (db.query(models.LogDevice)
             .filter(models.LogDevice.device_id == device_id,
                     models.LogDevice.enabled == True).first())  # noqa: E712
    if not dev or not device_key or not hmac.compare_digest(dev.device_key, device_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid device id or key")
    return dev


@router.post("/ingest", status_code=202)
def ingest(
    body: IngestBody,
    request: Request,
    db: Session = Depends(get_db),
    x_device_id: Optional[str] = Header(None),
    x_device_key: Optional[str] = Header(None),
):
    """Ingest one or more log lines from an ARM board / microcontroller.

    Auth headers:  X-Device-Id, X-Device-Key  (device must be registered).
    Body (JSON):   {"message": "...", "severity": "info"}  OR
                   {"messages": [{"message": "...", "severity": "error"}, ...]}
    """
    device_id = x_device_id or body.device_id
    if not device_id:
        raise HTTPException(status_code=400, detail="Missing device id")
    dev = _auth_device(db, device_id, x_device_key or "")

    if not _rate_ok(device_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    items: list[LogItem] = []
    if body.messages:
        items.extend(body.messages[:1000])
    if body.message:
        items.append(LogItem(message=body.message, severity=body.severity))
    if not items:
        raise HTTPException(status_code=400, detail="No log message provided")

    ip = request.client.host if request.client else None
    for it in items:
        db.add(models.DeviceLog(
            device_id=device_id, source="http", source_ip=ip,
            severity=(it.severity or "info")[:20],
            facility=it.facility, message=it.message[: config.MAX_MESSAGE_BYTES],
        ))
    dev.last_seen = datetime.utcnow()
    db.commit()
    return {"accepted": len(items)}


# ----------------------------- admin -------------------------------
def _require_admin(user: models.Admin = Depends(get_current_user)) -> models.Admin:
    if getattr(user, "role", None) != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


@router.get("/status")
def status_(db: Session = Depends(get_db), _: models.Admin = Depends(_require_admin)):
    last = (db.query(models.LogBackupRun)
              .order_by(models.LogBackupRun.id.desc()).limit(10).all())
    pending = (db.query(models.DeviceLog)
                 .filter(models.DeviceLog.backed_up == False).count())  # noqa: E712
    return {
        "backup_configured": config.backup_enabled(),
        "storagehub_url": config.STORAGEHUB_URL or None,
        "interval_min": config.INTERVAL_MIN,
        "syslog_enabled": config.SYSLOG_ENABLED,
        "syslog_port": config.SYSLOG_PORT,
        "pending_device_logs": pending,
        "recent_runs": [{
            "id": r.id, "status": r.status, "records": r.records,
            "bytes": r.bytes_sent, "remote_path": r.remote_path,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "detail": r.detail,
        } for r in last],
    }


@router.post("/backup/run")
async def backup_now(_: models.Admin = Depends(_require_admin)):
    if not config.backup_enabled():
        raise HTTPException(status_code=400,
                            detail="StorageHub backup not configured")
    return await service.run_backup()


@router.get("/devices")
def list_devices(db: Session = Depends(get_db), _: models.Admin = Depends(_require_admin)):
    devs = db.query(models.LogDevice).order_by(models.LogDevice.id.desc()).all()
    return [{
        "id": d.id, "device_id": d.device_id, "label": d.label, "kind": d.kind,
        "enabled": d.enabled,
        "last_seen": d.last_seen.isoformat() if d.last_seen else None,
    } for d in devs]


@router.post("/devices", status_code=201)
def create_device(body: DeviceCreate, db: Session = Depends(get_db),
                  _: models.Admin = Depends(_require_admin)):
    if db.query(models.LogDevice).filter(
            models.LogDevice.device_id == body.device_id).first():
        raise HTTPException(status_code=409, detail="device_id already exists")
    key = secrets.token_urlsafe(32)
    db.add(models.LogDevice(device_id=body.device_id, label=body.label,
                            kind=body.kind, device_key=key))
    db.commit()
    # device_key is shown ONCE — the client must store it now.
    return {"device_id": body.device_id, "device_key": key,
            "ingest_url": "/api/logsync/ingest"}


@router.delete("/devices/{device_pk}", status_code=204)
def delete_device(device_pk: int, db: Session = Depends(get_db),
                  _: models.Admin = Depends(_require_admin)):
    dev = db.query(models.LogDevice).filter(models.LogDevice.id == device_pk).first()
    if dev:
        db.delete(dev)
        db.commit()
    return None


@router.get("/logs")
def recent_logs(limit: int = 100, db: Session = Depends(get_db),
                _: models.Admin = Depends(_require_admin)):
    limit = max(1, min(limit, 1000))
    rows = (db.query(models.DeviceLog)
              .order_by(models.DeviceLog.id.desc()).limit(limit).all())
    return [{
        "id": r.id, "device_id": r.device_id, "source": r.source,
        "source_ip": r.source_ip, "severity": r.severity, "message": r.message,
        "received_at": r.received_at.isoformat() if r.received_at else None,
        "backed_up": r.backed_up,
    } for r in rows]
