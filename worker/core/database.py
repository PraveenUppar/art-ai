from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import MetaData, Table, create_engine, select
from sqlalchemy.engine import Engine

from core.settings import settings


_engine: Engine | None = None
_metadata: MetaData | None = None


def get_engine() -> Engine:
    global _engine
    if _engine is None:
        database_url = settings.database_url
        if (
            database_url.startswith("postgresql://")
            and "+" not in database_url.split("://", 1)[0]
        ):
            database_url = database_url.replace(
                "postgresql://", "postgresql+psycopg://", 1
            )

        _engine = create_engine(database_url, future=True)
    return _engine


def get_metadata() -> MetaData:
    global _metadata
    if _metadata is None:
        metadata = MetaData()
        metadata.reflect(bind=get_engine())
        _metadata = metadata
    return _metadata


def get_reflected_table(name: str) -> Table | None:
    metadata = get_metadata()
    return metadata.tables.get(name)


def persist_chat_result(
    *,
    task_id: str,
    chat_id: str,
    user_id: str | None,
    user_prompt: str,
    assistant_response: str,
    assistant_links: list[str] | None = None,
    status: str,
) -> None:
    chats_table = get_reflected_table("chats")
    messages_table = get_reflected_table("messages")

    if chats_table is None:
        return

    now = datetime.now(timezone.utc)

    with get_engine().begin() as conn:
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
            user_message_values = {
                "id": str(uuid4()),
                "chat_id": chat_id,
                "user_id": user_id,
                "role": "user",
                "content": user_prompt,
                "status": "completed",
                "task_id": task_id,
                "created_at": now,
                "updated_at": now,
            }
            if "links" in messages_table.c:
                user_message_values["links"] = []
            conn.execute(messages_table.insert().values(**user_message_values))

        assistant_message_values = {
            "id": str(uuid4()),
            "chat_id": chat_id,
            "user_id": user_id,
            "role": "assistant",
            "content": assistant_response,
            "status": status,
            "task_id": task_id,
            "created_at": now,
            "updated_at": now,
        }
        if "links" in messages_table.c:
            assistant_message_values["links"] = assistant_links or []
        conn.execute(messages_table.insert().values(**assistant_message_values))
