# Worker Service

Celery worker for ART-AI verification tasks.

This service executes the end-to-end AI pipeline:

1. generate response content
2. classify domain relevance
3. generate fact-check questions
4. collect evidence from trusted sources
5. verify claims against evidence
6. emit progress and persist final result

## Tech Stack

- Celery 5 + Redis
- LangChain + Groq
- Firecrawl evidence collection
- SQLAlchemy persistence
- Socket.IO progress emission via Redis adapter

## Key Files

- `tasks/ai.py`: main Celery task (`generate_and_verify_content`)
- `core/celery_client.py`: Celery app configuration
- `core/ai.py`: LLM construction and throttling helpers
- `core/settings.py`: environment settings
- `core/database.py`: persistence helpers
- `ai/`: domain classification, question generation, relevance checks
- `tools/`: evidence collection/search helpers

## Environment Setup

Template file: `.env-example`

Copy and edit:

```bash
cp .env-example .env
```

Required values:

- `DATABASE_URL`
- `REDIS_URL`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `FIRE_CRAWL_API_KEY`

Also supported:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GROQ_MIN_INTERVAL_SECONDS`
- `GROQ_RATE_LIMIT_RETRIES`
- `GROQ_RETRY_BASE_DELAY_SECONDS`
- `GROQ_RETRY_JITTER_SECONDS`

## Install and Run

```bash
uv sync
uv run celery -A tasks.ai:celery_app worker --loglevel=info --pool=solo
```

If you want concurrent workers, remove `--pool=solo` and tune based on environment.

## Task Contract

Registered task name:

- `generate_and_verify_content`

Expected arguments:

- `task_id: str`
- `user_prompt: str`
- `chat_id: str | None`
- `user_id: str | None`

The worker emits progress snapshots and terminal states (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`) and persists final assistant output when chat metadata is provided.

## Verification Behavior

- rejects/regenerates outputs with poor domain relevance
- retries with targeted prompt when unverified claim ratio is high
- applies rate-limit retry logic for provider throttling
- returns graceful fallback messaging when all safeguards fail

## Troubleshooting

### Worker exits on startup

- ensure `.env` exists and all required keys are present
- verify Redis is reachable from `REDIS_URL`
- verify package dependencies installed with `uv sync`

### Tasks are queued but not processed

- confirm backend and worker use the same Redis broker URL
- verify task name is registered by startup logs
- check that Celery process has not crashed after boot

### Frequent rate-limit failures

- increase `GROQ_MIN_INTERVAL_SECONDS`
- increase `GROQ_RATE_LIMIT_RETRIES`
- reduce request frequency from callers
