<div align="center">

# SecureOps

**Self-hosted multi-server security monitoring platform**

*PAM login · real-time agents · glassmorphism dashboard — one lightweight stack.*

![Version](https://img.shields.io/badge/version-1.2.10-brightgreen)
![Channel](https://img.shields.io/badge/channel-alpha-orange)
![License](https://img.shields.io/badge/license-Polsri--Internal-red)
![Python](https://img.shields.io/badge/python-3.12+-blue)
![React](https://img.shields.io/badge/react-18-61dafb)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows%20%7C%20macOS-lightgrey)

</div>

---

## Installation

**Prerequisites:** Git, Docker + Docker Compose, free port **80** (override with `SECUREOPS_HTTP_PORT`).
On Linux the installer auto-installs Docker (Fedora, Ubuntu, Debian, RHEL, Arch); on Windows/macOS install Docker Desktop first.

**One command (Linux):**

```bash
curl -fsSL https://raw.githubusercontent.com/suryaex/secureops/main/bootstrap.sh | bash
```

Pass extra flags straight through:

```bash
curl -fsSL https://raw.githubusercontent.com/suryaex/secureops/main/bootstrap.sh | bash -s -- --prod
```

**Manual:**

```bash
git clone https://github.com/suryaex/secureops.git
cd secureops
./install.sh
```

The installer generates secrets, builds the stack (FastAPI backend + React frontend behind nginx), waits for `/api/health`, and prints the URLs + admin password:

```
On this machine  ->  http://localhost
On the network   ->  http://<LAN-IP>
Login: user 'admin' / password: <printed once>
```

**Common options:**

| Command | Effect |
|---|---|
| `./install.sh` | Build + start (auto Docker, generate `.env`, detect LAN) |
| `./install.sh --prod` | Production overlay (`restart=always` + log rotation) |
| `./install.sh --rebuild` | Force rebuild — no cache |
| `./install.sh --tailscale` | Join Tailscale, bind to its VPN IP |
| `./install.sh --public` | Detect public IP and add to CORS |
| `./install.sh --down` | Stop the stack |
| `./install.sh --reset` | Stop and delete all data (volumes) |
| `./install.sh --reset --yes` | Same, skip confirmation (CI/scripts) |
| `./install.sh --no-updater` | Skip in-app "Update & restart" host watcher |
| `SECUREOPS_HTTP_PORT=8080 ./install.sh` | Use a different port |
| `./uninstall.sh` | Remove services + files, keep database |
| `./uninstall.sh --purge` | Full clean — also remove database, configs, logs, user |
| `./uninstall.sh --yes` | Skip confirmation prompt |

> **Native install (PAM login):** `sudo bash controller/deploy/deploy-prod.sh` — runs on systemd + nginx without Docker; full Linux PAM login support.

<details>
<summary>Run backend / frontend directly (development)</summary>

```bash
# Backend
cd controller/backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000   # http://localhost:8000/docs

# Frontend
cd controller/frontend
npm install
npm run dev                             # http://localhost:5173
```

</details>

---

## Features

- **PAM login** — authenticate with real OS accounts via Linux PAM. Members of `sudo`/`wheel` get admin access; all others are read-only auditors. Email/DB login also supported.

- **Multi-server monitoring** — Controller proxies to per-host Agents over a Tailscale/WireGuard mesh (`X-Agent-Key`). One-liner agent registration (Tailscale-style auth key).

- **Dashboard modules** — Dashboard · Permission Audit · Sudo Monitor · File Integrity · Activity Logs · System Health — all streaming from live agents.

- **Live SSH terminal** — PTY over WebSocket with asciinema session recording and in-browser playback.

- **LogSync** — collect logs from ARM/microcontrollers (HTTP) and network appliances (syslog: Cisco, MikroTik, pfSense, OpenWRT), then back up to StorageHub.

- **In-app self-update** — Settings → *Software update* pulls the latest GitHub release, rebuilds, and restarts; works on Docker and bare-metal native installs.

- **PWA + Mobile** — installable as a Progressive Web App on Android/iOS, or build a native APK/IPA with Capacitor (`npx cap add android`).

- **Security hardening** — JWT secret never hardcoded, security headers on every response (`nosniff`, `X-Frame-Options: DENY`, Referrer/Permissions-Policy), rate limiting, constant-time key comparison on ingest endpoints.

- **Cross-platform agents** — Linux (x86-64 and ARM: Raspberry Pi, Orange Pi), Windows 10/11 + Server, macOS 12–15 (Intel and Apple Silicon).

---

## Tech Stack

**Backend:** Python 3.12+, FastAPI (async), SQLite, Gunicorn + Uvicorn.
**Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, Capacitor (PWA/mobile).
**Infra:** Docker + Docker Compose behind nginx. Cloudflare Tunnel for HTTPS without a public IP.

---

## Coexisting with StorageHub

SecureOps uses ports **`:80` / `:8000`**; StorageHub uses **`:8080` / `:8010`** — both can run on the same host without conflict and share a Docker base image (`python:3.12-slim`). LogSync backs SecureOps logs into StorageHub automatically.

---

## License

**Internal use only — Politeknik Negeri Sriwijaya.**
This software is not licensed for redistribution or use outside Polsri. For external use, contact the developer via Jurusan Teknik Elektro, Politeknik Negeri Sriwijaya.

© Muhammad Surya Ragasin — D4 Teknik Telekomunikasi, Politeknik Negeri Sriwijaya.
