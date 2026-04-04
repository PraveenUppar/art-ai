import json

from redis import Redis
from core.settings import settings
import socketio

TASK_UPDATE_TTL_SECONDS = 3600  # 1 hour


redis_client = Redis.from_url(settings.redis_url)
socketio_redis_manager = socketio.RedisManager(settings.redis_url, write_only=True)


def store_task_snapshot(task_id: str, payload: dict):
    channel = f"task_updates:{task_id}"
    redis_client.setex(channel, TASK_UPDATE_TTL_SECONDS, json.dumps(payload))


def get_task_snapshot(task_id: str) -> dict | None:
    raw = redis_client.get(f"task_updates:{task_id}")
    if not raw:
        return None
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8")
    try:
        parsed = json.loads(raw)
        return (
            parsed if isinstance(parsed, dict) else {"task_id": task_id, "data": parsed}
        )
    except Exception:
        return {"task_id": task_id, "raw": str(raw)}


def emit_task_update(task_id: str, payload: dict):
    try:
        store_task_snapshot(task_id, payload)
    except Exception as exc:
        print(f"Failed to emit task update for task_id: {task_id}\nError: {exc}")
    socketio_redis_manager.emit("task_update", payload, room=task_id)
