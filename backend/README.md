# backend

FastAPI service that:

- accepts Next.js requests to start Celery jobs
- exposes task snapshot API
- hosts Socket.IO (`/socket.io`) for live task updates

## Required env

- `REDIS_URL`
- `CELERY_BROKER_URL` (defaults to `REDIS_URL`)
- `CELERY_RESULT_BACKEND` (defaults to `REDIS_URL`)
- `INTERNAL_SHARED_SECRET`
- `CORS_ALLOW_ORIGINS` (comma-separated, optional)

## Run

```bash
uv run uvicorn main:app --reload --port 8000
```
