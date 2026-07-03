#!/usr/bin/env bash
#
# SecureOps self-update — the single, auditable script the in-app updater runs.
# Pulls the latest released tag (or branch) and reinstalls the stack, for BOTH
# deployment styles:
#   • docker     — docker compose build + up (the lightweight install.sh stack)
#   • baremetal  — refresh venv + rebuild frontend + restart systemd/nginx
#                  (the native controller/deploy/deploy-prod.sh install)
# The mode is auto-detected (baremetal when the secureops-backend systemd unit
# exists, else docker) or forced via SECUREOPS_DEPLOY_MODE.
# POST /api/update/apply only triggers *this* file; nothing else is executed.
#
#   scripts/self-update.sh --check     # print current vs latest, exit
#   scripts/self-update.sh --apply     # pull + rebuild + restart (default)
#   scripts/self-update.sh --watch     # poll the trigger file, then --apply
#
# Env:
#   SECUREOPS_GITHUB_REPO    default suryaex/secureops
#   SECUREOPS_UPDATE_BRANCH  default main
#   SECUREOPS_UPDATE_TRIGGER default /var/lib/secureops/update.request
#   SECUREOPS_UPDATE_STATUS  default /var/lib/secureops/update.status
#   SECUREOPS_DEPLOY_MODE    auto | docker | baremetal   (default auto)
#   SECUREOPS_FRONTEND_ROOT  default /var/www/secureops  (baremetal SPA root)
#
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GITHUB_REPO="${SECUREOPS_GITHUB_REPO:-suryaex/secureops}"
UPDATE_BRANCH="${SECUREOPS_UPDATE_BRANCH:-main}"
TRIGGER="${SECUREOPS_UPDATE_TRIGGER:-/var/lib/secureops/update.request}"
STATUS_FILE="${SECUREOPS_UPDATE_STATUS:-/var/lib/secureops/update.status}"

# Deployment mode: "docker" (compose stack) or "baremetal" (native venv + systemd
# + nginx, per controller/deploy/deploy-prod.sh). "auto" picks baremetal when the
# secureops-backend systemd unit is present, otherwise docker.
DEPLOY_MODE="${SECUREOPS_DEPLOY_MODE:-auto}"
FRONTEND_ROOT="${SECUREOPS_FRONTEND_ROOT:-/var/www/secureops}"

