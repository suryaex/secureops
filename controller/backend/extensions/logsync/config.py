"""LogSync configuration — all opt-in via environment variables."""
import os


def _b(name: str, default: str = "0") -> bool:
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes", "on")


def _i(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


# --- StorageHub backup target ---
STORAGEHUB_URL     = os.getenv("SECUREOPS_STORAGEHUB_URL", "").rstrip("/")
STORAGEHUB_API_KEY = os.getenv("SECUREOPS_STORAGEHUB_API_KEY", "")
STORAGEHUB_SOURCE  = os.getenv("SECUREOPS_STORAGEHUB_SOURCE", "secureops")
STORAGEHUB_VERIFY_TLS = _b("SECUREOPS_STORAGEHUB_VERIFY_TLS", "1")

# --- Scheduler ---
# Minutes between automatic backups. 0 disables the background scheduler.
INTERVAL_MIN = _i("SECUREOPS_LOGSYNC_INTERVAL_MIN", 15)

# Include the controller's own admin activity logs in each backup.
INCLUDE_ACTIVITY = _b("SECUREOPS_LOGSYNC_INCLUDE_ACTIVITY", "1")

# --- Embedded syslog collector (routers / switches / firewalls) ---
SYSLOG_ENABLED = _b("SECUREOPS_SYSLOG_ENABLED", "0")
SYSLOG_HOST    = os.getenv("SECUREOPS_SYSLOG_HOST", "0.0.0.0")
# Default 5514 (unprivileged). Use 514 only if the process can bind low ports.
SYSLOG_PORT    = _i("SECUREOPS_SYSLOG_PORT", 5514)
SYSLOG_UDP     = _b("SECUREOPS_SYSLOG_UDP", "1")
SYSLOG_TCP     = _b("SECUREOPS_SYSLOG_TCP", "1")

# Hard cap on a single ingested message (defensive — avoid memory abuse).
MAX_MESSAGE_BYTES = _i("SECUREOPS_LOGSYNC_MAX_MSG", 16384)

# Per-device in-memory rate limit (messages/minute) for the HTTP ingest path.
INGEST_RATE_PER_MIN = _i("SECUREOPS_LOGSYNC_RATE", 600)


def backup_enabled() -> bool:
    return bool(STORAGEHUB_URL and STORAGEHUB_API_KEY)
