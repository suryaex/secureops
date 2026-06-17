#!/usr/bin/env bash
# SecureOps PRODUCTION deploy script (Controller)
#
# Supports: Ubuntu / Debian / Mint / Pop!_OS / Elementary  (apt)
#           Fedora / RHEL / Rocky / Alma / CentOS Stream    (dnf/yum)
#           openSUSE / SLES                                  (zypper)
#           Arch / Manjaro / EndeavourOS                     (pacman)
#
# Usage:
#   bash controller/deploy/deploy-prod.sh                    # uses defaults
#   SERVER_NAME=secureops.site bash controller/deploy/deploy-prod.sh
set -euo pipefail

# -------- Configuration --------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPO_DIR/backend"
FRONTEND_DIR="$REPO_DIR/frontend"

SERVER_NAME="${SERVER_NAME:-_}"
FRONTEND_ROOT="${FRONTEND_ROOT:-/var/www/secureops}"
NGINX_SITE="${NGINX_SITE:-secureops}"
NODE_VERSION="${NODE_VERSION:-20}"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
say()  { echo -e "${GREEN}==> $*${NC}"; }
info() { echo -e "${BLUE}ℹ  $*${NC}"; }
warn() { echo -e "${YELLOW}!! $*${NC}"; }
die()  { echo -e "${RED}ERROR: $*${NC}"; exit 1; }

# -------- Detect distro ----------
detect_distro() {
  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    DISTRO_ID="${ID,,}"
    DISTRO_LIKE="${ID_LIKE:-}"
    DISTRO_VERSION="${VERSION_ID:-unknown}"
    DISTRO_CODENAME="${VERSION_CODENAME:-${UBUNTU_CODENAME:-}}"
    DISTRO_MAJOR="${DISTRO_VERSION%%.*}"
    PRETTY="${PRETTY_NAME:-$DISTRO_ID}"
  else
    die "Cannot detect distro (/etc/os-release missing)."
  fi

  # Tentukan package manager berdasarkan family distro
  if command -v apt-get >/dev/null 2>&1; then   PKG="apt"
  elif command -v dnf  >/dev/null 2>&1;  then   PKG="dnf"
  elif command -v yum  >/dev/null 2>&1;  then   PKG="yum"
  elif command -v zypper >/dev/null 2>&1; then  PKG="zypper"
  elif command -v pacman >/dev/null 2>&1; then  PKG="pacman"
  else die "Tidak ada package manager yang dikenali (apt/dnf/yum/zypper/pacman)."
  fi
}

detect_distro
say "Detected: $PRETTY (id=$DISTRO_ID, pkg=$PKG)"
[[ $EUID -ne 0 ]] && warn "Some steps need sudo — you may be prompted."

export DEBIAN_FRONTEND=noninteractive

# -------- CPU architecture (x86-64 / ARM Raspberry Pi / Orange Pi) --------
ARCH="$(uname -m)"
case "$ARCH" in armv7l|armv6l|armhf) IS_ARM32=1 ;; *) IS_ARM32=0 ;; esac
say "Architecture: $ARCH (arm32=$IS_ARM32)"

# -------- 1) System packages (lintas distro) --------
say "Installing system packages via $PKG…"
case "$PKG" in
  apt)
    sudo apt-get update -y
    sudo apt-get install -y --no-install-recommends \
        python3 python3-venv python3-pip python3-dev \
        libpam0g-dev build-essential libffi-dev libssl-dev \
        libjpeg-dev zlib1g-dev libfreetype6-dev \
        nginx curl gnupg ca-certificates rsync
    ;;
  dnf|yum)
    sudo $PKG install -y \
        python3 python3-pip python3-devel \
        pam-devel gcc gcc-c++ make libffi-devel openssl-devel \
        libjpeg-turbo-devel zlib-devel freetype-devel \
        nginx curl gnupg2 ca-certificates rsync
    ;;
  zypper)
    sudo zypper --non-interactive install \
        python3 python3-pip python3-devel \
        pam-devel gcc gcc-c++ make libffi-devel libopenssl-devel \
        libjpeg8-devel zlib-devel freetype2-devel \
        nginx curl gpg2 ca-certificates rsync
    ;;
  pacman)
    sudo pacman -Sy --noconfirm \
        python python-pip pam base-devel libffi openssl \
        libjpeg-turbo zlib freetype2 \
        nginx curl gnupg ca-certificates rsync
    ;;
esac

