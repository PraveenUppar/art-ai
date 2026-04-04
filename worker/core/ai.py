from __future__ import annotations

import random
import threading
import time

from core.settings import settings
from langchain_groq import ChatGroq
from pydantic import SecretStr


_rate_lock = threading.Lock()
_next_allowed_call_at = 0.0


def _is_rate_limit_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return "429" in text or "rate limit" in text or "too many requests" in text


def _wait_for_rate_slot() -> None:
    global _next_allowed_call_at
    min_interval = max(settings.groq_min_interval_seconds, 0.0)
    if min_interval <= 0:
        return

    with _rate_lock:
        now = time.monotonic()
        wait_seconds = _next_allowed_call_at - now
        if wait_seconds > 0:
            time.sleep(wait_seconds)
            now = time.monotonic()
        _next_allowed_call_at = now + min_interval


class RateLimitedLLM:
    def __init__(self, model):
        self._model = model

    def with_structured_output(self, *args, **kwargs) -> "RateLimitedLLM":
        return RateLimitedLLM(self._model.with_structured_output(*args, **kwargs))

    def invoke(self, *args, **kwargs):
        max_retries = max(settings.groq_rate_limit_retries, 0)
        base_delay = max(settings.groq_retry_base_delay_seconds, 0.1)
        jitter = max(settings.groq_retry_jitter_seconds, 0.0)

        for attempt in range(max_retries + 1):
            _wait_for_rate_slot()
            try:
                return self._model.invoke(*args, **kwargs)
            except Exception as exc:
                if not _is_rate_limit_error(exc) or attempt >= max_retries:
                    raise
                backoff = (base_delay * (2**attempt)) + random.uniform(0, jitter)
                time.sleep(backoff)

        # Unreachable, kept to satisfy static analyzers.
        raise RuntimeError("LLM invoke failed after retries")

    def __getattr__(self, name):
        return getattr(self._model, name)


def get_llm(response_format=None):
    model = ChatGroq(
        api_key=SecretStr(settings.groq_api_key),
        model=settings.groq_model,
    )
    wrapped = RateLimitedLLM(model)
    if response_format:
        return wrapped.with_structured_output(response_format, method="json_schema")
    return wrapped


# def get_llm(response_format=None):
#     model = ChatGoogleGenerativeAI(
#         api_key=SecretStr(settings.gemini_api_key),
#         model=settings.gemini_model,

#     )
#     if response_format:
#         return model.with_structured_output(response_format, method="json_schema", )
#     return model
