from pydantic import BaseModel, Field


class StartTaskRequest(BaseModel):
    user_prompt: str = Field(min_length=1, max_length=12000)
    user_id: str = Field(min_length=1, max_length=255)


class StartTaskResponse(BaseModel):
    task_id: str
    chat_id: str
    status: str


class TaskSnapshotResponse(BaseModel):
    task_id: str
    snapshot: dict | None