# -------- 2) Node.js LTS (lintas distro) --------
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  NODE_MAJ=$(node -v | sed 's/v//' | cut -d. -f1)
  if [[ "$NODE_MAJ" -ge 18 ]]; then
    info "Node $(node -v) already installed"
    NEED_NODE=0
  fi
fi
if [[ "$NEED_NODE" == "1" ]]; then
  say "Installing Node.js $NODE_VERSION LTS…"
  case "$PKG" in
    apt)
      curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
      sudo apt-get install -y nodejs
      ;;
    dnf|yum)
      curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
      sudo $PKG install -y nodejs
      ;;
    zypper)
      sudo zypper --non-interactive install nodejs${NODE_VERSION} npm${NODE_VERSION} || \
        sudo zypper --non-interactive install nodejs npm
      ;;
    pacman)
      sudo pacman -S --noconfirm nodejs npm
      ;;
  esac
fi

info "Node:   $(node --version)"
info "npm:    $(npm --version)"
info "Python: $(python3 --version)"

# -------- 3) Backend venv ----------
# ARM 32-bit: bcrypt 4.x + cryptography have no armv7 wheels — need Rust to build.
if [[ "${IS_ARM32:-0}" == "1" ]] && ! command -v cargo >/dev/null 2>&1; then
  say "ARM 32-bit — installing Rust toolchain (bcrypt/cryptography build)…"
  case "$PKG" in
    apt)      sudo apt-get install -y cargo rustc ;;
    dnf|yum)  sudo $PKG install -y cargo rust ;;
    zypper)   sudo zypper --non-interactive install cargo rust ;;
    pacman)   sudo pacman -S --noconfirm rust ;;
  esac
fi

say "Setting up backend Python venv…"
cd "$BACKEND_DIR"
if [[ ! -d venv ]]; then python3 -m venv venv; fi
# shellcheck disable=SC1091
source venv/bin/activate
pip install --quiet --upgrade pip setuptools wheel
pip install --quiet -r requirements.txt
deactivate

# -------- 4) PWA icons ----------
say "Generating PWA icons…"
"$BACKEND_DIR/venv/bin/python" "$FRONTEND_DIR/scripts/generate-icons.py" || \
    warn "Icon generation skipped (non-fatal)."

# -------- 5) Frontend build ----------
say "Installing frontend deps + building…"
cd "$FRONTEND_DIR"
if [[ -f package-lock.json ]]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi
[[ "$ARCH" == arm* || "$ARCH" == aarch64 ]] && export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=512}"
npm run build

# -------- 6) Publish ----------
say "Publishing dist/ → $FRONTEND_ROOT"
sudo mkdir -p "$FRONTEND_ROOT"
sudo rsync -a --delete "$FRONTEND_DIR/dist/" "$FRONTEND_ROOT/"
sudo chown -R www-data:www-data "$FRONTEND_ROOT" 2>/dev/null || true

# -------- 7) nginx (lintas distro) ----------
say "Writing nginx site config…"
RENDERED_CONF="$(sed -e "s|{{SERVER_NAME}}|$SERVER_NAME|g" -e "s|{{FRONTEND_ROOT}}|$FRONTEND_ROOT|g" "$SCRIPT_DIR/nginx.conf")"

if [[ -d /etc/nginx/sites-available ]]; then
  # Debian/Ubuntu: pakai sites-available + sites-enabled
  echo "$RENDERED_CONF" | sudo tee "/etc/nginx/sites-available/$NGINX_SITE" >/dev/null
  sudo mkdir -p /etc/nginx/sites-enabled
  sudo ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/$NGINX_SITE"
  sudo rm -f /etc/nginx/sites-enabled/default || true
else
  # RHEL/SUSE/Arch: pakai conf.d
  echo "$RENDERED_CONF" | sudo tee "/etc/nginx/conf.d/$NGINX_SITE.conf" >/dev/null
  # Nonaktifkan server default kalau ada
  sudo sed -i 's/^\(\s*listen\s*80.*default_server\)/#\1/' /etc/nginx/nginx.conf 2>/dev/null || true
fi

# Pastikan http {} memuat conf.d / sites-enabled (Arch sering belum)
if ! grep -rq "include.*sites-enabled\|include.*conf.d" /etc/nginx/nginx.conf 2>/dev/null; then
  sudo sed -i '/http\s*{/a\    include /etc/nginx/conf.d/*.conf;' /etc/nginx/nginx.conf 2>/dev/null || true
fi

