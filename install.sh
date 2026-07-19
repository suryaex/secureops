#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# SecureOps Controller — one-shot Docker installer (mirrors StorageHub's setup)
# Auto-installs Docker (resilient on Fedora/WSL), generates .env with secrets,
# detects LAN/Tailscale/public address, builds + starts the stack, waits health.
#
# Usage:
#   ./install.sh              # install Docker if needed, build + start
#   ./install.sh --prod       # also apply docker-compose.prod.yml (restart=always, logs)
#   ./install.sh --rebuild    # force rebuild images
#   ./install.sh --down       # stop the stack
#   ./install.sh --reset      # stop and DELETE all data (volumes)
#   ./install.sh --tailscale  # install + join Tailscale, use its VPN IP
#   ./install.sh --public     # auto-detect public IP and add it to CORS
#   ./install.sh --no-updater # skip the in-app "Update & restart" host watcher
#   ./install.sh --reset --yes # skip confirmation prompt (for scripts/CI)
# Env: SECUREOPS_HTTP_PORT (default 80), PUBLIC_HOST=<domain>, PUBLIC_IP=<ip>,
#      SECUREOPS_STATE_DIR (default /var/lib/secureops; update trigger/status)
#
# Docker install falls back to the distro engine if get.docker.com mirrors fail
# (Fedora moby-engine / Debian docker.io). For native + Linux PAM login instead,
# use controller/deploy/deploy-prod.sh.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}▸${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}!${NC} $*"; }
err()   { echo -e "${RED}✗${NC} $*" >&2; }

ACTION="up"; PROD=0; TAILSCALE=0; PUBLIC_DETECT=0; UPDATER=1; ASSUME_YES=0
for a in "$@"; do case "$a" in
  --down) ACTION="down" ;; --reset) ACTION="reset" ;;
  --rebuild) ACTION="rebuild" ;; --no-build) ACTION="nobuild" ;;
  --prod) PROD=1 ;; --tailscale) TAILSCALE=1 ;; --public) PUBLIC_DETECT=1 ;;
  --no-updater) UPDATER=0 ;; --yes|-y) ASSUME_YES=1 ;;
esac; done

STATE_DIR="${SECUREOPS_STATE_DIR:-/var/lib/secureops}"

HTTP_PORT="${SECUREOPS_HTTP_PORT:-80}"
DOCKER_SUDO=""; COMPOSE=""

