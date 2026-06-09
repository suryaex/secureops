"""Embedded syslog collector for routers / switches / firewalls.

These appliances cannot run a SecureOps agent, but virtually all of them can
forward logs over syslog (Cisco IOS, MikroTik RouterOS, pfSense/OPNsense,
OpenWRT, Ubiquiti, etc.). We accept RFC 3164 / 5424 messages over UDP and TCP,
parse the priority, and persist each line as a DeviceLog row (source="syslog")
so it gets backed up to StorageHub like everything else.
"""
from __future__ import annotations

import asyncio
import logging
import re
from datetime import datetime

from database import SessionLocal
import models
from . import config

log = logging.getLogger("secureops.logsync.syslog")

_SEV = ["emergency", "alert", "critical", "error",
        "warning", "notice", "info", "debug"]
_SEV_NORM = {"emergency": "critical", "alert": "critical", "critical": "critical",
             "error": "error", "warning": "warning", "notice": "info",
             "info": "info", "debug": "info"}
_PRI_RE = re.compile(rb"^<(\d{1,3})>")
# RFC3164: "<PRI>Mon dd hh:mm:ss HOST tag: msg" — grab HOST token if present.
_HOST_RE = re.compile(
    rb"^<\d{1,3}>(?:\w{3}\s+\d+\s[\d:]+\s)?([A-Za-z0-9_.:-]+)?")


def _parse(raw: bytes, peer_ip: str) -> dict:
    raw = raw[: config.MAX_MESSAGE_BYTES]
    sev_name, fac = "info", None
    m = _PRI_RE.match(raw)
    body = raw
    if m:
        try:
            pri = int(m.group(1))
            sev_name = _SEV[pri & 7]
            fac = str(pri >> 3)
        except (ValueError, IndexError):
            pass
        body = raw[m.end():]
    device_id = peer_ip
    hm = _HOST_RE.match(raw)
    if hm and hm.group(1):
        host = hm.group(1).decode("ascii", "ignore")
        if host and not host[0].isdigit():  # avoid grabbing the timestamp day
            device_id = host
    msg = body.decode("utf-8", "replace").strip() or raw.decode("utf-8", "replace")
    return {
        "device_id": device_id,
        "source": "syslog",
        "source_ip": peer_ip,
        "severity": _SEV_NORM.get(sev_name, "info"),
        "facility": fac,
        "message": msg[: config.MAX_MESSAGE_BYTES],
    }


def _store(rec: dict) -> None:
    db = SessionLocal()
    try:
        db.add(models.DeviceLog(**rec))
        # touch device registry (best-effort)
        dev = (db.query(models.LogDevice)
                 .filter(models.LogDevice.device_id == rec["device_id"]).first())
        if dev:
            dev.last_seen = datetime.utcnow()
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        log.debug("syslog store error: %s", exc)
    finally:
        db.close()


class _UDPProtocol(asyncio.DatagramProtocol):
    def datagram_received(self, data: bytes, addr):
        ip = addr[0] if addr else "unknown"
        try:
            _store(_parse(data, ip))
        except Exception as exc:  # noqa: BLE001
            log.debug("udp parse error: %s", exc)


async def _handle_tcp(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    peer = writer.get_extra_info("peername")
    ip = peer[0] if peer else "unknown"
    try:
        while True:
            line = await reader.readline()
            if not line:
                break
            try:
                _store(_parse(line.rstrip(b"\r\n"), ip))
            except Exception as exc:  # noqa: BLE001
                log.debug("tcp parse error: %s", exc)
    finally:
        try:
            writer.close()
        except Exception:
            pass


async def start() -> None:
    """Start UDP and/or TCP syslog listeners (non-blocking)."""
    if not config.SYSLOG_ENABLED:
        return
    loop = asyncio.get_running_loop()
    started = []
    if config.SYSLOG_UDP:
        try:
            await loop.create_datagram_endpoint(
                _UDPProtocol, local_addr=(config.SYSLOG_HOST, config.SYSLOG_PORT))
            started.append("udp")
        except OSError as exc:
            log.warning("syslog UDP bind failed on %s:%s — %s",
                        config.SYSLOG_HOST, config.SYSLOG_PORT, exc)
    if config.SYSLOG_TCP:
        try:
            server = await asyncio.start_server(
                _handle_tcp, config.SYSLOG_HOST, config.SYSLOG_PORT)
            started.append("tcp")
            asyncio.create_task(server.serve_forever())
        except OSError as exc:
            log.warning("syslog TCP bind failed on %s:%s — %s",
                        config.SYSLOG_HOST, config.SYSLOG_PORT, exc)
    if started:
        log.info("Syslog collector listening on %s:%s (%s)",
                 config.SYSLOG_HOST, config.SYSLOG_PORT, "+".join(started))
