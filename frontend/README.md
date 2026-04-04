# Frontend Application

Next.js 16 frontend for ART-AI.

This app provides:

- authentication and session management (Better Auth)
- chat UI for prompt submission and verified assistant responses
- real-time task progress via Socket.IO
- server routes that coordinate with the backend orchestrator
- PostgreSQL persistence through Drizzle ORM

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4 + Base UI components
- Better Auth
- Drizzle ORM + PostgreSQL
- Socket.IO client

## Key Directories

- `app/`: route pages and API routes
- `app/chat/`: chat page, composer, timeline, actions
- `app/docs/`: SDK documentation page
- `components/`: shared UI and feature components
- `hooks/use-task-socket.ts`: live task update subscription
- `lib/db/`: schema, DB client, and auth DB integrations

## Environment Setup

Template file in this repo: `example--.env.local`

Copy and edit:

```bash
cp example--.env.local .env.local
```

Typical values:

```env
DATABASE_URL=postgresql://artai_user:artai_password@localhost:5432/artai
BETTER_AUTH_BASE_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
FASTAPI_BASE_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_SOCKET_URL=http://localhost:8000/
INTERNAL_SHARED_SECRET=change-me
```

## Install and Run

```bash
bun install
bun run drizzle:push
bun run dev
```

App runs at `http://localhost:3000`.

## Important Scripts

- `bun run dev`: start development server
- `bun run build`: production build + type check
- `bun run start`: run production server
- `bun run lint`: run ESLint
- `bun run drizzle:generate`: generate migrations
- `bun run drizzle:migrate`: apply generated migrations
- `bun run drizzle:push`: push schema directly to DB
- `bun run better-auth:generate`: regenerate Better Auth schema types

## Runtime Flow

1. User submits prompt in chat UI.
2. Frontend route calls backend `POST /api/chat/{chatId}/start` with `x-internal-secret`.
3. Backend queues Celery task and returns `taskId`.
4. Frontend joins Socket.IO room for that task and renders live progress.
5. Worker completion/failure updates are persisted and reflected in timeline.

## Build and Type Safety

Before merging frontend changes:

```bash
bun run lint
bun run build
```

## Troubleshooting

### Build fails on auth or DB types

- ensure `DATABASE_URL` points to a reachable PostgreSQL instance
- run `bun run drizzle:push`
- rerun `bun run better-auth:generate` if auth schema changed

### No live task updates

- verify `NEXT_PUBLIC_FASTAPI_SOCKET_URL` points to backend host
- ensure backend Socket.IO path `/socket.io` is reachable
- verify worker is running and emitting updates

### Start-task calls fail with 401

- ensure frontend and backend `INTERNAL_SHARED_SECRET` match
- confirm request includes `x-internal-secret` header
