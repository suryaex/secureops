# SecureOps — Platform Monitoring Keamanan Multi-Server

**Politeknik Negeri Sriwijaya · Jurusan Teknik Elektro · Prodi D4 Teknik Telekomunikasi**
Pengembang: **Muhammad Surya Ragasin**

> Pantau **banyak server** (Linux/Windows/macOS) dari **satu dashboard glassmorphism**.
> Login pakai akun OS asli via **PAM**, akses lewat browser, install sebagai **PWA**,
> atau bangun **APK/IPA** native dengan Capacitor. Jalan **native** atau **Docker**,
> di **x86-64 maupun ARM** (Raspberry Pi / Orange Pi).

```
                     🌍 https://secureops.site
                                │  (Cloudflare Tunnel → nginx, HTTPS)
                          ┌─────▼──────┐
                          │ Controller │  FastAPI + React + SQLite · Auth: PAM → JWT
                          └─────┬──────┘
            Tailscale/WireGuard │  (X-Agent-Key)            ┌── LogSync ──┐
        ┌───────────┬───────────┼───────────┐               │ ARM / MCU   │→ HTTP
    ┌───▼───┐   ┌───▼───┐   ┌───▼───┐                       │ Router/SW/FW│→ syslog
    │ Agent │   │ Agent │   │ Agent │  (Linux/Win/macOS)    └──────┬──────┘
    └───────┘   └───────┘   └───────┘                              ▼ backup → StorageHub
```

> **Lisensi:** penggunaan **khusus internal Politeknik Negeri Sriwijaya** — lihat [LICENSE](LICENSE).

---

## 📂 Struktur

| Folder | Kegunaan |
|--------|----------|
| `controller/` | Backend FastAPI + UI React + nginx + Docker (server pusat) |
| `agent-linux/` | Agent semua distro Linux (apt/dnf/yum/zypper/pacman/apk) + Docker — x86-64 & ARM |
| `agent-windows/` | Agent Windows 10/11 & Server 2019+ |
| `agent-macos/` | Agent macOS 12+ (Intel & Apple Silicon) |

## ✨ Fitur
- 🔐 **Login Linux PAM** (anggota `sudo`/`wheel` → admin; lainnya auditor read-only) + login email/DB.
- 🌐 **Satu domain, banyak server** — Controller proxy ke tiap agent lewat mesh Tailscale.
- 🎨 **UI Luminous Security** (glassmorphism, Apple-blue), 📱 **PWA** + Capacitor.
- 📊 Modul: Dashboard · Permission Audit · Sudo Monitor · File Integrity · Activity Logs · System Health.
- 🖥️ **Terminal SSH live** (PTY via WebSocket) + 🎬 **recording** (asciinema) & playback.
- ⚡ **Auto-register agent** (one-liner, mirip Tailscale auth-key).
- 🔌 **LogSync** — kumpulkan log ARM/mikrokontroler (HTTP) & appliance jaringan (syslog) → backup ke **StorageHub**.
- 🛡️ Hardening: JWT secret non-default, security headers, rate-limit, ingest ber-kunci.

---

# 🚀 Instalasi

Ada **dua cara**: **Docker** (paling ringkas, semua dependensi di dalam image) atau
**Native** (systemd + nginx, mendukung login PAM penuh). Pilih salah satu.

## A. Controller — Docker (lightweight) ⭐

Dua image kecil berbagi base `python:3.12-slim` & `nginx:alpine`.

```bash
git clone https://github.com/suryaex/secureops.git
cd secureops
cp .env.example .env          # WAJIB isi SECUREOPS_JWT_SECRET + SECUREOPS_ADMIN_PASSWORD
#   openssl rand -base64 48   →  SECUREOPS_JWT_SECRET
docker compose up -d --build
```

Buka `http://<ip-server>/` (port di `SECUREOPS_HTTP_PORT`, default 80). Karena
container tidak melihat akun host, **login pakai admin DB** (`SECUREOPS_ADMIN_PASSWORD`
atau email). Untuk login PAM dengan akun OS asli, pakai cara **Native** di bawah.

## B. Controller — Native (systemd + nginx, login PAM)

Satu perintah, lintas distro (Ubuntu/Debian/Mint/Pop!/Fedora/RHEL/Rocky/Alma/openSUSE/Arch)
dan ARM (Pi/Orange Pi):

```bash
git clone https://github.com/suryaex/secureops.git
cd secureops
sudo SERVER_NAME=secureops.site bash controller/deploy/deploy-prod.sh
# HTTPS:
sudo certbot --nginx -d secureops.site      # atau pakai Cloudflare Tunnel (lihat bawah)
```

## C. Tambah Agent (zero-touch)

**Cara termudah:** UI → **Servers → + Add Server** → salin one-liner yang muncul →
tempel di server target → agent meng-install & auto-register sendiri.

**Agent Linux — Native:** one-liner di atas, atau manual:
```bash
sudo bash agent-linux/deploy/install.sh
```

**Agent Linux — Docker** (PID & network host agar lihat proses/port host asli):
```bash
cd agent-linux
SECUREOPS_AGENT_KEY=<shared-secret> docker compose up -d --build
```
> Audit file-integrity/sudoers paling lengkap dengan install **native**; versi Docker
> melihat `/proc` host (proses, CPU, port) dan host fs read-only di `/host`.

**Agent Windows** (PowerShell sebagai Administrator):
```powershell
iwr "https://secureops.site/api/servers/install-script/<token>?os=windows" -UseBasicParsing | iex
```

**Agent macOS:**
```bash
sudo bash agent-macos/deploy/install.sh
```

