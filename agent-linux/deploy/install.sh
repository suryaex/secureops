#!/usr/bin/env bash
# SecureOps AGENT installer (Linux — lintas distro)
#
# Supports: Debian/Ubuntu family (apt), Fedora/RHEL/Rocky/Alma (dnf/yum),
#           openSUSE (zypper), Arch/Manjaro (pacman), Alpine (apk + OpenRC).
#           Init: systemd (default) atau OpenRC (Alpine).
#
# Usage (RECOMMENDED — agent generates its own key):
#   sudo bash install.sh
#   → outputs API key at the end. Paste it into Controller UI.
#
# Usage (legacy — pre-generated key from controller):
#   sudo SECUREOPS_AGENT_KEY=<key> bash install.sh
#
# Optional env vars:
#   SECUREOPS_AGENT_PORT      = 8001
#   SKIP_TAILSCALE            = 1   (skip on LAN-only setups)
#   SECUREOPS_SHELL_USER      = secureops   (drop-privileges shell)
#   SECUREOPS_SHELL_CMD       = /usr/bin/zsh -l
#   SECUREOPS_RECORD_SESSIONS = 1
#   SECUREOPS_RECORD_DIR      = /var/log/secureops/sessions
#   REPO_URL / INSTALL_DIR
#   KEY_FILE                  = /etc/secureops-agent/key  (where key persists)

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/suryaex/secureops.git}"
INSTALL_DIR="${INSTALL_DIR:-/opt/secureops-agent}"
PORT="${SECUREOPS_AGENT_PORT:-8001}"
KEY="${SECUREOPS_AGENT_KEY:-}"
KEY_FILE="${KEY_FILE:-/etc/secureops-agent/key}"
SKIP_TS="${SKIP_TAILSCALE:-0}"

SHELL_USER="${SECUREOPS_SHELL_USER:-}"
SHELL_CMD="${SECUREOPS_SHELL_CMD:-}"
RECORD="${SECUREOPS_RECORD_SESSIONS:-0}"
RECORD_DIR_VAR="${SECUREOPS_RECORD_DIR:-/var/log/secureops/sessions}"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
say()  { echo -e "${GREEN}==> $*${NC}"; }
info() { echo -e "${BLUE}ℹ  $*${NC}"; }
warn() { echo -e "${YELLOW}!! $*${NC}"; }
die()  { echo -e "${RED}ERROR: $*${NC}"; exit 1; }

[[ $EUID -ne 0 ]] && die "Run with sudo / as root."

# -------- Migrasi: hapus instalasi lama saat join ke controller baru --------
# Jika SECUREOPS_JOIN_TOKEN diberikan (alur join via UI), ini berarti agent
# sedang didaftarkan ke controller (baru/ganti). Bersihkan key & service lama.
if [[ -n "${SECUREOPS_JOIN_TOKEN:-}" ]]; then
  say "Mode join controller terdeteksi — membersihkan instalasi lama…"
  systemctl stop secureops-agent 2>/dev/null || rc-service secureops-agent stop 2>/dev/null || true
  # Hapus key lama supaya key BARU di-generate untuk controller baru
  if [[ -z "$KEY" && -f "$KEY_FILE" ]]; then
    info "Menghapus key lama di $KEY_FILE (pindah controller)"
    rm -f "$KEY_FILE"
  fi
fi

# -------- API key: reuse existing → env override → generate new --------
GENERATED_KEY=0
if [[ -z "$KEY" ]]; then
  if [[ -f "$KEY_FILE" ]]; then
    KEY="$(cat "$KEY_FILE")"
    info "Reusing existing key at $KEY_FILE"
  else
    # Generate a 43-char URL-safe key (32 bytes base64-url, no padding)
    if command -v openssl >/dev/null 2>&1; then
      KEY="$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-43)"
    else
      KEY="$(head -c 32 /dev/urandom | base64 | tr -d '/+=' | cut -c1-43)"
    fi
    GENERATED_KEY=1
    say "Generated new API key for this agent"
  fi
fi
mkdir -p "$(dirname "$KEY_FILE")"
echo -n "$KEY" > "$KEY_FILE"
chmod 0600 "$KEY_FILE"

# -------- Detect distro & package manager ----------
if [[ -f /etc/os-release ]]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  DISTRO_ID="${ID,,}"
  DISTRO_LIKE="${ID_LIKE:-}"
  DISTRO_MAJOR="${VERSION_ID%%.*}"
  PRETTY="${PRETTY_NAME:-$DISTRO_ID}"
else
  die "Cannot detect distro (/etc/os-release missing)."
