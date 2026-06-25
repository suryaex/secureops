# In-app self-update

The SecureOps controller can check GitHub for a newer release and apply it
(pull → rebuild → restart) **from the dashboard** — Settings → *Software update*.

## How it works

| Layer | Where | What it does |
|-------|-------|--------------|
| Check | `GET /api/update/check` | Compares the running version with the latest GitHub release of `SECUREOPS_GITHUB_REPO`. Any signed-in user. |
| Apply | `POST /api/update/apply` | **Admin only.** Writes a trigger file; the host updater performs the upgrade. |
| Status | `GET /api/update/status` | Progress written by `scripts/self-update.sh`, so the UI survives the restart. |
| Updater | `scripts/self-update.sh` | The **only** thing the backend runs: `git` checkout of the latest tag + `docker compose up -d --build`. |

The mutating endpoint is gated by the existing `require_admin` dependency, and
the backend only ever runs the committed `self-update.sh` — never arbitrary code.
The updater is mounted on the **controller only** (not on agents).

## Enabling "Update & restart"

Let a host process perform the upgrade. Pick one:

- **Host watcher (recommended):** run the updater in `--watch` mode next to the
  repo:
  ```bash
  ./scripts/self-update.sh --watch     # or a systemd unit / cron @reboot
  ```
- **In-process:** set `SECUREOPS_UPDATE_INPROC=1` and mount the repo + the
  Docker socket into the controller container.

Trigger/status files live under `/var/lib/secureops/`
(`SECUREOPS_UPDATE_TRIGGER`, `SECUREOPS_UPDATE_STATUS`) — mount that path so the
controller and the host updater share it.

## Config (environment)

| Var | Default |
|-----|---------|
| `SECUREOPS_GITHUB_REPO` | `suryaex/secureops` |
| `SECUREOPS_UPDATE_BRANCH` | `main` |
| `SECUREOPS_UPDATE_TRIGGER` | `/var/lib/secureops/update.request` |
| `SECUREOPS_UPDATE_STATUS` | `/var/lib/secureops/update.status` |
| `SECUREOPS_UPDATE_INPROC` | `0` |

## Manual use

```bash
./scripts/self-update.sh --check     # print current vs latest
./scripts/self-update.sh --apply     # upgrade now
```
