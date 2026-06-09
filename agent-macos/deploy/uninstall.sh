#!/usr/bin/env bash
# SecureOps macOS Agent — uninstaller
#   sudo bash uninstall.sh            # remove agent, keep data
#   sudo bash uninstall.sh --purge    # also delete data + service account
set -uo pipefail

PURGE=0; [[ "${1:-}" == "--purge" ]] && PURGE=1
PLIST="/Library/LaunchDaemons/com.polsri.secureops-agent.plist"
INSTALL_DIR="/opt/secureops-agent"

echo "==> Removing SecureOps macOS agent…"
sudo launchctl bootout system "$PLIST" 2>/dev/null || sudo launchctl unload "$PLIST" 2>/dev/null || true
sudo rm -f "$PLIST"
sudo rm -rf "$INSTALL_DIR"

if [[ "$PURGE" == "1" ]]; then
  echo "   Purging config, logs and service account…"
  sudo rm -rf /etc/secureops-agent /Library/Logs/SecureOps* 2>/dev/null || true
  sudo dscl . -delete /Users/_secureops 2>/dev/null || true
else
  echo "   Config/logs kept. Re-run with --purge to delete them."
fi

echo "==> SecureOps macOS agent removed."
