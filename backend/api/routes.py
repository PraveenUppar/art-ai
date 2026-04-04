from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from api.schemas import StartTaskRequest, StartTaskResponse, TaskSnapshotResponse
from core.celery_client import enqueue_generate_and_verify
from core.redis_client import get_task_snapshot
from core.security import verify_internal_shared_secret


router = APIRouter(prefix="/api", tags=["tasks"])


@router.post(
    "/chat/{chat_id}/start",
    response_model=StartTaskResponse,
    dependencies=[Depends(verify_internal_shared_secret)],
)
async def start_chat_task(chat_id: str, payload: StartTaskRequest):
    task_id = str(uuid4())
    enqueue_generate_and_verify(
        task_id=task_id,
        chat_id=chat_id,
        user_prompt=payload.user_prompt,
        user_id=payload.user_id,
    )
    return StartTaskResponse(task_id=task_id, chat_id=chat_id, status="queued")


@router.get(
    "/tasks/{task_id}",
    response_model=TaskSnapshotResponse,
    dependencies=[Depends(verify_internal_shared_secret)],
)
async def read_task_snapshot(task_id: str):
    snapshot = get_task_snapshot(task_id)
    if snapshot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task snapshot not found",
        )
    return TaskSnapshotResponse(task_id=task_id, snapshot=snapshot)
