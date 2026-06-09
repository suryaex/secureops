#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# SecureOps — uninstaller (controller AND/OR Linux agent)
#
# Auto-detects what is installed on this host and removes it cleanly. Use this
# before a major update or to switch to a different version.
#
# Usage:
#   sudo bash uninstall.sh              # remove services/files, KEEP database
#   sudo bash uninstall.sh --purge      # ALSO delete database, configs, user, logs
#   sudo bash uninstall.sh --yes        # no confirmation prompt
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
say()  { echo -e "${GREEN}==> $*${NC}"; }
warn() { echo -e "${YELLOW}!! $*${NC}"; }

PURGE=0; ASSUME_YES=0
for a in "$@"; do case "$a" in
  --purge) PURGE=1 ;;
  --yes|-y) ASSUME_YES=1 ;;
esac; done

[[ $EUID -ne 0 ]] && warn "Not root — some steps may prompt for sudo."

if [[ "$ASSUME_YES" != "1" ]]; then
  echo "This will stop and remove SecureOps from this machine."
  [[ "$PURGE" == "1" ]] && echo -e "${RED}--purge: database, configs, logs and the 'secureops' user will be DELETED.${NC}"
  read -r -p "Type 'yes' to continue: " c; [[ "$c" == "yes" ]] || { echo "Aborted."; exit 0; }
fi

stop_disable() {  # $1 = service name (systemd or OpenRC)
  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl stop "$1" 2>/dev/null || true
    sudo systemctl disable "$1" 2>/dev/null || true
  fi
  if command -v rc-service >/dev/null 2>&1; then
    sudo rc-service "$1" stop 2>/dev/null || true
    sudo rc-update del "$1" default 2>/dev/null || true
  fi
}

# ───────────────── Controller ─────────────────
if [[ -f /etc/systemd/system/secureops-backend.service ]] \
   || [[ -d /var/www/secureops ]] \
   || [[ -e /etc/nginx/sites-available/secureops ]] \
   || [[ -e /etc/nginx/conf.d/secureops.conf ]]; then
  say "Removing CONTROLLER…"
  stop_disable secureops-backend
  stop_disable secureops-cloudflared
  sudo rm -f /etc/systemd/system/secureops-backend.service
  sudo rm -f /etc/systemd/system/secureops-cloudflared.service
  command -v systemctl >/dev/null 2>&1 && sudo systemctl daemon-reload 2>/dev/null || true

  # nginx site (both layouts)
  sudo rm -f /etc/nginx/sites-enabled/secureops /etc/nginx/sites-available/secureops
  sudo rm -f /etc/nginx/conf.d/secureops.conf
  if command -v nginx >/dev/null 2>&1; then
    sudo nginx -t 2>/dev/null && (sudo systemctl reload nginx 2>/dev/null || sudo rc-service nginx reload 2>/dev/null) || true
  fi

  sudo rm -rf /var/www/secureops

  if [[ "$PURGE" == "1" ]]; then
    warn "Purging controller repo + database…"
    # remove cloudflared config if present
    sudo rm -rf /etc/cloudflared 2>/dev/null || true
    # NOTE: the git repo (this folder) holds backend/secureops.db.
    REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    warn "Repo dir: $REPO_DIR — delete it manually to remove the database:"
    echo "    rm -rf \"$REPO_DIR\""
  else
    say "Database kept inside the repo (backend/secureops.db). Use --purge to delete."
  fi
fi

# ───────────────── Linux agent ─────────────────
if [[ -e /etc/systemd/system/secureops-agent.service ]] \
   || [[ -e /etc/init.d/secureops-agent ]] \
   || [[ -d /opt/secureops-agent ]]; then
  say "Removing LINUX AGENT…"
  stop_disable secureops-agent
  sudo rm -f /etc/systemd/system/secureops-agent.service
  sudo rm -f /etc/init.d/secureops-agent
  command -v systemctl >/dev/null 2>&1 && sudo systemctl daemon-reload 2>/dev/null || true
  sudo rm -rf /opt/secureops-agent

  if [[ "$PURGE" == "1" ]]; then
    warn "Purging agent configs, logs and user…"
    sudo rm -rf /etc/secureops-agent /var/log/secureops* 2>/dev/null || true
    sudo userdel -r secureops 2>/dev/null || true
  fi
fi

say "SecureOps uninstall complete."
[[ "$PURGE" != "1" ]] && echo "  (re-run with --purge to also delete data, configs and the service user)"