# Run privileged steps directly when already root (the watcher service runs as
# root); otherwise fall back to sudo for interactive/manual runs.
SUDO=""; [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1 && SUDO="sudo"

log()    { printf '[self-update] %s\n' "$*" >&2; }

# Make sure the state dir (trigger + status files) exists and is writable by
# the invoking user. Manual runs happen as a regular user while the dir lives
# under /var/lib, so escalate once here instead of failing on every write.
ensure_state_dir() {
  local dir; dir="$(dirname "$STATUS_FILE")"
  [ -d "$dir" ] || mkdir -p "$dir" 2>/dev/null || $SUDO mkdir -p "$dir" || return 1
  if [ ! -w "$dir" ]; then
    $SUDO chgrp "$(id -gn)" "$dir" 2>/dev/null || true
    $SUDO chmod g+rwx "$dir" 2>/dev/null || true
    [ -w "$dir" ] || $SUDO chown "$(id -un)" "$dir" 2>/dev/null || true
  fi
  # Pre-existing root-owned status file blocks the redirect even when the dir
  # itself is writable — hand it to the invoking user.
  if [ -e "$STATUS_FILE" ] && [ ! -w "$STATUS_FILE" ]; then
    $SUDO chown "$(id -un)" "$STATUS_FILE" 2>/dev/null || true
  fi
  [ -w "$dir" ]
}

status() {
  local line
  line="$(printf '{"state":"%s","message":"%s","at":%s}' "$1" "${2:-}" "$(date +%s)")"
  if ensure_state_dir 2>/dev/null && { [ ! -e "$STATUS_FILE" ] || [ -w "$STATUS_FILE" ]; }; then
    printf '%s\n' "$line" > "$STATUS_FILE"
  elif [ -n "$SUDO" ]; then
    printf '%s\n' "$line" | $SUDO tee "$STATUS_FILE" >/dev/null 2>&1 || true
  fi
}

compose() {
  if docker compose version >/dev/null 2>&1; then docker compose "$@";
  elif command -v docker-compose >/dev/null 2>&1; then docker-compose "$@";
  else log "Docker Compose not found"; return 127; fi
}

# Build the full `-f base [-f prod]` chain. The prod overlay only *adds* to the
# base file (restart policy, log rotation) — it has no service/image/build
# definitions of its own, so it must never be used alone. Always include the
# base; layer prod on top when present (opt out with SECUREOPS_UPDATE_PROD=0).
compose_files() {
  [ -f "$REPO_DIR/docker-compose.yml" ] || return 1
  local args="-f docker-compose.yml"
  if [ -f "$REPO_DIR/docker-compose.prod.yml" ] && [ "${SECUREOPS_UPDATE_PROD:-1}" = "1" ]; then
    args="$args -f docker-compose.prod.yml"
  fi
  echo "$args"
}

latest_tag() {
  curl -fsSL -H 'Accept: application/vnd.github+json' \
    "https://api.github.com/repos/${GITHUB_REPO}/releases/latest" 2>/dev/null \
    | sed -n 's/.*"tag_name":[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1
}

do_check() {
  local current latest
  current="$(git -C "$REPO_DIR" describe --tags --abbrev=0 2>/dev/null || echo unknown)"
  latest="$(latest_tag 2>/dev/null || true)"
  printf 'current=%s latest=%s\n' "$current" "${latest:-<unreachable>}"
}

detect_mode() {
  case "$DEPLOY_MODE" in
    docker)            echo docker;    return 0 ;;
    baremetal|native)  echo baremetal; return 0 ;;
  esac
  # auto: a native install leaves this systemd unit (deploy-prod.sh); Docker does not.
  if [ -f /etc/systemd/system/secureops-backend.service ]; then echo baremetal; return 0; fi
  if [ -f "$REPO_DIR/docker-compose.yml" ]; then echo docker; return 0; fi
  echo unknown
}

# Pull latest source (shared by both modes). Echoes the resolved tag/branch.
fetch_source() {
  cd "$REPO_DIR"
  # The watcher runs as root while the repo is owned by the deploy user; tell git
  # this checkout is trusted so fetch/checkout don't bail on "dubious ownership".
  git config --global --add safe.directory "$REPO_DIR" 2>/dev/null || true

  status "updating" "Fetching latest source"
  # --force: release tags may be re-pointed upstream (history hygiene); a plain
  # fetch rejects those with "would clobber existing tag" and aborts the update.
  if ! git fetch --tags --force --prune origin; then
    status "error" "git fetch failed — check network / credentials"; return 1
  fi
  local tag
  tag="$(latest_tag 2>/dev/null || true)"
  if [ -n "${tag:-}" ] && git rev-parse "refs/tags/${tag}" >/dev/null 2>&1; then
    log "Checking out release ${tag}"
    git checkout -q "tags/${tag}"
    echo "$tag"
  else
    log "No release tag reachable; fast-forwarding ${UPDATE_BRANCH}"
    git checkout -q "${UPDATE_BRANCH}" >&2
    git merge --ff-only "origin/${UPDATE_BRANCH}" >&2
    echo "$UPDATE_BRANCH"
  fi
}

apply_docker() {
  local cfs
  cfs="$(compose_files)" || { status "error" "No compose file found"; return 1; }
  log "Rebuilding images via ${cfs}…"
  status "rebuilding" "Building updated images"
  # Explicit failure checks: callers invoke this function behind `||`, which
  # suspends errexit inside it — without these, a failed build would fall
  # through and the stale stack would be restarted as if the update succeeded.
  # shellcheck disable=SC2086 — $cfs is a deliberate, controlled flag list.
  compose $cfs build || { status "error" "Image build failed"; return 1; }
  log "Restarting stack…"
  status "restarting" "Recreating containers"
  # shellcheck disable=SC2086
  compose $cfs up -d || { status "error" "Container restart failed"; return 1; }
}