fi

if   command -v apt-get >/dev/null 2>&1; then PKG="apt"
elif command -v dnf     >/dev/null 2>&1; then PKG="dnf"
elif command -v yum     >/dev/null 2>&1; then PKG="yum"
elif command -v zypper  >/dev/null 2>&1; then PKG="zypper"
elif command -v pacman  >/dev/null 2>&1; then PKG="pacman"
elif command -v apk     >/dev/null 2>&1; then PKG="apk"
else die "Tidak ada package manager yang dikenali (apt/dnf/yum/zypper/pacman/apk)."
fi

say "Detected: $PRETTY (pkg=$PKG)"
export DEBIAN_FRONTEND=noninteractive

# -------- CPU architecture (x86-64 / ARM Raspberry Pi / Orange Pi) --------
ARCH="$(uname -m)"
case "$ARCH" in armv7l|armv6l|armhf) IS_ARM32=1 ;; *) IS_ARM32=0 ;; esac
say "Architecture: $ARCH (arm32=$IS_ARM32)"

# -------- 1) System packages (lintas distro) ----------
say "Installing system packages via $PKG…"
case "$PKG" in
  apt)
    apt-get update -y
    apt-get install -y --no-install-recommends \
        python3 python3-venv python3-pip python3-dev \
        git curl ca-certificates build-essential libffi-dev libssl-dev
    ;;
  dnf|yum)
    $PKG install -y \
        python3 python3-pip python3-devel \
        git curl ca-certificates gcc gcc-c++ make libffi-devel libopenssl-devel libffi-devel openssl-devel
    ;;
  zypper)
    zypper --non-interactive install \
        python3 python3-pip python3-devel \
        git curl ca-certificates gcc gcc-c++ make
    ;;
  pacman)
    pacman -Sy --noconfirm \
        python python-pip git curl ca-certificates base-devel libffi openssl
    ;;
  apk)
    apk add --no-cache \
        python3 py3-pip python3-dev \
        git curl ca-certificates build-base libffi-dev openssl-dev
    ;;
esac

# -------- 2) Tailscale ----------
if [[ "$SKIP_TS" != "1" ]]; then
  if ! command -v tailscale >/dev/null 2>&1; then
    say "Installing Tailscale…"
    curl -fsSL https://tailscale.com/install.sh | sh
  fi
  if ! tailscale status >/dev/null 2>&1; then
    echo
    warn "Tailscale not authenticated yet."
    echo "Run on this server NOW:    sudo tailscale up"
    echo "Then re-run this installer."
    exit 1
  fi
  TS_IP=$(tailscale ip -4 | head -n1 || echo "")
  info "Tailscale IP: $TS_IP"
fi

# -------- 3) Repository ----------
if [[ -d "$INSTALL_DIR/.git" ]]; then
  say "Updating existing install at $INSTALL_DIR…"
  git -C "$INSTALL_DIR" pull --ff-only
else
  say "Cloning repo to $INSTALL_DIR…"
  rm -rf "$INSTALL_DIR"
  git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
fi

# -------- 4) Python venv ----------
  # ARM 32-bit: watchfiles/uvloop (uvicorn[standard]) need a Rust toolchain.
  if [[ "${IS_ARM32:-0}" == "1" ]] && ! command -v cargo >/dev/null 2>&1; then
    say "ARM 32-bit — installing Rust toolchain for native wheels…"
    case "$PKG" in
      apt)      apt-get install -y cargo rustc ;;
      dnf|yum)  $PKG install -y cargo rust ;;
      zypper)   zypper --non-interactive install cargo rust ;;
      pacman)   pacman -S --noconfirm rust ;;
      apk)      apk add --no-cache cargo rust ;;
    esac
  fi

say "Setting up Python venv…"
cd "$INSTALL_DIR/agent-linux/backend"
if [[ ! -d venv ]]; then
  if ! python3 -m venv venv 2>/dev/null; then
    warn "python3 -m venv gagal — mencoba install paket venv & ulang…"
    case "$PKG" in
      apt)     apt-get install -y python3-venv ;;
      dnf|yum) $PKG install -y python3-virtualenv || true ;;
      *)       pip3 install --quiet virtualenv 2>/dev/null || true ;;
    esac
    python3 -m venv venv 2>/dev/null || python3 -m virtualenv venv || \
      die "Gagal membuat virtual environment Python."
  fi
fi
# shellcheck disable=SC1091
source venv/bin/activate
pip install --quiet --upgrade pip setuptools wheel
pip install --quiet -r requirements.txt
deactivate