## D. Domain & HTTPS (Cloudflare Tunnel)

Tanpa IP publik pun bisa. Ringkas:
```bash
cloudflared tunnel login
cloudflared tunnel create secureops
# isi /etc/cloudflared/config.yml (UUID + service http://localhost:80), lalu:
cloudflared tunnel route dns secureops secureops.site
sudo cloudflared service install && sudo systemctl enable --now cloudflared
```
Set CORS controller bila perlu: `SECUREOPS_CORS_ORIGINS=https://secureops.site,capacitor://localhost`.

## E. Akses publik / VPN (Tailscale)

Controller di-front nginx (`server_name _`) → reachable di alamat apa pun (LAN, IP publik, VPN).
Untuk lintas-jaringan, pasang Tailscale lalu install agent via IP Tailscale:
```bash
curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up
```
Installer agent otomatis memilih IP Tailscale + probing multi-kandidat (LAN/VPN).

## F. Mobile (PWA / APK / IPA)

- **PWA:** buka situs di Android/iOS → *Add to Home Screen*.
- **Native:** `cd controller/frontend && npx cap add android && npx cap sync && npx cap open android`.

---

# 🔌 Ekstensi LogSync (opsional)

Backup log perangkat kecil & appliance ke **StorageHub**. Semua **mati default**, aktifkan via env controller lalu restart:

```bash
SECUREOPS_STORAGEHUB_URL=http://<storagehub>:8080
SECUREOPS_STORAGEHUB_API_KEY=<SERVICE_API_KEYS milik StorageHub>
SECUREOPS_LOGSYNC_INTERVAL_MIN=15      # 0 = matikan scheduler
SECUREOPS_SYSLOG_ENABLED=1             # collector router/switch/firewall
SECUREOPS_SYSLOG_PORT=5514
```

- **Mikrokontroler/ARM (HTTP):** daftar device → `POST /api/logsync/devices` (admin) → dapat `device_key`. Kirim log:
  ```bash
  curl -X POST https://secureops.site/api/logsync/ingest \
    -H "X-Device-Id: sensor-01" -H "X-Device-Key: <key>" \
    -H "Content-Type: application/json" -d '{"message":"suhu=41C","severity":"warning"}'
  ```
- **Router/switch/firewall (syslog):** arahkan ke `udp://<controller>:5514`
  (Cisco `logging host <ip> transport udp port 5514`; MikroTik/pfSense/OpenWRT serupa).

Endpoint admin (JWT): `GET /api/logsync/status` · `POST /api/logsync/backup/run` ·
`GET|POST /api/logsync/devices` · `GET /api/logsync/logs`.

---

# 🔒 Keamanan

SecureOps sudah aman secara default; untuk produksi set:
```bash
SECUREOPS_JWT_SECRET=$(openssl rand -base64 48)   # tanpa ini, di-generate & disimpan (chmod 600)
SECUREOPS_ADMIN_PASSWORD=<password-kuat>          # tanpa ini, random dicetak SEKALI ke log
SECUREOPS_BEHIND_PROXY=1                           # percaya X-Forwarded-* dari nginx
SECUREOPS_ENABLE_HSTS=1                            # hanya saat HTTPS penuh
SECUREOPS_CORS_ORIGINS=https://secureops.site,capacitor://localhost
```
- JWT secret **tidak pernah** hardcoded; security headers (`nosniff`, `DENY`, Referrer/Permissions-Policy) di tiap response.
- Auth agent shared-key (`X-Agent-Key`, URL-encoded); join token sekali-pakai di DB.
- LogSync ingest: kunci per-device (compare konstan-waktu), rate-limit, batas ukuran.
- Terminasi TLS di nginx/Cloudflare; jangan expose port backend/agent ke internet (pakai mesh).

---

# 🧹 Uninstall (sebelum major update / ganti versi)

```bash
# Controller / agent Linux (auto-deteksi):
sudo bash uninstall.sh            # hapus service & file, DATABASE DISIMPAN
sudo bash uninstall.sh --purge    # sekalian hapus DB, config, log, user

# Docker:
docker compose down               # controller   (tambah -v untuk hapus volume)
cd agent-linux && docker compose down

# Windows (PowerShell admin):
powershell -ExecutionPolicy Bypass -File agent-windows\deploy\uninstall.ps1   # -Purge utk hapus data
# macOS:
sudo bash agent-macos/deploy/uninstall.sh                                     # --purge
```

---

# 🤝 Coexist dengan StorageHub

SecureOps memakai port **`:80`/`:443`** + backend **`:8000`**; **StorageHub** memakai
**`:8080`** + **`:8010`**, sehingga keduanya bisa jalan **di host yang sama** tanpa bentrok
dan berbagi base image Docker (`python:3.12-slim`). LogSync mem-backup log SecureOps ke StorageHub.

---

# 🖥️ OS yang Didukung

**Linux (agent & controller):** Ubuntu/Debian/Mint/Pop!/Elementary/Kali · Fedora/RHEL/Rocky/Alma ·
openSUSE/SLES · Arch/Manjaro · Alpine (OpenRC) — **x86-64 & ARM (arm64/armv7)**.
**Windows:** 10 (1809+)/11 · Server 2019/2022. **macOS:** 12–15 (Intel & Apple Silicon).

---

## 📄 Lisensi
Penggunaan **khusus internal Politeknik Negeri Sriwijaya**. Lihat [LICENSE](LICENSE).
Untuk redistribusi/penggunaan di luar Polsri, hubungi pengembang via Jurusan Teknik Elektro.
