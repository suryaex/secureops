#!/usr/bin/env bash
#
# SecureOps self-update — the single, auditable script the in-app updater runs.
# Pulls the latest released tag (or branch), rebuilds images, restarts the stack.
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
#
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GITHUB_REPO="${SECUREOPS_GITHUB_REPO:-suryaex/secureops}"
UPDATE_BRANCH="${SECUREOPS_UPDATE_BRANCH:-main}"
TRIGGER="${SECUREOPS_UPDATE_TRIGGER:-/var/lib/secureops/update.request}"
STATUS_FILE="${SECUREOPS_UPDATE_STATUS:-/var/lib/secureops/update.status}"

log()    { printf '[self-update] %s\n' "$*" >&2; }
status() {
  mkdir -p "$(dirname "$STATUS_FILE")" 2>/dev/null || true
  printf '{"state":"%s","message":"%s","at":%s}\n' "$1" "${2:-}" "$(date +%s)" \
    > "$STATUS_FILE" 2>/dev/null || true
}

compose() {
  if docker compose version >/dev/null 2>&1; then docker compose "$@";
  elif command -v docker-compose >/dev/null 2>&1; then docker-compose "$@";
  else log "Docker Compose not found"; return 127; fi
}

compose_file() {
  for f in docker-compose.prod.yml docker-compose.yml; do
    [ -f "$REPO_DIR/$f" ] && { echo "$f"; return 0; }
  done
  return 1
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

do_apply() {
  cd "$REPO_DIR"
  status "updating" "Fetching latest source"
  git fetch --tags --prune origin

  local tag cf
  tag="$(latest_tag 2>/dev/null || true)"
  if [ -n "${tag:-}" ] && git rev-parse "refs/tags/${tag}" >/dev/null 2>&1; then
    log "Checking out release ${tag}"
    git checkout -q "tags/${tag}"
  else
    log "No release tag reachable; fast-forwarding ${UPDATE_BRANCH}"
    git checkout -q "${UPDATE_BRANCH}"
    git merge --ff-only "origin/${UPDATE_BRANCH}"
  fi

  cf="$(compose_file)" || { status "error" "No compose file found"; exit 1; }
  log "Rebuilding images via ${cf}…"
  status "rebuilding" "Building updated images"
  compose -f "$cf" build

  log "Restarting stack…"
  status "restarting" "Recreating containers"
  compose -f "$cf" up -d

  status "done" "Updated to ${tag:-${UPDATE_BRANCH}} and restarted"
  log "Update complete."
  rm -f "$TRIGGER" 2>/dev/null || true
}

do_watch() {
  log "Watching ${TRIGGER}… (Ctrl-C to stop)"
  while true; do
    if [ -f "$TRIGGER" ]; then
      log "Trigger detected."
      do_apply || status "error" "Update failed — see logs"
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