is_wsl() { grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null; }
pkgmgr() {
  if   command -v dnf     >/dev/null 2>&1; then echo dnf
  elif command -v apt-get >/dev/null 2>&1; then echo apt
  elif command -v zypper  >/dev/null 2>&1; then echo zypper
  elif command -v pacman  >/dev/null 2>&1; then echo pacman
  elif command -v yum     >/dev/null 2>&1; then echo yum
  else echo ""; fi
}
start_docker_daemon() {
  sudo systemctl enable --now docker >/dev/null 2>&1 && return 0
  sudo service docker start >/dev/null 2>&1 && return 0
  if command -v dockerd >/dev/null 2>&1 && ! pgrep -x dockerd >/dev/null 2>&1; then
    info "Starting dockerd in background (no systemd)…"
    sudo sh -c 'nohup dockerd >/tmp/dockerd.log 2>&1 &'; sleep 4
  fi
  return 0
}
install_docker() {
  local pm; pm="$(pkgmgr)"
  info "Installing Docker via get.docker.com…"
  if curl -fsSL https://get.docker.com | sudo sh >/dev/null 2>&1 && command -v docker >/dev/null 2>&1; then return 0; fi
  warn "get.docker.com failed — falling back to distro packages…"
  case "$pm" in
    dnf|yum)
      sudo "$pm" install -y --setopt=retries=10 --skip-broken moby-engine 2>/dev/null \
        || sudo "$pm" install -y --setopt=retries=10 --skip-broken docker 2>/dev/null || true
      sudo "$pm" install -y --skip-broken docker-compose 2>/dev/null \
        || sudo "$pm" install -y --skip-broken moby-compose 2>/dev/null || true ;;
    apt)
      sudo apt-get update -y || true
      sudo apt-get install -y docker.io 2>/dev/null || true
      sudo apt-get install -y docker-compose-v2 2>/dev/null || sudo apt-get install -y docker-compose 2>/dev/null || true ;;
    zypper) sudo zypper --non-interactive install docker docker-compose 2>/dev/null || true ;;
    pacman) sudo pacman -Sy --noconfirm docker docker-compose 2>/dev/null || true ;;
  esac
  command -v docker >/dev/null 2>&1 && return 0
  case "$pm" in dnf|yum) sudo "$pm" install -y podman podman-docker 2>/dev/null || true ;; esac
  command -v docker >/dev/null 2>&1
}
ensure_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    if [ "$(uname -s)" != "Linux" ]; then
      err "Docker is not installed. Install Docker Desktop: https://docs.docker.com/get-docker/"; exit 1
    fi
    if is_wsl; then
      warn "WSL detected — smoothest path is Docker Desktop with WSL integration."
      warn "Trying to install a Docker engine inside WSL as a fallback…"
    fi
    if ! install_docker; then
      err "Could not install Docker automatically. Choose one:"
      err "  1) Install Docker Desktop + enable WSL integration, then re-run ./install.sh"
      err "  2) Native (with PAM login):  sudo bash controller/deploy/deploy-prod.sh"
      exit 1
    fi
    sudo usermod -aG docker "$(id -un)" 2>/dev/null || true
  fi
  start_docker_daemon
  if docker info >/dev/null 2>&1; then DOCKER_SUDO="";
  elif sudo docker info >/dev/null 2>&1; then DOCKER_SUDO="sudo";
  else
    start_docker_daemon
    if docker info >/dev/null 2>&1; then DOCKER_SUDO="";
    elif sudo docker info >/dev/null 2>&1; then DOCKER_SUDO="sudo";
    else err "Docker daemon not available (in WSL enable systemd or use Docker Desktop)."; exit 1; fi
  fi
}
detect_compose() {
  if $DOCKER_SUDO docker compose version >/dev/null 2>&1; then COMPOSE="$DOCKER_SUDO docker compose"; return 0; fi
  if command -v docker-compose >/dev/null 2>&1; then COMPOSE="$DOCKER_SUDO docker-compose"; return 0; fi
  warn "Docker Compose not found — attempting install…"
  case "$(pkgmgr)" in
    apt)     sudo apt-get install -y docker-compose-plugin 2>/dev/null || sudo apt-get install -y docker-compose 2>/dev/null || true ;;
    dnf|yum) sudo "$(pkgmgr)" install -y --skip-broken docker-compose moby-compose 2>/dev/null || true ;;
    zypper)  sudo zypper --non-interactive install docker-compose 2>/dev/null || true ;;
    pacman)  sudo pacman -Sy --noconfirm docker-compose 2>/dev/null || true ;;
  esac
  if $DOCKER_SUDO docker compose version >/dev/null 2>&1; then COMPOSE="$DOCKER_SUDO docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then COMPOSE="$DOCKER_SUDO docker-compose"
  else err "Could not get Docker Compose. Install it (or use deploy-prod.sh) and retry."; exit 1; fi
}

