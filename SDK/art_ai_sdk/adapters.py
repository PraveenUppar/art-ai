import json
from datetime import datetime, timezone
from uuid import uuid4

from .callbacks import PersistenceHook, ProgressCallback


class RedisProgressAdapter(ProgressCallback):
    def __init__(
        self,
        *,
        redis_url: str,
        ttl_seconds: int = 3600,
        event_name: str = "task_update",
    ):
        try:
            import socketio
            from redis import Redis
        except ImportError as exc:
            raise ImportError(
                "RedisProgressAdapter requires infra dependencies. Install with: pip install -e './SDK[infra]'"
            ) from exc

        self._redis_client = Redis.from_url(redis_url)
        self._socketio_manager = socketio.RedisManager(redis_url, write_only=True)
        self._ttl_seconds = ttl_seconds
        self._event_name = event_name

    def emit(self, task_id: str, payload: dict) -> None:
        channel = f"task_updates:{task_id}"
        try:
            self._redis_client.setex(channel, self._ttl_seconds, json.dumps(payload))
        except Exception:
            pass
        self._socketio_manager.emit(self._event_name, payload, room=task_id)

    def get_task_snapshot(self, task_id: str) -> dict | None:
        raw = self._redis_client.get(f"task_updates:{task_id}")
        if not raw:
            return None
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8")
        try:
            parsed = json.loads(raw)
            return (
                parsed
                if isinstance(parsed, dict)
                else {"task_id": task_id, "data": parsed}
            )
        except Exception:
            return {"task_id": task_id, "raw": str(raw)}


class SQLAlchemyPersistenceAdapter(PersistenceHook):
    def __init__(self, *, database_url: str):
        try:
            from sqlalchemy import MetaData, create_engine
            from sqlalchemy.engine import Engine
        except ImportError as exc:
            raise ImportError(
                "SQLAlchemyPersistenceAdapter requires infra dependencies. Install with: pip install -e './SDK[infra]'"
            ) from exc

        self._MetaData = MetaData
        self._create_engine = create_engine
        self._Engine = Engine

        if (
            database_url.startswith("postgresql://")
            and "+" not in database_url.split("://", 1)[0]
        ):
            database_url = database_url.replace(
                "postgresql://", "postgresql+psycopg://", 1
            )

        self._database_url = database_url
        self._engine: Engine | None = None
        self._metadata: MetaData | None = None

    def _get_engine(self):
        if self._engine is None:
            self._engine = self._create_engine(self._database_url, future=True)
        return self._engine

    def _get_metadata(self):
        if self._metadata is None:
            metadata = self._MetaData()
            metadata.reflect(bind=self._get_engine())
            self._metadata = metadata
        return self._metadata

    def _get_table(self, name: str):
        return self._get_metadata().tables.get(name)

    def persist(
        self,
        *,
        task_id: str,
        chat_id: str,
        user_id: str | None,
        user_prompt: str,
        assistant_response: str,
        status: str,
    ) -> None:
        from sqlalchemy import select

        chats_table = self._get_table("chats")
        messages_table = self._get_table("messages")

        if chats_table is None:
            return

        now = datetime.now(timezone.utc)

        with self._get_engine().begin() as conn:
            conn.execute(
                chats_table.update()
                .where(chats_table.c.id == chat_id)
                .values(
                    title=(user_prompt[:120] if user_prompt else "New chat"),
                    assistant_thread_id=task_id,
                    updated_at=now,
                )
            )

            if messages_table is None:
                return

            has_user_message = conn.execute(
                select(messages_table.c.id).where(
                    messages_table.c.chat_id == chat_id,
                    messages_table.c.role == "user",
                    messages_table.c.content == user_prompt,
                )
            ).first()

            if not has_user_message:
                conn.execute(
                    messages_table.insert().values(
                        id=str(uuid4()),
                        chat_id=chat_id,
                        user_id=user_id,
                        role="user",
                        content=user_prompt,
                        status="completed",
                        task_id=task_id,
                        created_at=now,
                        updated_at=now,
                    )
                )

            conn.execute(
                messages_table.insert().values(
                    id=str(uuid4()),
                    chat_id=chat_id,
                    user_id=user_id,
                    role="assistant",
                    content=assistant_response,
                    status=status,
                    task_id=task_id,
                    created_at=now,
                    updated_at=now,
                )
            )


class CeleryTaskAdapter:
    def __init__(
        self,
        *,
        broker_url: str,
        result_backend: str | None = None,
        task_name: str = "generate_and_verify_content",
        app_name: str = "art_ai_sdk",
    ):
        try:
            from celery import Celery
        except ImportError as exc:
            raise ImportError(
                "CeleryTaskAdapter requires infra dependencies. Install with: pip install -e './SDK[infra]'"
            ) from exc

        self._app = Celery(
            app_name,
            broker=broker_url,
            backend=result_backend or broker_url,
        )
        self._task_name = task_name

    def submit(
        self,
        *,
        task_id: str,
        user_prompt: str,
        chat_id: str | None = None,
        user_id: str | None = None,
    ):
        return self._app.send_task(
            self._task_name,
            args=(task_id, user_prompt, chat_id, user_id),
            task_id=task_id,
        )
