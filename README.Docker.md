# Docker Compose Setup for Art-AI

This document describes how to run the Art-AI application using Docker Compose with hot-reload enabled for development.

## Architecture

The application consists of 5 services:

1. **PostgreSQL** - Database for storing chats, messages, and user data
2. **Redis** - Message broker for Celery and Socket.IO pub/sub
3. **Backend** - FastAPI server with Socket.IO for real-time updates
4. **Worker** - Celery worker for background fact-checking tasks
5. **Frontend** - Next.js application

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2+

## Quick Start

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations:**
   ```bash
   # Run Drizzle migrations for the frontend schema
   docker-compose exec frontend bun run drizzle:push
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Backend Health: http://localhost:8000/health

## Development Features

### Hot Reload / Watchdog

All services are configured with hot-reload for development:

- **Frontend**: Uses Bun's built-in dev server with fast refresh
- **Backend**: Uvicorn with `--reload` flag watches Python files
- **Worker**: Uses `watchmedo` (watchdog) to auto-restart on Python file changes

When you edit code, the respective service will automatically reload.

### Volume Mounts

Development volumes are mounted to enable hot-reload:
- `./frontend:/app` - Frontend source code
- `./backend:/app` - Backend source code
- `./worker:/app` - Worker source code

## Service Details

### PostgreSQL
- **Port**: 5434 (mapped from container's 5432)
- **Database**: artai
- **User**: artai_user
- **Password**: artai_password
- **Data**: Persisted in `postgres_data` volume
- **Note**: Using port 5434 to avoid conflict with local PostgreSQL on 5432

### Redis
- **Port**: 6379
- **Data**: Persisted in `redis_data` volume

### Backend (FastAPI)
- **Port**: 8000
- **Environment**: See `backend/.env`
- **Command**: `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

### Worker (Celery)
- **Environment**: See `worker/.env`
- **Command**: `watchmedo auto-restart --directory=. --pattern=*.py --recursive -- celery -A main.celery_app worker --loglevel=info`
- **Watchdog**: Monitors Python files and auto-restarts Celery worker

### Frontend (Next.js)
- **Port**: 3000
- **Environment**: See `frontend/.env`
- **Command**: `bun run dev`

## Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f worker
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart worker
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes
```bash
docker-compose down -v
```

### Execute Commands in Containers
```bash
# Run migrations
docker-compose exec frontend bun run drizzle:push

# Access PostgreSQL
docker-compose exec postgres psql -U artai_user -d artai

# Access Redis CLI
docker-compose exec redis redis-cli

# Run shell in worker
docker-compose exec worker /bin/bash
```

### Rebuild Services
```bash
# Rebuild all services
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build worker
```

## Environment Variables

All environment variables are configured in:
- `docker-compose.yml` - Container-specific overrides
- `.env.docker` - Shared environment values
- `frontend/.env` - Frontend-specific values
- `backend/.env` - Backend-specific values
- `worker/.env` - Worker-specific values

## Database Migrations

The frontend uses Drizzle ORM for database migrations:

```bash
# Generate migrations
docker-compose exec frontend bun run drizzle:generate

# Push schema to database
docker-compose exec frontend bun run drizzle:push

# Run migrations
docker-compose exec frontend bun run drizzle:migrate
```

## Troubleshooting

### Port Already in Use
If ports 3000, 5434, 6379, or 8000 are already in use:
1. Stop the conflicting service
2. Or modify the port mappings in `docker-compose.yml`

**Note**: PostgreSQL is mapped to port 5434 (instead of default 5432) to avoid conflicts with local installations.

### Database Connection Issues
```bash
# Check PostgreSQL is healthy
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Verify connection
docker-compose exec postgres psql -U artai_user -d artai -c "SELECT 1;"
```

### Worker Not Processing Tasks
```bash
# Check worker logs
docker-compose logs -f worker

# Verify Redis connection
docker-compose exec worker redis-cli -h redis ping

# Restart worker
docker-compose restart worker
```

### Frontend Build Issues
```bash
# Clear Next.js cache and rebuild
docker-compose exec frontend rm -rf .next
docker-compose restart frontend
```

## Production Deployment

For production, use the existing production Dockerfiles:
- `frontend/Dockerfile` - Multi-stage build with standalone Next.js
- `backend/Dockerfile` - Multi-stage build with minimal dependencies

Create a separate `docker-compose.prod.yml` without dev volume mounts and watchdog.

## Additional Notes

- The worker connects to PostgreSQL using SQLAlchemy with automatic table reflection
- Frontend uses Drizzle ORM and manages its own schema
- Redis serves as both Celery broker and Socket.IO pub/sub backend
- All services share the same PostgreSQL database and Redis instance
