import asyncio
from typing import Any

from . import pipeline as _pipeline
from .callbacks import PersistenceHook, ProgressCallback
from .config import SDKSettings
from .models import (
    ClassificationResult,
    DomainType,
    FactCheckItem,
    FactCheckResult,
    LinkCheckResult,
)
from .providers import LLMProvider, SearchProvider


class ArtAIClient:
    def __init__(
        self,
        *,
        settings: SDKSettings | None = None,
        llm_provider: LLMProvider | None = None,
        search_provider: SearchProvider | None = None,
        progress_callback: ProgressCallback | None = None,
        persistence_hook: PersistenceHook | None = None,
    ):
        self.settings = settings
        self.llm_provider = llm_provider
        self.search_provider = search_provider
        self.progress_callback = progress_callback
        self.persistence_hook = persistence_hook

    def classify_content_relevance(
        self,
        user_prompt: str,
        content: str,
        *,
        domain_map: dict[DomainType, list[str]] | None = None,
    ) -> ClassificationResult:
        return _pipeline.classify_content_relevance(
            user_prompt,
            content,
            llm_provider=self.llm_provider,
            settings=self.settings,
            domain_map=domain_map,
        )

    def generate_fact_check_questions(
        self,
        user_prompt: str,
        claim_text: str,
    ) -> FactCheckResult:
        return _pipeline.generate_fact_check_questions(
            user_prompt,
            claim_text,
            llm_provider=self.llm_provider,
            settings=self.settings,
        )

    def collect_evidence(
        self,
        questions: list[FactCheckItem | dict[str, Any]],
        domains: list[DomainType | str],
        *,
        domain_map: dict[DomainType, list[str]] | None = None,
        max_workers: int | None = None,
        evidence_output_path: str | None = _pipeline.DEFAULT_EVIDENCE_OUTPUT_PATH,
    ) -> list[dict[str, str]]:
        return _pipeline.collect_evidence(
            questions,
            domains,
            search_provider=self.search_provider,
            settings=self.settings,
            domain_map=domain_map,
            max_workers=max_workers,
            evidence_output_path=evidence_output_path,
        )

    def check_relevance(
        self,
        user_prompt: str,
        claim: str,
        evidence: list[dict[str, str]] | dict[str, str],
    ) -> LinkCheckResult:
        return _pipeline.check_relevance(
            user_prompt,
            claim,
            evidence,
            llm_provider=self.llm_provider,
            settings=self.settings,
        )

    def process(
        self,
        *,
        task_id: str,
        user_prompt: str,
        chat_id: str | None = None,
        user_id: str | None = None,
        iterations: int = 3,
        domain_map: dict[DomainType, list[str]] | None = None,
        max_workers: int | None = None,
        evidence_output_path: str | None = _pipeline.DEFAULT_EVIDENCE_OUTPUT_PATH,
    ) -> dict[str, Any]:
        return _pipeline.generate_and_verify_content(
            task_id=task_id,
            user_prompt=user_prompt,
            chat_id=chat_id,
            user_id=user_id,
            llm_provider=self.llm_provider,
            search_provider=self.search_provider,
            settings=self.settings,
            progress_callback=self.progress_callback,
            persistence_hook=self.persistence_hook,
            iterations=iterations,
            domain_map=domain_map,
            max_workers=max_workers,
            evidence_output_path=evidence_output_path,
        )


class AsyncArtAIClient:
    def __init__(
        self,
        *,
        settings: SDKSettings | None = None,
        llm_provider: LLMProvider | None = None,
        search_provider: SearchProvider | None = None,
        progress_callback: ProgressCallback | None = None,
        persistence_hook: PersistenceHook | None = None,
    ):
        self._client = ArtAIClient(
            settings=settings,
            llm_provider=llm_provider,
            search_provider=search_provider,
            progress_callback=progress_callback,
            persistence_hook=persistence_hook,
        )

    async def classify_content_relevance(
        self,
        user_prompt: str,
        content: str,
        *,
        domain_map: dict[DomainType, list[str]] | None = None,
    ) -> ClassificationResult:
        return await asyncio.to_thread(
            self._client.classify_content_relevance,
            user_prompt,
            content,
            domain_map=domain_map,
        )

    async def generate_fact_check_questions(
        self,
        user_prompt: str,
        claim_text: str,
    ) -> FactCheckResult:
        return await asyncio.to_thread(
            self._client.generate_fact_check_questions,
            user_prompt,
            claim_text,
        )

    async def collect_evidence(
        self,
        questions: list[FactCheckItem | dict[str, Any]],
        domains: list[DomainType | str],
        *,
        domain_map: dict[DomainType, list[str]] | None = None,
        max_workers: int | None = None,
        evidence_output_path: str | None = _pipeline.DEFAULT_EVIDENCE_OUTPUT_PATH,
    ) -> list[dict[str, str]]:
        return await asyncio.to_thread(
            self._client.collect_evidence,
            questions,
            domains,
            domain_map=domain_map,
            max_workers=max_workers,
            evidence_output_path=evidence_output_path,
        )

    async def check_relevance(
        self,
        user_prompt: str,
        claim: str,
        evidence: list[dict[str, str]] | dict[str, str],
    ) -> LinkCheckResult:
        return await asyncio.to_thread(
            self._client.check_relevance,
            user_prompt,
            claim,
            evidence,
        )

    async def process(
        self,
        *,
        task_id: str,
        user_prompt: str,
        chat_id: str | None = None,
        user_id: str | None = None,
        iterations: int = 3,
        domain_map: dict[DomainType, list[str]] | None = None,
        max_workers: int | None = None,
        evidence_output_path: str | None = _pipeline.DEFAULT_EVIDENCE_OUTPUT_PATH,
    ) -> dict[str, Any]:
        return await asyncio.to_thread(
            self._client.process,
            task_id=task_id,
            user_prompt=user_prompt,
            chat_id=chat_id,
            user_id=user_id,
            iterations=iterations,
            domain_map=domain_map,
            max_workers=max_workers,
            evidence_output_path=evidence_output_path,
        )
