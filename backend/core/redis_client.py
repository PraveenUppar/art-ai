import json
from redis import Redis

from core.settings import settings


redis_client = Redis.from_url(settings.redis_url, decode_responses=True)


def get_task_snapshot(task_id: str) -> dict | None:
    raw = redis_client.get(f"task_updates:{task_id}")
    if not raw:
        return None
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {"task_id": task_id, "raw": raw}

    if isinstance(data, dict):
        return data
    return {"task_id": task_id, "data": data}
