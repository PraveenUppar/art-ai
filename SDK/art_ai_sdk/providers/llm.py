from typing import Any, Callable, Protocol

from langchain_groq import ChatGroq
from pydantic import BaseModel, SecretStr

from ..config import SDKSettings


class LLMProvider(Protocol):
    def invoke(
        self,
        prompt: str,
        response_format: type[BaseModel] | None = None,
    ) -> Any: ...


class GroqLLMProvider:
    def __init__(self, *, api_key: str, model: str):
        self._client = ChatGroq(api_key=SecretStr(api_key), model=model)

    def invoke(
        self,
        prompt: str,
        response_format: type[BaseModel] | None = None,
    ) -> Any:
        if response_format is None:
            return self._client.invoke(prompt)
        return self._client.with_structured_output(
            response_format, method="json_schema"
        ).invoke(prompt)


class CallableLLMProvider:
    def __init__(
        self,
        invoke_fn: Callable[[str, type[BaseModel] | None], Any],
    ):
        self._invoke_fn = invoke_fn

    def invoke(
        self,
        prompt: str,
        response_format: type[BaseModel] | None = None,
    ) -> Any:
        return self._invoke_fn(prompt, response_format)


def build_default_llm_provider(settings: SDKSettings | None = None) -> LLMProvider:
    resolved = settings or SDKSettings()
    if not resolved.groq_api_key:
        raise ValueError(
            "groq_api_key is required. Pass an explicit provider or set GROQ_API_KEY."
        )
    return GroqLLMProvider(api_key=resolved.groq_api_key, model=resolved.groq_model)
