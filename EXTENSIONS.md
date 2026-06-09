# SecureOps Extensions

## 🔌 LogSync — back up ARM / microcontroller / appliance logs to StorageHub

LogSync turns SecureOps into a **central log collector + off-box backup** for
small devices that can't run a full agent — ARM single-board computers,
microcontrollers (ESP32/Pi Pico W), and network appliances (routers, switches,
firewalls). Collected logs are periodically archived (gzip JSONL) and pushed to
a **StorageHub** instance for safekeeping.

```
  ESP32 / Pi Pico ──HTTP──►┐
  Raspberry/Orange Pi ─────►│  SecureOps Controller  ──gzip archive──►  StorageHub
  Router/Switch/Firewall ─syslog─►┘   (LogSync)        (X-API-Key)        /backups/...
```

### 1. Enable the StorageHub backup target

On the **controller**, set these env vars (e.g. in the systemd unit or
`controller/backend/.env`) and restart `secureops-backend`:

```bash
SECUREOPS_STORAGEHUB_URL=http://<storagehub-host>:8080
SECUREOPS_STORAGEHUB_API_KEY=<one of StorageHub SERVICE_API_KEYS>
SECUREOPS_LOGSYNC_INTERVAL_MIN=15        # 0 disables the scheduler
```

On **StorageHub**, add the matching service key to its `.env` and restart:

```bash
SERVICE_API_KEYS=$(openssl rand -hex 32)
```

Verify: `GET /api/logsync/status` (admin JWT) → `"backup_configured": true`.
Trigger a manual run any time: `POST /api/logsync/backup/run`.

### 2. Microcontrollers / ARM boards (HTTP ingest)

Register the device once (admin) — you receive a one-time `device_key`:

```bash
curl -X POST https://secureops.site/api/logsync/devices \
  -H "Authorization: Bearer <ADMIN_JWT>" -H "Content-Type: application/json" \
  -d '{"device_id":"sensor-01","label":"Lab ESP32","kind":"microcontroller"}'
# → {"device_id":"sensor-01","device_key":"<SAVE THIS>","ingest_url":"/api/logsync/ingest"}
```

The device then ships logs with its id + key (no SecureOps account needed):

```bash
curl -X POST https://secureops.site/api/logsync/ingest \
  -H "X-Device-Id: sensor-01" -H "X-Device-Key: <device_key>" \
  -H "Content-Type: application/json" \
  -d '{"message":"temp=41C door=open","severity":"warning"}'
```

Batch form: `{"messages":[{"message":"...","severity":"error"}, ...]}`.
Ingest is rate-limited per device (`SECUREOPS_LOGSYNC_RATE`, default 600/min).

> **ESP32/Arduino:** use `HTTPClient` — `POST` the JSON above to the ingest URL
> with the two `X-Device-*` headers. Keep the key in NVS/flash, not in source.

### 3. Routers / switches / firewalls (syslog)

These can't run an agent but support **remote syslog**. Turn on the embedded
collector on the controller:

```bash
SECUREOPS_SYSLOG_ENABLED=1
SECUREOPS_SYSLOG_PORT=5514      # unprivileged; use 514 only if allowed to bind low ports
```

Open the port (`firewall-cmd --add-port=5514/udp` / `ufw allow 5514/udp`) then
point each appliance at `udp://<controller-ip>:5514`:

| Device | Command |
|--------|---------|
| **Cisco IOS** | `logging host <ip> transport udp port 5514` |
| **MikroTik** | `/system logging action add name=secops target=remote remote=<ip> remote-port=5514` then `/system logging add action=secops topics=info` |
| **pfSense / OPNsense** | Status → System Logs → Settings → *Remote Logging* → `<ip>:5514` |
| **OpenWRT** | `uci set system.@system[0].log_ip='<ip>'; uci set system.@system[0].log_port='5514'; uci commit; /etc/init.d/log restart` |
| **Ubiquiti EdgeOS** | `set system syslog host <ip> port 5514` |

Incoming syslog is parsed (RFC 3164/5424 priority → severity/facility) and
stored as device logs, then backed up with everything else.

### Operational endpoints (admin JWT)

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/api/logsync/status` | config + pending count + recent backup runs |
| `POST` | `/api/logsync/backup/run` | run a backup now |
| `GET`  | `/api/logsync/devices` | list registered devices |
| `POST` | `/api/logsync/devices` | register a device (returns one-time key) |
| `DELETE` | `/api/logsync/devices/{id}` | revoke a device |
| `GET`  | `/api/logsync/logs?limit=100` | recent collected logs |

All ingest paths are **opt-in** and authenticated; nothing listens until you set
the env vars above. See [`SECURITY.md`](SECURITY.md).
