# SecureOps — Security

## Hardening built in
- **JWT secret is never hardcoded.** The signing key comes from
  `SECUREOPS_JWT_SECRET`, or a random secret auto-generated once and stored in
  `controller/backend/.jwt_secret` (chmod 600, git-ignored). Forged-token attacks
  via the old public default key are no longer possible.
- **No fixed default admin password.** The bootstrap `admin` account uses
  `SECUREOPS_ADMIN_PASSWORD` if set, otherwise a random password printed **once**
  to the logs. Prefer logging in with a real Linux/PAM account.
- **Security headers** on every response: `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`. Enable HSTS
  with `SECUREOPS_ENABLE_HSTS=1` once TLS is terminated upstream.
- **Agent auth** uses a shared `X-Agent-Key` (URL-encoded); join tokens are
  single-use and DB-persisted.
- **LogSync ingest** is opt-in, per-device key authenticated (constant-time
  compare), size-capped and rate-limited. Syslog/HTTP listeners bind nothing
  until explicitly enabled.
- **SQLi**: all DB access goes through SQLAlchemy ORM (parameterized).
- **Report export** is served inline with `nosniff` + a restrictive CSP.

## Recommended production config
```bash
SECUREOPS_JWT_SECRET=$(openssl rand -base64 48)   # or let it auto-generate
SECUREOPS_ADMIN_PASSWORD=<strong-password>        # or read it from logs once
SECUREOPS_BEHIND_PROXY=1                           # trust nginx X-Forwarded-*
SECUREOPS_ENABLE_HSTS=1                            # only when HTTPS is enforced
SECUREOPS_CORS_ORIGINS=https://secureops.site,capacitor://localhost
```
- Terminate TLS at nginx/Cloudflare; never expose the backend port publicly.
- Keep agents on the Tailscale/WireGuard mesh; don't expose `:8001` to the internet.
- Restrict the syslog port (`5514`) to your management VLAN.
- Run `git pull` regularly; rotate `SECUREOPS_AGENT_KEY` if a host is decommissioned.

## Reporting a vulnerability
Email the maintainer (Muhammad Surya Ragasin, Politeknik Negeri Sriwijaya).
Please do not open public issues for security reports.
