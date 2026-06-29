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

do_apply() {
  cd "$REPO_DIR"
  # The watcher runs as root while the repo is owned by the deploy user; tell git
  # this checkout is trusted so fetch/checkout don't bail on "dubious ownership".
  git config --global --add safe.directory "$REPO_DIR" 2>/dev/null || true

  status "updating" "Fetching latest source"
  if ! git fetch --tags --prune origin; then
    status "error" "git fetch failed — check network / credentials"; return 1
  fi

  local tag cfs
  tag="$(latest_tag 2>/dev/null || true)"
  if [ -n "${tag:-}" ] && git rev-parse "refs/tags/${tag}" >/dev/null 2>&1; then
    log "Checking out release ${tag}"
    git checkout -q "tags/${tag}"
  else
    log "No release tag reachable; fast-forwarding ${UPDATE_BRANCH}"
    git checkout -q "${UPDATE_BRANCH}"
    git merge --ff-only "origin/${UPDATE_BRANCH}"
  fi

  cfs="$(compose_files)" || { status "error" "No compose file found"; return 1; }
  log "Rebuilding images via ${cfs}…"
  status "rebuilding" "Building updated images"
  # shellcheck disable=SC2086 — $cfs is a deliberate, controlled flag list.
  compose $cfs build

  log "Restarting stack…"
  status "restarting" "Recreating containers"
  # shellcheck disable=SC2086
  compose $cfs up -d

  status "done" "Updated to ${tag:-${UPDATE_BRANCH}} and restarted"
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