info "Python: $(python3 --version)"

# -------- 5) Service (systemd ATAU OpenRC) ----------
BACKEND="$INSTALL_DIR/agent-linux/backend"
GUNICORN="$BACKEND/venv/bin/gunicorn"
GUNICORN_CONF="$BACKEND/gunicorn.conf.py"

if command -v systemctl >/dev/null 2>&1 && [[ -d /run/systemd/system ]]; then
  INIT_SYS="systemd"
  say "Writing systemd unit…"
  cat > /etc/systemd/system/secureops-agent.service <<EOF
[Unit]
Description=SecureOps Agent
After=network.target tailscaled.service
Wants=network-online.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$BACKEND

Environment="PATH=$BACKEND/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="PYTHONUNBUFFERED=1"
Environment="SECUREOPS_AGENT_KEY=$KEY"
Environment="SECUREOPS_BIND=0.0.0.0:$PORT"
Environment="SECUREOPS_WORKERS=2"
Environment="SECUREOPS_SHELL_USER=$SHELL_USER"
Environment="SECUREOPS_SHELL_CMD=$SHELL_CMD"
Environment="SECUREOPS_RECORD_SESSIONS=$RECORD"
Environment="SECUREOPS_RECORD_DIR=$RECORD_DIR_VAR"

ExecStart=$GUNICORN -c $GUNICORN_CONF main:app

Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=secureops-agent

[Install]
WantedBy=multi-user.target
EOF
elif command -v rc-update >/dev/null 2>&1; then
  INIT_SYS="openrc"
  say "Writing OpenRC service (Alpine)…"
  cat > /etc/init.d/secureops-agent <<EOF
#!/sbin/openrc-run
name="secureops-agent"
description="SecureOps Agent"
command="$GUNICORN"
command_args="-c $GUNICORN_CONF main:app"
command_background=true
directory="$BACKEND"
pidfile="/run/secureops-agent.pid"
output_log="/var/log/secureops-agent.log"
error_log="/var/log/secureops-agent.log"
export PATH="$BACKEND/venv/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export PYTHONUNBUFFERED=1
export SECUREOPS_AGENT_KEY="$KEY"
export SECUREOPS_BIND="0.0.0.0:$PORT"
export SECUREOPS_WORKERS=2
export SECUREOPS_SHELL_USER="$SHELL_USER"
export SECUREOPS_SHELL_CMD="$SHELL_CMD"
export SECUREOPS_RECORD_SESSIONS="$RECORD"
export SECUREOPS_RECORD_DIR="$RECORD_DIR_VAR"
depend() { need net; }
EOF
  chmod +x /etc/init.d/secureops-agent
else
  die "Init system tidak dikenali (butuh systemd atau OpenRC)."
fi

# Firewall
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow from 100.64.0.0/10 to any port "$PORT" comment 'SecureOps Agent (Tailscale)' || true
fi

# Recording directory
if [[ "$RECORD" == "1" ]]; then
  mkdir -p "$RECORD_DIR_VAR"
  chmod 0750 "$RECORD_DIR_VAR"
  info "Recordings → $RECORD_DIR_VAR"
fi

if [[ "$INIT_SYS" == "systemd" ]]; then
  systemctl daemon-reload
  systemctl enable secureops-agent
  systemctl restart secureops-agent
else
  rc-update add secureops-agent default 2>/dev/null || true
  rc-service secureops-agent restart 2>/dev/null || rc-service secureops-agent start
fi

# Wait for service to actually be ready (up to 15s)
say "Waiting for agent to become healthy..."
for i in {1..15}; do
  if curl -fsS -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/api/health" 2>/dev/null; then
    info "Agent is healthy after ${i}s"
    break
  fi
  sleep 1
done

say "Agent status:"
if command -v systemctl >/dev/null 2>&1 && [[ -d /run/systemd/system ]]; then
  systemctl --no-pager --lines=3 status secureops-agent || true
else
  rc-service secureops-agent status || true
fi

LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
TS_IP="${TS_IP:-}"
USE_IP="${TS_IP:-$LAN_IP}"
AUTO_REGISTERED=0