# Install the host-side update watcher so the dashboard's "Update & restart"
# button actually runs: it writes a trigger into $STATE_DIR (bind-mounted into
# the backend container), and this systemd service runs self-update.sh --watch
# on the host (where git + docker live) to pull + rebuild + restart the stack.
setup_updater_watcher() {
  [ "$UPDATER" = "1" ] || { info "Skipping update watcher (--no-updater)"; return 0; }
  local repo_dir unit src; repo_dir="$(pwd)"
  sudo mkdir -p "$STATE_DIR" 2>/dev/null || mkdir -p "$STATE_DIR" 2>/dev/null || true

  if ! command -v systemctl >/dev/null 2>&1; then
    warn "systemd not found — in-app 'Update & restart' needs a watcher."
    warn "Run it yourself on the host:  bash ${repo_dir}/scripts/self-update.sh --watch"
    return 0
  fi
  src="${repo_dir}/scripts/secureops-updater.service"
  [ -f "$src" ] || { warn "Updater unit template missing (${src}) — skipping."; return 0; }

  unit="/etc/systemd/system/secureops-updater.service"
  info "Installing update watcher service (secureops-updater)…"
  if sed "s|__REPO_DIR__|${repo_dir}|g" "$src" | sudo tee "$unit" >/dev/null 2>&1; then
    sudo systemctl daemon-reload >/dev/null 2>&1 || true
    if sudo systemctl enable --now secureops-updater.service >/dev/null 2>&1; then
      ok "Update watcher active — the dashboard can pull + rebuild + restart."
    else
      warn "Could not enable secureops-updater.service. Start it manually:"
      warn "  sudo systemctl enable --now secureops-updater.service"
    fi
  else
    warn "Could not write ${unit} (need sudo). In-app updates will queue but not run."
    warn "Run on host instead:  bash ${repo_dir}/scripts/self-update.sh --watch"
  fi
}

rand() { if command -v openssl >/dev/null 2>&1; then openssl rand -hex "${1:-24}"; else head -c "${1:-24}" /dev/urandom | od -An -tx1 | tr -d ' \n'; fi; }
lan_ip() {
  local ip=""
  command -v ip >/dev/null 2>&1 && ip="$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}')"
  [ -z "$ip" ] && command -v hostname >/dev/null 2>&1 && ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  echo "${ip:-127.0.0.1}"
}
ts_ip()  { command -v tailscale >/dev/null 2>&1 && tailscale ip -4 2>/dev/null | head -n1 || true; }
pub_ip() { curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || curl -fsS --max-time 5 https://ifconfig.me 2>/dev/null || true; }
sed_i()  { if sed --version >/dev/null 2>&1; then sed -i "$1" .env; else sed -i '' "$1" .env; fi; }
build_origins() {
  local p="" out h; [ "$HTTP_PORT" != "80" ] && p=":${HTTP_PORT}"
  out="http://localhost${p}"
  for h in "$IP" "$TSIP" "$PUBIP"; do [ -n "$h" ] && out="${out},http://${h}${p}"; done
  [ -n "$PUBLIC_HOST" ] && out="${out},http://${PUBLIC_HOST}${p},https://${PUBLIC_HOST},capacitor://localhost"
  echo "$out"
}

CF="-f docker-compose.yml"
[ "$PROD" = "1" ] && [ -f docker-compose.prod.yml ] && CF="$CF -f docker-compose.prod.yml"

if [ "$ACTION" = "down" ];  then ensure_docker; detect_compose; info "Stopping…"; $COMPOSE $CF down; ok "Stopped."; exit 0; fi
if [ "$ACTION" = "reset" ]; then ensure_docker; detect_compose; warn "This deletes ALL data (database volume)!"
  if [ "$ASSUME_YES" != "1" ]; then
    read -r -p "Type 'yes' to continue: " c; [ "$c" != "yes" ] && { echo "Aborted."; exit 0; }
  fi
  $COMPOSE $CF down -v && ok "Reset done."; exit 0; fi

echo ""
echo "  ╭──────────────────────────────────────────────╮"
echo "  │  SecureOps Controller · Docker (lightweight)  │"
echo "  ╰──────────────────────────────────────────────╯"
echo ""

ensure_docker; detect_compose; ok "Docker ready  ($COMPOSE)"
[ "$PROD" = "1" ] && ok "Production overlay enabled (docker-compose.prod.yml)"

IP="$(lan_ip)"; ok "Detected LAN address: ${IP}"
if [ "$TAILSCALE" = "1" ] && ! command -v tailscale >/dev/null 2>&1; then
  info "Installing Tailscale…"; curl -fsSL https://tailscale.com/install.sh | sh || warn "Tailscale install failed"
  command -v tailscale >/dev/null 2>&1 && { sudo tailscale up 2>/dev/null || warn "Run 'sudo tailscale up' then re-run --tailscale"; }
fi
TSIP="$(ts_ip)"; [ -n "$TSIP" ] && ok "Tailscale IP: ${TSIP}"
PUBIP=""; [ "$PUBLIC_DETECT" = "1" ] && { PUBIP="$(pub_ip)"; [ -n "$PUBIP" ] && ok "Public IP: ${PUBIP}"; }
[ -n "${PUBLIC_IP:-}" ] && PUBIP="$PUBLIC_IP"
PUBLIC_HOST="${PUBLIC_HOST:-}"

# ── .env (generate secrets once, then keep them) ──
if [ -f .env ]; then
  ok ".env exists — keeping secrets, refreshing port/CORS"
else
  info "Creating .env with generated secrets…"
  cp .env.example .env
  sed_i "s|^SECUREOPS_JWT_SECRET=.*|SECUREOPS_JWT_SECRET=$(rand 48)|"
  sed_i "s|^SECUREOPS_ADMIN_PASSWORD=.*|SECUREOPS_ADMIN_PASSWORD=$(rand 12)|"
  ok ".env created (JWT secret + admin password generated)"
fi
sed_i "s|^SECUREOPS_HTTP_PORT=.*|SECUREOPS_HTTP_PORT=${HTTP_PORT}|"
sed_i "s|^SECUREOPS_CORS_ORIGINS=.*|SECUREOPS_CORS_ORIGINS=$(build_origins)|"
ADMIN_PW="$(grep '^SECUREOPS_ADMIN_PASSWORD=' .env | cut -d= -f2-)"
ok "Reachable via: localhost / LAN ${IP}${TSIP:+ / Tailscale ${TSIP}}${PUBIP:+ / public ${PUBIP}}"

case "$ACTION" in
  rebuild) $COMPOSE $CF build --no-cache; BUILD="--build" ;;
  nobuild) BUILD="" ;;
  *)       BUILD="--build" ;;
