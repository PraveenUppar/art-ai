import socketio

from core.settings import settings


sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.parsed_cors_origins,
    client_manager=socketio.AsyncRedisManager(settings.redis_url),
)


@sio.event
async def connect(sid, environ, auth):
    return True


@sio.event
async def disconnect(sid):
    return None


@sio.event
async def join_room_event(sid, data):
    room = None
    if isinstance(data, dict):
        room = data.get("room")
    if not room:
        return {"ok": False, "message": "Missing room"}

    await sio.enter_room(sid, room)
    return {"ok": True, "room": room}
