from celery import Celery

from core.settings import settings


celery_app = Celery(
    "backend",
    broker=settings.broker_url,
    backend=settings.result_backend,
)


def enqueue_generate_and_verify(
    *,
    task_id: str,
    chat_id: str,
    user_prompt: str,
    user_id: str,
):
    return celery_app.send_task(
        "generate_and_verify_content",
        args=(task_id, user_prompt, chat_id, user_id),
        task_id=task_id,
    )