# ---------- Kumpulkan SEMUA alamat kandidat ----------
# Controller akan menguji satu per satu & memakai yang reachable (LAN/VPN).
build_candidates_json() {
  local seen=""
  local out=""
  add() {
    local ip="$1"
    [[ -z "$ip" ]] && return
    # Lewati loopback, link-local, docker, VirtualBox host-only
    [[ "$ip" =~ ^(127\.|169\.254\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.|192\.168\.56\.) ]] && return
    local url="http://$ip:$PORT"
    [[ "$seen" == *"|$url|"* ]] && return
    seen="$seen|$url|"
    [[ -n "$out" ]] && out="$out,"
    out="$out\"$url\""
  }
  add "$TS_IP"                                    # Tailscale (prioritas)
  for ip in $(hostname -I 2>/dev/null); do add "$ip"; done   # semua IPv4 lokal
  echo "[$out]"
}
CANDIDATES_JSON="$(build_candidates_json)"

# ---------- Auto-registration to controller (if join token provided) ----------
if [[ -n "${SECUREOPS_JOIN_TOKEN:-}" && -n "${SECUREOPS_CONTROLLER_URL:-}" ]]; then
  say "Auto-registering with controller at $SECUREOPS_CONTROLLER_URL ..."
  info "Kandidat URL: $CANDIDATES_JSON"

  REGISTER_PAYLOAD=$(cat <<EOF
{
  "token":    "$SECUREOPS_JOIN_TOKEN",
  "hostname": "$(hostname)",
  "api_url":  "http://$USE_IP:$PORT",
  "api_key":  "$KEY",
  "candidates": $CANDIDATES_JSON
}
EOF
)

  REGISTER_RESPONSE=$(curl -fsS -X POST \
    -H "Content-Type: application/json" \
    -d "$REGISTER_PAYLOAD" \
    --max-time 10 \
    "$SECUREOPS_CONTROLLER_URL/api/servers/auto-register" 2>&1 || echo "FAILED:$?")

  if [[ "$REGISTER_RESPONSE" == FAILED:* ]]; then
    warn "Auto-registration failed: $REGISTER_RESPONSE"
    warn "You can still register manually in the controller UI using:"
    warn "  API URL: http://$USE_IP:$PORT"
    warn "  API Key: $KEY"
  else
    info "Auto-registration response: $REGISTER_RESPONSE"
    AUTO_REGISTERED=1
  fi
fi

echo
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       ✅ SecureOps Agent Installed Successfully              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "  Distro:       $PRETTY"
echo -e "  Hostname:     $(hostname)"
[[ -n "$SHELL_USER" ]] && echo -e "  Shell user:   ${BLUE}$SHELL_USER${NC} (drop-privileges enabled)"
[[ "$RECORD" == "1" ]] && echo -e "  Recording:    ${BLUE}ON${NC}  ($RECORD_DIR_VAR)"
echo

if [[ "$AUTO_REGISTERED" == "1" ]]; then
  # Zero-touch path — already registered with controller
  echo -e "${GREEN}┌──────────────────────────────────────────────────────────────┐${NC}"
  echo -e "${GREEN}│       🎉 AUTO-REGISTERED WITH CONTROLLER                     │${NC}"
  echo -e "${GREEN}│       No further action needed — agent is online!            │${NC}"
  echo -e "${GREEN}└──────────────────────────────────────────────────────────────┘${NC}"
  echo
  echo -e "  Controller:   ${BLUE}$SECUREOPS_CONTROLLER_URL${NC}"
  echo -e "  Registered as: ${BLUE}${SECUREOPS_SERVER_NAME:-$(hostname)}${NC}"
  echo -e "  API URL:      http://$USE_IP:$PORT"
else
  # Manual path — show info to paste in UI
  echo -e "${YELLOW}┌──────────────────────────────────────────────────────────────┐${NC}"
  echo -e "${YELLOW}│       📋 PASTE THESE TO THE CONTROLLER UI                    │${NC}"
  echo -e "${YELLOW}│       (Sidebar → Servers → Add Server)                       │${NC}"
  echo -e "${YELLOW}└──────────────────────────────────────────────────────────────┘${NC}"
  echo
  echo -e "  ${BLUE}Name${NC}     :  $(hostname)"
  echo -e "  ${BLUE}API URL${NC}  :  ${GREEN}http://$USE_IP:$PORT${NC}"
  echo -e "  ${BLUE}API Key${NC}  :  ${GREEN}$KEY${NC}"
  echo
  if [[ "$GENERATED_KEY" == "1" ]]; then
    echo -e "  ${YELLOW}⚠  This key was auto-generated. Copy it now —${NC}"
    echo -e "  ${YELLOW}    you can also find it later at:  $KEY_FILE${NC}"
  else
    echo -e "  Key reused/provided (see $KEY_FILE)"
  fi
fi
echo
echo -e "  Logs:  ${BLUE}sudo journalctl -u secureops-agent -f${NC}"
echo
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
