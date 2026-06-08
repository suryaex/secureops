# SecureOps ⇄ StorageHub — Interoperability & Coexistence

SecureOps and StorageHub are designed to run **on the same host at the same time**
without colliding, and to share a compatible dependency baseline.

## Port map (no collisions)

| Service                     | Host port | Notes                                  |
|-----------------------------|-----------|----------------------------------------|
| **SecureOps** nginx (web)   | 80 / 443  | Primary — owns the public domain       |
| **SecureOps** backend       | 8000      | uvicorn/gunicorn (127.0.0.1)           |
| **SecureOps** agent         | 8001      | per monitored server                   |
| **StorageHub** nginx (web)  | **8080**  | `HTTP_PORT` env (default 8080)          |
| **StorageHub** backend      | **8010**  | `BACKEND_PORT` env (default 8010)       |
| **StorageHub** MariaDB      | 3306      | container/local only                   |

SecureOps keeps `:80/:443`; StorageHub was moved to `:8080`/`:8010` so both can
share one system nginx (different `listen` ports) or run side by side in Docker.
Override StorageHub ports with `HTTP_PORT` / `BACKEND_PORT` if needed.

## Shared dependency baseline

Both backends pin the same compatible ranges so a single Python/OS image can host
either project:

```
fastapi>=0.110,<1.0   uvicorn[standard]>=0.27,<1.0   SQLAlchemy>=2.0,<3.0
pydantic>=2.5,<3.0    passlib[bcrypt]>=1.7.4,<2.0     bcrypt>=4.0,<5.0
cryptography>=42.0,<45.0   httpx>=0.25,<1.0           python-multipart>=0.0.9,<1.0
```

Frontends share React 18 + Vite 5 + Tailwind 3.4 + axios 1.7.

## ARM (Raspberry Pi / Orange Pi)

Both projects build and run on **arm64** and **armv7/armhf**:
- Deploy/install scripts detect `uname -m`; on armv7 they install a Rust toolchain
  (`cargo`/`rustc`) so `bcrypt`/`cryptography`/`watchfiles` compile from source.
- `libffi`/`libssl` dev headers are installed for native wheels.
- Vite builds are capped with `NODE_OPTIONS=--max-old-space-size=512` to avoid OOM
  on low-RAM boards.
- StorageHub Docker uses `mariadb:11` (arm64 **and** armv7) instead of `mysql:8.0`.
