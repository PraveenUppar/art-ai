# ART-AI: Accessible Reliable Trustable AI

<div align="center">

![ART-AI Logo](https://img.shields.io/badge/ART--AI-Verified%20AI%20Responses-brightgreen?style=for-the-badge)

**A fact-checked AI assistant platform that generates verified, trustworthy responses through multi-stage fact-checking, evidence collection, and verification workflows.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Celery](https://img.shields.io/badge/Celery-5.6-37814A?style=flat-square&logo=celery)](https://docs.celeryq.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

[Features](#-key-features) • [Architecture](#-architecture) • [Python SDK](#-python-sdk) • [Quick Start](#-quick-start) • [Development](#-development) • [Documentation](#-documentation)

</div>

---

## 🎯 What is ART-AI?

Unlike traditional AI chatbots that rely on unverified internet searches, **ART-AI** ensures every response is grounded in evidence from trusted, domain-specific sources with automatic source attribution and credibility scoring.

### Key Differentiator

- ✅ **Verified Responses**: Every answer verified against trusted sources before delivery
- ✅ **No Hallucinations**: Only evidence-backed claims, no made-up information
- ✅ **Source Attribution**: Full citations with URLs for every claim
- ✅ **Domain-Aware**: Specialized fact-checking for Healthcare, Legal, Finance, and News
- ✅ **Real-time Progress**: Live updates as your request is being verified

---

## ✨ Key Features

### 🔍 Multi-Stage Verification Pipeline

1. **Content Generation** - AI generates initial response with contextual awareness
2. **Domain Classification** - Automatically identifies topic domain (Healthcare, Legal, Finance, News, General)
3. **Fact Extraction** - Extracts verifiable claims from generated content
4. **Evidence Collection** - Searches trusted, domain-specific sources (WHO, Government sites, Expert publications)
5. **Verification** - Cross-checks each claim against collected evidence
6. **Credibility Scoring** - Assigns confidence scores to validated information

### 🛡️ Trust & Safety

- **Bias Detection**: Domain-aware classification identifies potential biases
- **Misinformation Filtering**: Automatic screening of false claims
- **Trusted Knowledge Base**: Curated sources per domain
  - **Healthcare**: ICMR, WHO, NCBI, PubMed
  - **Legal**: Indian Supreme Court, Law Commission
  - **Finance**: RBI, SEBI, Income Tax Department
  - **News**: PIB, The Hindu, Scroll.in
  - **General**: Wikipedia, Academic journals

### 🚀 Real-Time Experience

- **Live Progress Tracking**: Watch as your request moves through verification stages
- **Socket.IO Integration**: Real-time updates without polling
- **Graceful Fallbacks**: Contextual error messages with retry suggestions

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                          │
│  • User Interface & Chat Management                             │
│  • Real-time Socket.IO Client                                   │
│  • Authentication (Better Auth)                                 │
│  • Database (Drizzle ORM + PostgreSQL)                          │
└──────────────┬──────────────────────────────┬───────────────────┘
               │                              │
               │ HTTP API                     │ WebSocket
               ↓                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                            │
│  • REST API Endpoints                                            │
│  • Socket.IO Server (Redis-backed)                               │
│  • Task Orchestrator                                             │
└──────────────┬──────────────────────────────────────────────────┘
               │
               │ Celery Tasks
               ↓
       ┌───────────────┐
       │     REDIS     │────────────┐
       │ Broker/Cache  │            │ Pub/Sub
       └───────────────┘            │
               │                    │
               │ Pick Task          │ Progress Updates
               ↓                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                     WORKER (Celery)                              │
│  • Fact-Checking Engine                                          │
│  • LLM Integration (Groq API)                                    │
│  • Evidence Collection (Firecrawl)                               │
│  • Multi-Attempt Verification                                    │
└──────────────┬──────────────────────────────────────────────────┘
               │
               │ Persist Results
               ↓
       ┌───────────────┐
       │  PostgreSQL   │
       │   Database    │
       └───────────────┘
```

### Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Next.js 16, React 19, TypeScript | User interface & server-side rendering |
| **UI Library** | TailwindCSS v4, shadcn, Base UI | Responsive design & components |
| **Backend** | FastAPI, Uvicorn | REST API & WebSocket server |
| **Worker** | Celery, Python 3.12+ | Background task processing |
| **Database** | PostgreSQL 16, Drizzle ORM | Data persistence & migrations |
| **Cache/Broker** | Redis 7 | Task queue & pub/sub messaging |
| **Real-time** | Socket.IO (Redis adapter) | Live progress updates |
| **Authentication** | Better Auth | Email/password authentication |
| **AI/LLM** | Groq API, LangChain | Content generation & classification |
| **Evidence** | Firecrawl API | Web scraping & search |
| **Python SDK** | `art_ai_sdk` | Reusable generation + verification pipeline for Python apps |

---

## 🐍 Python SDK

ART-AI ships with a first-class Python package in `SDK/` named `art_ai_sdk`.

Use the SDK when you want the same multi-stage verification workflow without going through the web app or REST routes.

### What the SDK provides

- Function-first pipeline calls (`classify_content_relevance`, `collect_evidence`, `check_relevance`, `generate_and_verify_content`)
- Client APIs (`ArtAIClient`, `AsyncArtAIClient`)
- Provider injection for custom LLM/search implementations
- Optional infra adapters for Redis progress, SQLAlchemy persistence, and Celery task submission

### Install

From repository root:

```bash
pip install -e ./SDK
```

With optional infra extras:

```bash
pip install -e "./SDK[infra]"
```

### Quick SDK usage

```python
from art_ai_sdk import ArtAIClient

client = ArtAIClient()

result = client.process(
  task_id="demo-task-1",
  user_prompt="Summarize the latest RBI inflation update and verify key claims.",
)

print(result["ok"])
print(result["result"]["final_verdict"])
print(result["result"]["content"])
```

For the complete SDK API, behavior, and model docs, see `SDK/README.md`.

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose (recommended)
- OR: Node.js 22+, Python 3.12+, PostgreSQL 16, Redis 7

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd art-ai

# Start all services (PostgreSQL, Redis, Backend, Worker, Frontend)
docker-compose up -d

# Run database migrations
docker-compose exec frontend bun run drizzle:push

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Health: http://localhost:8000/health
```

**That's it!** All services are running with hot-reload enabled.

### Option 2: Local Development

<details>
<summary>Click to expand local setup instructions</summary>

#### 1. Setup PostgreSQL & Redis

```bash
# Install PostgreSQL 16 and Redis 7
# Ubuntu/Debian:
sudo apt install postgresql-16 redis-server

# macOS:
brew install postgresql@16 redis
```

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
bun install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your database URL and API keys

# Run migrations
bun run drizzle:push

# Start development server
bun run dev
# Runs on http://localhost:3000
```

#### 3. Backend Setup

```bash
cd backend

# Install dependencies
pip install -e .
# Or with uv:
uv sync

# Configure environment
cp .env-example .env
# Edit .env with your Redis URL and secrets

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 4. Worker Setup

```bash
cd worker

# Install dependencies
pip install -e .
# Or with uv:
uv sync

# Configure environment
cp .env-example .env
# Edit .env with your API keys

# Start Celery worker
celery -A celery_app.celery_app worker --loglevel=info
```

</details>

---

## 🔧 Configuration

### Environment Variables

#### Frontend (`.env` or `.env.local`)

```env
# Database
DATABASE_URL=postgresql://artai_user:artai_password@localhost:5432/artai

# Authentication
BETTER_AUTH_BASE_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000

# Backend Connection
FASTAPI_BASE_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_SOCKET_URL=http://localhost:8000/

# Security
INTERNAL_SHARED_SECRET=your-secret-key-here
```

#### Backend (`.env`)

```env
# Redis
REDIS_URL=redis://localhost:6379/0

# Security
INTERNAL_SHARED_SECRET=your-secret-key-here
```

#### Worker (`.env`)

```env
# Database
DATABASE_URL=postgresql://artai_user:artai_password@localhost:5432/artai

# Redis
REDIS_URL=redis://localhost:6379/0

# AI/LLM APIs
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=openai/gpt-oss-20b
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Evidence Collection
FIRE_CRAWL_API_KEY=your-firecrawl-api-key
```

---

## 💻 Development

### Project Structure

```
art-ai/
├── frontend/                 # Next.js Application
│   ├── app/                 # App Router pages & routes
│   │   ├── page.tsx        # Landing page
│   │   ├── auth/           # Authentication pages
│   │   ├── chat/           # Chat interface
│   │   └── api/            # API routes
│   ├── components/          # React components
│   │   ├── ChatComposer.tsx
│   │   ├── ThreadTimeline.tsx
│   │   └── AccountDropdown.tsx
│   ├── hooks/              # Custom hooks
│   │   └── useTaskSocket.ts # Real-time updates
│   ├── lib/                # Utilities & configurations
│   │   ├── db/             # Database schema & connection
│   │   └── auth.ts         # Better Auth configuration
│   └── public/             # Static assets
│
├── backend/                 # FastAPI Server
│   ├── api/                # API routes
│   │   └── routes.py       # Endpoint definitions
│   ├── core/               # Core modules
│   │   ├── settings.py     # Configuration
│   │   └── dependencies.py # Security & validation
│   ├── socket_server.py    # Socket.IO server
│   └── main.py             # FastAPI app entry point
│
├── worker/                  # Celery Worker
│   ├── tasks/              # Task definitions
│   │   └── ai.py           # generate_and_verify_content
│   ├── ai/                 # AI logic
│   │   └── prompts.py      # LLM prompts
│   ├── tools/              # Utilities
│   │   ├── evidence_collection.py
│   │   └── search.py
│   ├── models/             # Data models
│   ├── core/               # Configuration
│   │   ├── celery_client.py
│   │   ├── ai.py           # LLM setup
│   │   └── database.py     # DB connection
│   └── celery_app.py       # Celery entry point
│
├── SDK/                     # Python SDK package (art_ai_sdk)
│   ├── art_ai_sdk/         # SDK source code
│   ├── pyproject.toml      # SDK package config
│   └── README.md           # SDK usage and API docs
│
├── docker-compose.yml       # Docker orchestration
├── README.md               # This file
└── DOCKER_QUICKSTART.md    # Docker quick reference
```

### Hot Reload

All services support hot-reload during development:

- **Frontend**: Bun dev server auto-reloads on file changes
- **Backend**: Uvicorn `--reload` watches Python files
- **Worker**: Watchdog monitors `*.py` files and auto-restarts Celery

Simply edit your code and save - changes apply automatically!

### Common Development Commands

```bash
# View logs
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f worker

# Restart a service
docker-compose restart worker

# Rebuild after dependency changes
docker-compose up -d --build

# Access database
docker-compose exec postgres psql -U artai_user -d artai

# Access Redis CLI
docker-compose exec redis redis-cli

# Run tests (if available)
cd frontend && bun test
cd backend && pytest
cd worker && pytest

# Generate database migrations
cd frontend && bun run drizzle:generate

# Apply migrations
docker-compose exec frontend bun run drizzle:push
```

---

## 📊 Database Schema

### Tables

#### `users` (Better Auth)
```sql
id              TEXT PRIMARY KEY
email           TEXT UNIQUE NOT NULL
name            TEXT
emailVerified   BOOLEAN DEFAULT FALSE
image           TEXT
createdAt       TIMESTAMP DEFAULT NOW()
updatedAt       TIMESTAMP DEFAULT NOW()
```

#### `chats`
```sql
id                 TEXT PRIMARY KEY
userId             TEXT REFERENCES users(id) ON DELETE CASCADE
title              TEXT
assistantThreadId  TEXT
isArchived         BOOLEAN DEFAULT FALSE
createdAt          TIMESTAMP DEFAULT NOW()
updatedAt          TIMESTAMP DEFAULT NOW()

INDEX: chats_userId_idx ON (userId)
```

#### `messages`
```sql
id         TEXT PRIMARY KEY
chatId     TEXT REFERENCES chats(id) ON DELETE CASCADE
userId     TEXT REFERENCES users(id) ON DELETE SET NULL
role       TEXT NOT NULL  -- 'user' | 'assistant'
content    TEXT NOT NULL
links      JSONB          -- Array of URLs
status     TEXT           -- 'completed' | 'failed' | 'pending'
taskId     TEXT           -- Celery task UUID
createdAt  TIMESTAMP DEFAULT NOW()
updatedAt  TIMESTAMP DEFAULT NOW()

INDEX: messages_chatId_idx ON (chatId)
INDEX: messages_taskId_idx ON (taskId)
```

---

## 🔌 API Reference

### REST Endpoints

#### `POST /api/chat/{chatId}/start`
Start a new fact-checking task.

**Headers:**
```
Content-Type: application/json
internal-shared-secret: <your-secret>
```

**Body:**
```json
{
  "prompt": "What are the health benefits of turmeric?",
  "userId": "user-uuid",
  "chatId": "chat-uuid"
}
```

**Response:**
```json
{
  "status": "queued",
  "taskId": "task-uuid-here"
}
```

#### `GET /api/tasks/{taskId}`
Get task status and progress.

**Response:**
```json
{
  "status": "IN_PROGRESS",
  "progress": 45,
  "step": "Collecting evidence...",
  "attempt": 1
}
```

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "ok": true
}
```

### Socket.IO Events

#### Client → Server

**`join_room_event`**
```javascript
socket.emit('join_room_event', { room: taskId })
```

#### Server → Client

**`task_update`**
```javascript
socket.on('task_update', (data) => {
  console.log(data)
  // {
  //   status: 'IN_PROGRESS',
  //   progress: 75,
  //   step: 'Verifying claims...',
  //   content: '...',
  //   claims: [...],
  //   evidence_links: [...]
  // }
})
```

---

## 🤖 How It Works

### The Verification Pipeline

```mermaid
graph TD
    A[User Prompt] --> B[Generate Response]
    B --> C[Classify Domain]
    C --> D{Domain Match?}
    D -->|No| B
    D -->|Yes| E[Extract Claims]
    E --> F[Generate Fact-Check Questions]
    F --> G[Collect Evidence from Trusted Sources]
    G --> H[Verify Claims]
    H --> I{>70% Verified?}
    I -->|No| J[Regenerate with Context]
    J --> B
    I -->|Yes| K[Return Verified Response]
    K --> L[Display with Citations]
```

### Example Workflow

1. **User asks**: "What are the symptoms of diabetes?"

2. **Domain Classification**: Healthcare (confidence: 0.95)

3. **Evidence Sources**: ICMR, WHO, NCBI, NIH

4. **Generated Response**:
   ```
   The main symptoms of diabetes include:
   - Frequent urination
   - Excessive thirst
   - Unexplained weight loss
   - Fatigue
   - Blurred vision
   ```

5. **Verification**: Each symptom cross-checked against medical sources

6. **Result**: 
   - ✅ All claims verified (100%)
   - 📚 5 citations from trusted sources
   - 🏆 High confidence score

---

## 🧪 Testing

```bash
# Frontend tests
cd frontend
bun test

# Backend tests
cd backend
pytest

# Worker tests
cd worker
pytest

# Integration tests
docker-compose exec frontend bun test:integration
```

---

## 🐛 Troubleshooting

### Port Already in Use

If you see port conflicts:
```bash
# PostgreSQL on 5434 (instead of 5432) to avoid conflicts
# Modify docker-compose.yml if needed

# Check what's using a port
sudo lsof -i :3000
sudo lsof -i :8000
```

### Worker Not Picking Up Tasks

```bash
# Check worker logs
docker-compose logs worker

# Verify Redis connection
docker-compose exec redis redis-cli ping
# Should return: PONG

# Check if task is registered
docker-compose exec worker uv run python -c "from celery_app import celery_app; print(list(celery_app.tasks.keys()))"
# Should include: 'generate_and_verify_content'
```

### Frontend pg Module Error

```bash
# Clear Next.js cache
cd frontend
rm -rf .next
docker-compose restart frontend
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U artai_user -d artai -c "SELECT 1;"

# Re-run migrations
docker-compose exec frontend bun run drizzle:push
```

---

## 📚 Documentation

- [Docker Quick Start Guide](./DOCKER_QUICKSTART.md) - Fast setup with Docker
- [Docker Documentation](./README.Docker.md) - Complete Docker reference
- [Frontend README](./frontend/README.md) - Next.js app details
- [Backend README](./backend/README.md) - FastAPI server details
- [Worker README](./worker/README.md) - Celery worker details
- [SDK README](./SDK/README.md) - Python SDK usage, API, and integration guide

---

## 🔐 Security

### Production Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Secrets Management**: Use environment-specific secrets
3. **CORS Configuration**: Update `parsed_cors_origins` in backend settings
4. **Database Security**: Use strong passwords, enable SSL
5. **API Rate Limiting**: Implement rate limiting on public endpoints
6. **Authentication**: Enable email verification in production

---

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production` for frontend
- [ ] Disable debug logs in backend and worker
- [ ] Configure production database with SSL
- [ ] Set up Redis with authentication
- [ ] Enable HTTPS/TLS certificates
- [ ] Configure CORS for production domain
- [ ] Set up monitoring (e.g., Sentry, DataDog)
- [ ] Enable backup strategy for PostgreSQL
- [ ] Scale worker instances based on load
- [ ] Configure CDN for static assets

### Docker Production Build

```bash
# Use production Dockerfiles (create separate docker-compose.prod.yml)
docker-compose -f docker-compose.prod.yml up -d

# Or build individual services
docker build -f frontend/Dockerfile -t artai-frontend:latest ./frontend
docker build -f backend/Dockerfile -t artai-backend:latest ./backend
docker build -f worker/Dockerfile -t artai-worker:latest ./worker
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Frontend**: ESLint + Prettier
- **Backend/Worker**: Black + isort

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Groq** for fast LLM inference
- **Firecrawl** for reliable web scraping
- **Better Auth** for modern authentication
- **Drizzle ORM** for type-safe database queries
- **FastAPI** for high-performance API framework
- **Next.js** for powerful React framework

---

<div align="center">

**Built with ❤️ for trustworthy AI**

[⬆ Back to Top](#art-ai-accessible-reliable-trustable-ai)

</div>