# -------- 7b) Free port 80/443 (Fedora/RHEL sering jalan httpd/Apache) --------
free_web_ports() {
  # Service web lain yang biasa merebut :80 — matikan supaya nginx bisa bind.
  local conflicts="httpd apache2 caddy lighttpd"
  for svc in $conflicts; do
    if systemctl is-active --quiet "$svc" 2>/dev/null; then
      warn "Service '$svc' memakai port 80 — menonaktifkannya untuk nginx…"
      sudo systemctl disable --now "$svc" 2>/dev/null || true
    fi
  done

  # Cek apa yang masih memegang :80 (selain nginx).
  local holder=""
  if command -v ss >/dev/null 2>&1; then
    holder="$(sudo ss -ltnp 'sport = :80' 2>/dev/null | grep -v nginx | grep -oP 'users:\(\("\K[^"]+' | head -n1 || true)"
  elif command -v lsof >/dev/null 2>&1; then
    holder="$(sudo lsof -iTCP:80 -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
  fi
  if [[ -n "$holder" ]]; then
    warn "Port 80 masih dipakai proses '$holder'. Menghentikan paksa…"
    sudo systemctl stop "$holder" 2>/dev/null || sudo pkill -x "$holder" 2>/dev/null || true
    sleep 1
  fi
}
free_web_ports

# SELinux (Fedora/RHEL): izinkan nginx connect ke backend uvicorn (port 8000).
if command -v setsebool >/dev/null 2>&1; then
  sudo setsebool -P httpd_can_network_connect 1 2>/dev/null || true
fi

# firewalld (Fedora/RHEL): buka 80/443 kalau aktif.
if command -v firewall-cmd >/dev/null 2>&1 && sudo firewall-cmd --state >/dev/null 2>&1; then
  sudo firewall-cmd --permanent --add-service=http  2>/dev/null || true
  sudo firewall-cmd --permanent --add-service=https 2>/dev/null || true
  sudo firewall-cmd --reload 2>/dev/null || true
fi

say "Testing nginx config…"
sudo nginx -t
sudo systemctl enable nginx 2>/dev/null || true
# Stop dulu supaya tidak ada master nginx lama yang masih bind :80, lalu start bersih.
sudo systemctl restart nginx || {
  warn "nginx gagal start — menampilkan diagnosa port 80:"
  sudo ss -ltnp 'sport = :80' 2>/dev/null || sudo lsof -iTCP:80 -sTCP:LISTEN 2>/dev/null || true
  die "nginx tidak bisa bind ke port 80. Lihat diagnosa di atas."
}

# -------- 8) systemd backend ----------
say "Installing systemd unit…"
sed "s|{{BACKEND_DIR}}|$BACKEND_DIR|g" \
    "$SCRIPT_DIR/secureops-backend.service" \
  | sudo tee /etc/systemd/system/secureops-backend.service >/dev/null

sudo systemctl daemon-reload
sudo systemctl enable secureops-backend
sudo systemctl restart secureops-backend

# Cleanup legacy
sudo systemctl disable --now secureops-frontend 2>/dev/null || true
sudo rm -f /etc/systemd/system/secureops-frontend.service || true
sudo systemctl daemon-reload

# -------- 9) Status ----------
sleep 2
say "Status:"
sudo systemctl --no-pager --lines=3 status secureops-backend || true
sudo systemctl --no-pager --lines=0 status nginx || true

IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}  ✅ Production deploy complete${NC}"
echo
echo "  Distro:    $PRETTY"
echo "  Web:       http://$IP/"
[[ "$SERVER_NAME" != "_" ]] && echo "  Domain:    http://$SERVER_NAME/"
echo "  Backend:   http://$IP/api/health"
echo "  API docs:  http://$IP/docs"
echo
echo "  Login with your real Linux account."
echo
echo "  Next steps — HTTPS via Let's Encrypt:"
if [[ "$DISTRO_ID" == "ubuntu" && "$DISTRO_MAJOR" -ge 24 ]] \
   || [[ "$DISTRO_ID" == "debian" && "$DISTRO_MAJOR" -ge 13 ]]; then
  echo "      sudo snap install --classic certbot"
  echo "      sudo ln -sf /snap/bin/certbot /usr/bin/certbot"
  echo "      sudo certbot --nginx -d $SERVER_NAME"
else
  echo "      sudo apt install -y certbot python3-certbot-nginx"
  echo "      sudo certbot --nginx -d $SERVER_NAME"
fi
echo
echo "  Logs:      sudo journalctl -u secureops-backend -f"
echo "  Docs:      see README.md (instalasi, Docker, LogSync, keamanan)"
echo -e "${GREEN}=====================================================${NC}"
