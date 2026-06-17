# SecureOps Controller — backend (FastAPI + gunicorn/uvicorn)
# Same python:3.12-slim base as the agent and StorageHub → shared layers.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    SECUREOPS_DATABASE_URL=sqlite:////app/data/secureops.db \
    SECUREOPS_JWT_SECRET_FILE=/app/data/.jwt_secret

WORKDIR /app

# libpam for python-pam, libffi/libssl for cryptography/bcrypt, curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential libffi-dev libssl-dev libpam0g-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .
RUN mkdir -p /app/data

EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --start-period=25s --retries=5 \
    CMD curl -fsS http://localhost:8000/api/health || exit 1

CMD ["gunicorn", "-c", "gunicorn.conf.py", "main:app"]
