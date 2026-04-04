from typing import Any, Protocol


class ProgressCallback(Protocol):
    def emit(self, task_id: str, payload: dict[str, Any]) -> None: ...


class NoOpProgressCallback:
    def emit(self, task_id: str, payload: dict[str, Any]) -> None:
        return


class InMemoryProgressCallback:
    def __init__(self):
        self.events: list[dict[str, Any]] = []

    def emit(self, task_id: str, payload: dict[str, Any]) -> None:
        self.events.append({"task_id": task_id, **payload})


class PersistenceHook(Protocol):
    def persist(
        self,
        *,
        task_id: str,
        chat_id: str,
        user_id: str | None,
        user_prompt: str,
        assistant_response: str,
        status: str,
    ) -> None: ...


class NoOpPersistenceHook:
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
        return
