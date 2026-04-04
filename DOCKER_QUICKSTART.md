# Art-AI Docker Compose - Quick Start Guide

## ✅ Setup Complete!

Your Docker Compose environment is ready with hot-reload/watchdog enabled for all services.

## 🚀 Running Services

All services are currently running:

- **Frontend**: http://localhost:3000 (Next.js with Bun dev server)
- **Backend**: http://localhost:8000 (FastAPI with uvicorn --reload)
- **Worker**: Celery with watchdog auto-restart
- **PostgreSQL**: localhost:5434 (Note: Port 5434 instead of default 5432)
- **Redis**: localhost:6379

## 📋 Quick Commands

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f worker
```

### Restart a service
```bash
docker-compose restart worker
docker-compose restart backend
docker-compose restart frontend
```

### Rebuild after dependency changes
```bash
docker-compose up -d --build
```

## 🔧 Development Features

### Hot Reload is Enabled!

Edit your code and changes will automatically reload:

- **Frontend** (`/frontend`): Bun dev server with fast refresh
- **Backend** (`/backend`): Uvicorn with `--reload` flag
- **Worker** (`/worker`): Watchdog monitors `*.py` files and auto-restarts Celery

### Database Migrations

```bash
# Run Drizzle migrations
docker-compose exec frontend bun run drizzle:push

# Generate new migrations
docker-compose exec frontend bun run drizzle:generate
```

### Access Database

```bash
# PostgreSQL CLI
docker-compose exec postgres psql -U artai_user -d artai

# Redis CLI
docker-compose exec redis redis-cli
```

### Execute Commands in Containers

```bash
# Frontend
docker-compose exec frontend bun install

# Backend
docker-compose exec backend uv pip install <package>

# Worker
docker-compose exec worker uv pip install <package>
```

## 📁 Configuration Files

- **docker-compose.yml**: Main compose configuration
- **.env.docker**: Shared environment variables
- **frontend/.env**: Frontend-specific configuration
- **backend/.env**: Backend-specific configuration
- **worker/.env**: Worker-specific configuration

## ✨ Features Configured

✅ PostgreSQL database with health checks  
✅ Redis for Celery broker and Socket.IO  
✅ Backend API with FastAPI and Socket.IO  
✅ Celery worker with task: `generate_and_verify_content`  
✅ Frontend with Next.js and Drizzle ORM  
✅ Hot-reload/watchdog on all services  
✅ Volume mounts for live code editing  
✅ Database migrations ready  
✅ All API keys configured  

## 🔍 Verify Everything is Working

### Check Service Status
```bash
docker-compose ps
```

All services should show "Up" and healthy where applicable.

### Test Backend API
```bash
curl http://localhost:8000/health
# Should return: {"ok":true}
```

### Test Frontend
```bash
curl -I http://localhost:3000
# Should return: HTTP/1.1 200 OK
```

### Check Worker Tasks
```bash
docker-compose exec worker uv run python -c "from celery_app import celery_app; print(list(celery_app.tasks.keys()))"
# Should include: 'generate_and_verify_content'
```

## 📝 Notes

- PostgreSQL uses port **5434** (not 5432) to avoid conflicts with local installations
- Worker runs as root (warning is expected in development)
- Frontend and backend containers use volume mounts, so changes are reflected immediately
- Database data persists in Docker volumes even after `docker-compose down`

## 🛑 Clean Shutdown

### Stop services (keep data)
```bash
docker-compose down
```

### Stop services and remove volumes (delete all data)
```bash
docker-compose down -v
```

## 📖 Full Documentation

See [README.Docker.md](./README.Docker.md) for complete documentation, troubleshooting, and advanced usage.

---

**Happy Coding! 🎉**
