# Backend Service

FastAPI orchestration service for ART-AI.

This service:

- receives authenticated task-start requests from the frontend
- enqueues Celery jobs for the worker pipeline
- exposes task snapshot lookup endpoints
- serves Socket.IO events at `/socket.io` for real-time updates

## Tech Stack

- FastAPI + Uvicorn
- Celery client
- Redis (broker/result + task snapshots)
- python-socketio (ASGI app mount)

## Project Files

- `main.py`: FastAPI app setup, CORS config, Socket.IO ASGI mount
- `api/routes.py`: task start and task snapshot endpoints
- `api/schemas.py`: request/response models
- `socket_server.py`: Socket.IO server configuration
- `core/settings.py`: environment settings and defaults
- `core/security.py`: internal shared-secret request validation
- `core/celery_client.py`: enqueue helper for worker task
- `core/redis_client.py`: task snapshot read/write helpers

## Environment Setup

Environment template file: `.env-example`

Copy and edit:

```bash
cp .env-example .env
```

Required values:

- `REDIS_URL`
- `INTERNAL_SHARED_SECRET`

Optional values:

- `CELERY_BROKER_URL` (defaults to `REDIS_URL`)
- `CELERY_RESULT_BACKEND` (defaults to `REDIS_URL`)
- `CORS_ALLOW_ORIGINS` (comma-separated, default: `http://localhost:3000`)

Example:

```env
REDIS_URL=redis://localhost:6379/0
INTERNAL_SHARED_SECRET=change-me
CORS_ALLOW_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Run Locally

From this folder:

```bash
uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Health check:

```bash
curl http://localhost:8000/health
```

## API Endpoints

All `/api/*` endpoints require header `x-internal-secret` matching `INTERNAL_SHARED_SECRET`.

### Start task

- `POST /api/chat/{chat_id}/start`
- Body:

```json
{
	"user_prompt": "Explain inflation in simple terms",
	"user_id": "user-id"
}
```

- Response:

```json
{
	"task_id": "uuid",
	"chat_id": "chat-id",
	"status": "queued"
}
```

### Read task snapshot

- `GET /api/tasks/{task_id}`
- Response contains the latest snapshot emitted by the worker.

### Health

- `GET /health`
- Response: `{ "ok": true }`

## Notes

- The backend does not run AI pipelines itself; it only orchestrates and serves status.
- Socket.IO is mounted through `socketio.ASGIApp` with path `socket.io`.
- CORS origins are parsed from `CORS_ALLOW_ORIGINS` as a comma-separated list.
