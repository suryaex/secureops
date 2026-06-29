"""In-app self-update for the SecureOps controller.

Check whether a newer release exists on GitHub, then apply it (pull + rebuild +
restart) from the dashboard. The backend only ever runs the committed,
auditable ``scripts/self-update.sh`` — never arbitrary code.

* ``check``  — read-only GitHub release comparison.
* ``apply``  — writes a sentinel trigger (and, when SECUREOPS_UPDATE_INPROC=1
               and the repo + docker socket are mounted, launches the script).
* ``status`` — progress as last written by ``scripts/self-update.sh``.

Standard library only.

Config (environment):
    SECUREOPS_GITHUB_REPO     default "suryaex/secureops"
    SECUREOPS_UPDATE_BRANCH   default "main"
    SECUREOPS_UPDATE_TRIGGER  default "/var/lib/secureops/update.request"
    SECUREOPS_UPDATE_STATUS   default "/var/lib/secureops/update.status"
    SECUREOPS_UPDATE_INPROC   "1" to run the updater in-process
"""
from __future__ import annotations

import json
import os
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

from appversion import APP_VERSION

_RELEASES_LATEST = "https://api.github.com/repos/{repo}/releases/latest"
_TAGS = "https://api.github.com/repos/{repo}/tags"
_HTTP_TIMEOUT = 6


def _repo() -> str:
    return os.getenv("SECUREOPS_GITHUB_REPO", "suryaex/secureops")


def _trigger_file() -> Path:
    return Path(os.getenv("SECUREOPS_UPDATE_TRIGGER", "/var/lib/secureops/update.request"))


def _status_file() -> Path:
    return Path(os.getenv("SECUREOPS_UPDATE_STATUS", "/var/lib/secureops/update.status"))


# --------------------------- version comparison ---------------------------- #
def normalize(version: str) -> str:
    return (version or "").strip().lstrip("vV")


def _parts(version: str) -> tuple[int, ...]:
    out: list[int] = []
    for chunk in normalize(version).split("."):
        digits = ""
        for ch in chunk:
            if ch.isdigit():
                digits += ch
            else:
                break
        out.append(int(digits) if digits else 0)
    return tuple(out) or (0,)


def is_newer(candidate: str, current: str) -> bool:
    a, b = _parts(candidate), _parts(current)
    n = max(len(a), len(b))
    a += (0,) * (n - len(a))
    b += (0,) * (n - len(b))
    return a > b


# ------------------------------ GitHub lookup ------------------------------ #
class _GitHubUnreachable(Exception):
    """GitHub itself could not be reached (DNS / timeout / connection refused).

    Distinct from "GitHub answered, but the repo has no release/tag yet", which
    is reported as ``None`` so the caller can tell the two apart.
    """


def _get_json(url: str):
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/vnd.github+json", "User-Agent": "secureops-updater"},
    )
    with urllib.request.urlopen(req, timeout=_HTTP_TIMEOUT) as resp:  # noqa: S310
        return json.loads(resp.read().decode("utf-8"))


def _latest_release(repo: str):
    """Latest published release, falling back to the newest tag.

    Returns ``None`` when GitHub is reachable but the repo has no published
    release or tag yet (releases/latest 404 + empty tags). Raises
    ``_GitHubUnreachable`` only on a genuine network failure (timeout / DNS /
    connection refused) or when GitHub answers but is unhappy (403 rate-limit,
    5xx) — i.e. the only cases that warrant a "could not reach GitHub" message.
    """
    try:
        rel = _get_json(_RELEASES_LATEST.format(repo=repo))
        if isinstance(rel, dict) and rel.get("tag_name"):
            return {
                "version": rel["tag_name"],
                "notes": rel.get("body") or "",
                "url": rel.get("html_url") or "",
                "published_at": rel.get("published_at") or "",
            }
    except urllib.error.HTTPError as exc:
        if exc.code != 404:  # 403 rate-limit, 5xx, etc. — reachable but unhappy.
            raise _GitHubUnreachable from exc
        # 404 → no published release yet; try the newest tag below.
    except (urllib.error.URLError, OSError) as exc:
        raise _GitHubUnreachable from exc  # genuinely unreachable.
    except ValueError:
        return None  # reachable, but unparseable body — treat as nothing published.

    # No published release → newest tag.
    try:
        tags = _get_json(_TAGS.format(repo=repo))
    except urllib.error.HTTPError as exc:
        if exc.code != 404:
            raise _GitHubUnreachable from exc
        return None
    except (urllib.error.URLError, OSError) as exc:
        raise _GitHubUnreachable from exc
    except ValueError:
        return None
    if isinstance(tags, list) and tags:
        return {
            "version": tags[0].get("name", ""),
            "notes": "",
            "url": f"https://github.com/{repo}/releases",
            "published_at": "",
        }
    return None


# -------------------------------- public API ------------------------------- #
def check() -> dict:
    try:
        latest = _latest_release(_repo())
    except _GitHubUnreachable:
        return {
            "current": APP_VERSION,
            "latest": None,
            "update_available": False,
            "checked_at": int(time.time()),
            "error": "Could not reach GitHub to check for updates.",
        }
    if latest is None:
        # GitHub answered, but the repo has no published release or tag yet —
        # not an error: the running version is the latest known one.
        return {
            "current": APP_VERSION,
            "latest": APP_VERSION,
            "update_available": False,
            "checked_at": int(time.time()),
        }
    return {
        "current": APP_VERSION,
        "latest": normalize(latest["version"]),
        "update_available": is_newer(latest["version"], APP_VERSION),
        "notes": latest["notes"],
        "url": latest["url"],
        "published_at": latest["published_at"],
        "checked_at": int(time.time()),
    }


def status() -> dict:
    try:
        return json.loads(_status_file().read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"state": "idle"}


def _write_status(state: str, message: str = "") -> None:
    path = _status_file()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps({"state": state, "message": message, "at": int(time.time())}),
            encoding="utf-8",
        )
    except OSError:
        pass


def apply() -> dict:
    target = check()
    if not target.get("update_available"):
        return {"state": "up-to-date", "message": "Already on the latest version."}

    trigger = _trigger_file()
    try:
        trigger.parent.mkdir(parents=True, exist_ok=True)
        trigger.write_text(
            json.dumps(
                {
                    "requested_at": int(time.time()),
                    "from": APP_VERSION,
                    "to": target.get("latest"),
                    "branch": os.getenv("SECUREOPS_UPDATE_BRANCH", "main"),
                }
            ),
            encoding="utf-8",
        )
    except OSError as exc:
        return {"state": "error", "message": f"Cannot write update trigger: {exc}"}

    _write_status("queued", f"Update to {target.get('latest')} requested.")

    if os.getenv("SECUREOPS_UPDATE_INPROC", "0") == "1":
        # backend/ -> controller/ -> repo root -> scripts/self-update.sh
        script = Path(__file__).resolve().parents[2] / "scripts" / "self-update.sh"
        if script.exists():
            try:
                subprocess.Popen(  # noqa: S603
                    ["bash", str(script), "--apply"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    start_new_session=True,
                )
                _write_status("updating", "Running self-update.sh…")
            except OSError as exc:
                return {"state": "error", "message": f"Failed to launch updater: {exc}"}
        else:
            return {"state": "error", "message": f"Updater script not found at {script}."}

    return {
        "state": "queued",
        "message": f"Updating to {target.get('latest')}. The controller will restart shortly.",
        "to": target.get("latest"),
    }