# Native (bare-metal) reinstall: refresh backend venv, rebuild the frontend SPA,
# republish it, then restart the systemd backend + nginx. Mirrors the relevant
# steps of controller/deploy/deploy-prod.sh.
apply_baremetal() {
  local backend_dir="$REPO_DIR/controller/backend"
  local frontend_dir="$REPO_DIR/controller/frontend"

  if ! command -v python3 >/dev/null 2>&1; then status "error" "python3 not found"; return 1; fi
  if ! command -v npm     >/dev/null 2>&1; then status "error" "npm not found (Node.js required)"; return 1; fi

  status "rebuilding" "Updating backend dependencies"
  log "Refreshing backend venv…"
  if [ ! -x "$backend_dir/venv/bin/pip" ]; then
    log "No venv found — creating $backend_dir/venv"
    python3 -m venv "$backend_dir/venv"
  fi
  "$backend_dir/venv/bin/pip" install --quiet --upgrade pip >/dev/null 2>&1 || true
  "$backend_dir/venv/bin/pip" install --quiet -r "$backend_dir/requirements.txt" \
    || { status "error" "Backend dependency install failed"; return 1; }

  status "rebuilding" "Rebuilding frontend"
  log "Building frontend SPA…"
  # Callers run this function behind `||`, which suspends errexit inside it —
  # each step needs an explicit check or a failed build would still publish
  # the stale dist and report the update as complete.
  (
    set -e
    cd "$frontend_dir"
    if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi
    case "$(uname -m)" in arm*|aarch64) export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=512}";; esac
    npm run build
  ) || { status "error" "Frontend build failed — see logs"; return 1; }
  [ -f "$frontend_dir/dist/index.html" ] \
    || { status "error" "Frontend build produced no dist/"; return 1; }
  log "Publishing dist → ${FRONTEND_ROOT}"
  $SUDO mkdir -p "$FRONTEND_ROOT"
  $SUDO rsync -a --delete "$frontend_dir/dist/" "$FRONTEND_ROOT/"
  $SUDO chown -R www-data:www-data "$FRONTEND_ROOT" 2>/dev/null || true

  status "restarting" "Restarting services"
  log "Restarting secureops-backend + nginx…"
  $SUDO systemctl restart secureops-backend \
    || { status "error" "secureops-backend failed to restart"; return 1; }
  $SUDO systemctl reload nginx 2>/dev/null || $SUDO systemctl restart nginx 2>/dev/null || true
}

do_apply() {
  local tag mode
  tag="$(fetch_source)" || return 1
  mode="$(detect_mode)"
  log "Deployment mode: ${mode}"
  case "$mode" in
    docker)    apply_docker    || { status "error" "Docker rebuild failed — see logs"; return 1; } ;;
    baremetal) apply_baremetal || { status "error" "Native rebuild failed — see logs"; return 1; } ;;
    *) status "error" "Could not determine deployment mode (set SECUREOPS_DEPLOY_MODE=docker|baremetal)"; return 1 ;;
  esac

  status "done" "Updated to ${tag} and restarted"
  log "Update complete."
  rm -f "$TRIGGER" 2>/dev/null || true
}

do_watch() {
  log "Watching ${TRIGGER}… (Ctrl-C to stop)"
  while true; do
    if [ -f "$TRIGGER" ]; then
      log "Trigger detected."
      if ! do_apply; then
        status "error" "Update failed — see logs"
        # Consume the trigger so a persistent failure doesn't loop every cycle;
        # the operator can click Update again to retry.
        mv -f "$TRIGGER" "${TRIGGER}.failed" 2>/dev/null || rm -f "$TRIGGER" 2>/dev/null || true
      fi
    fi
    sleep 15
  done
}

case "${1:---apply}" in
  --check) do_check ;;
  --apply) do_apply ;;
  --watch) do_watch ;;
  *) echo "usage: $0 [--check|--apply|--watch]" >&2; exit 2 ;;
esac
