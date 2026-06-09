"""
LogSync — SecureOps extension.

Collects activity / device / appliance logs and backs them up to a StorageHub
instance. Also exposes:
  * an HTTP ingest endpoint for ARM boards / microcontrollers, and
  * an embedded syslog collector for routers / switches / firewalls
    (devices that can't run a full agent).

Everything is opt-in via environment variables — see config.py.
"""
