from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from api.routes import router as tasks_router
from core.settings import settings
from socket_server import sio


http_app = FastAPI(title="art-ai backend", version="0.1.0")

http_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@http_app.get("/health", tags=["health"])
async def health_check():
    return {"ok": True}


http_app.include_router(tasks_router)
app = socketio.ASGIApp(sio, other_asgi_app=http_app, socketio_path="socket.io")
