"""LogSync core — gather unsynced logs, archive, and ship to StorageHub."""
from __future__ import annotations

import asyncio
import gzip
import io
import json
import logging
import socket
from datetime import datetime

from database import SessionLocal
import models
from . import config, storagehub_client

log = logging.getLogger("secureops.logsync")

_BATCH = 5000  # max records per backup archive


def _iso(dt) -> str | None:
    if not dt:
        return None
    return dt.isoformat() if hasattr(dt, "isoformat") else str(dt)


def _collect(db) -> tuple[list[dict], list[int]]:
    """Return (records, device_log_ids_consumed)."""
    records: list[dict] = []
    consumed: list[int] = []

    rows = (
        db.query(models.DeviceLog)
        .filter(models.DeviceLog.backed_up == False)  # noqa: E712
        .order_by(models.DeviceLog.id.asc())
        .limit(_BATCH)
        .all()
    )
    for r in rows:
        records.append({
            "type": "device",
            "device_id": r.device_id,
            "source": r.source,
            "source_ip": r.source_ip,
            "severity": r.severity,
            "facility": r.facility,
            "message": r.message,
            "received_at": _iso(r.received_at),
        })
        consumed.append(r.id)

    if config.INCLUDE_ACTIVITY:
        acts = (
            db.query(models.AdminActivityLog)
            .order_by(models.AdminActivityLog.id.desc())
            .limit(_BATCH)
            .all()
        )
        for a in acts:
            records.append({
                "type": "activity",
                "admin": a.admin_username,
                "action": a.action,
                "details": a.details,
                "ip": a.ip_address,
                "status": a.status,
                "timestamp": _iso(a.timestamp),
            })
    return records, consumed


def _archive(records: list[dict]) -> bytes:
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb") as gz:
        for rec in records:
            gz.write((json.dumps(rec, ensure_ascii=False) + "\n").encode("utf-8"))
    return buf.getvalue()


async def run_backup() -> dict:
    """Perform one backup cycle. Safe to call manually or from the scheduler."""
    db = SessionLocal()
    run = models.LogBackupRun(status="running")
    db.add(run)
    db.commit()
    db.refresh(run)
    try:
        records, consumed = _collect(db)
        if not records:
            run.status = "success"
            run.records = 0
            run.finished_at = datetime.utcnow()
            run.detail = "nothing to back up"
            db.commit()
            return {"status": "success", "records": 0, "detail": "nothing to back up"}

        payload = _archive(records)
        host = socket.gethostname()
        stamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
        filename = f"{host}-logs-{stamp}.jsonl.gz"

        result = await storagehub_client.upload(payload, filename)

        # Mark device logs as shipped (activity logs are reference copies).
        if consumed:
            (db.query(models.DeviceLog)
               .filter(models.DeviceLog.id.in_(consumed))
               .update({models.DeviceLog.backed_up: True}, synchronize_session=False))
        run.status = "success"
        run.records = len(records)
        run.bytes_sent = len(payload)
        run.remote_path = str((result.get("data") or {}).get("path") or result.get("path") or filename)
        run.finished_at = datetime.utcnow()
        db.commit()
        log.info("LogSync backup ok: %d records, %d bytes -> %s",
                 run.records, run.bytes_sent, run.remote_path)
        return {"status": "success", "records": run.records,
                "bytes": run.bytes_sent, "remote_path": run.remote_path}
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        run.status = "failed"
        run.finished_at = datetime.utcnow()
        run.detail = str(exc)[:480]
        try:
            db.commit()
        except Exception:
            db.rollback()
        log.warning("LogSync backup failed: %s", exc)
        return {"status": "failed", "error": str(exc)}
    finally:
        db.close()


async def scheduler_loop() -> None:
    """Background loop — runs every INTERVAL_MIN minutes when configured."""
    if config.INTERVAL_MIN <= 0 or not config.backup_enabled():
        log.info("LogSync scheduler disabled (interval<=0 or StorageHub unset).")
        return
    log.info("LogSync scheduler started — every %d min -> %s",
             config.INTERVAL_MIN, config.STORAGEHUB_URL)
    # small initial delay so startup isn't blocked
    await asyncio.sleep(30)
    while True:
        try:
            await run_backup()
        except Exception as exc:  # noqa: BLE001
            log.warning("LogSync cycle error: %s", exc)
        await asyncio.sleep(config.INTERVAL_MIN * 60)
