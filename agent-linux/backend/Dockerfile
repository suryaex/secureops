# SecureOps Agent (Linux) — Docker image
# Same python:3.12-slim base as the controller → shared layers / deps.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    SECUREOPS_AGENT_MODE=1 \
    SECUREOPS_DATABASE_URL=sqlite:////app/data/agent.db

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential libffi-dev libssl-dev curl procps \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .
RUN mkdir -p /app/data

EXPOSE 8001
HEALTHCHECK --interval=20s --timeout=5s --start-period=20s --retries=5 \
    CMD curl -fsS http://localhost:8001/api/health || exit 1

CMD ["gunicorn", "-c", "gunicorn.conf.py", "main:app"]