esac
info "Building & starting containers (nginx on port ${HTTP_PORT})…"
$COMPOSE $CF up -d $BUILD

info "Waiting for backend to become healthy…"
HEALTHY=0
for _ in $(seq 1 40); do
  if curl -fsS "http://localhost:${HTTP_PORT}/api/health" >/dev/null 2>&1; then ok "Backend is healthy"; HEALTHY=1; break; fi
  sleep 3; printf "."
done
echo ""
[ "$HEALTHY" = "1" ] || warn "Backend not healthy yet — check logs: $COMPOSE logs -f backend"

# Enable in-app "Update & restart" (download + reinstall everything from the UI).
setup_updater_watcher

PSFX=""; [ "$HTTP_PORT" != "80" ] && PSFX=":${HTTP_PORT}"
echo ""
ok "SecureOps Controller is up!"
echo ""
echo -e "  ${GREEN}On this machine${NC}    →  http://localhost${PSFX}"
echo -e "  ${GREEN}On the network${NC}     →  http://${IP}${PSFX}"
[ -n "$TSIP" ]  && echo -e "  ${GREEN}Over Tailscale${NC}     →  http://${TSIP}${PSFX}"
[ -n "$PUBIP" ] && echo -e "  ${GREEN}Public IP${NC}          →  http://${PUBIP}${PSFX}   (open the port in your firewall)"
echo ""
echo "  Login (Docker has no host PAM):  user 'admin'  /  password: ${ADMIN_PW:-<in .env>}"
echo "  Native install with PAM login:   sudo bash controller/deploy/deploy-prod.sh"
echo "  Logs: $COMPOSE logs -f   |   Stop: ./install.sh --down"
echo ""
