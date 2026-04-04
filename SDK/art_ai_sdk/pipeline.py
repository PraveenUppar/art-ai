import json
import random
import re
from concurrent.futures import ThreadPoolExecutor
from threading import Lock
from time import perf_counter, sleep
from typing import Any

from .callbacks import (
    NoOpPersistenceHook,
    NoOpProgressCallback,
    PersistenceHook,
    ProgressCallback,
)
from .config import SDKSettings
from .context import extract_text_content
from .models import (
    DOMAIN_MAP,
    ClassificationResult,
    DomainType,
    FactCheckItem,
    FactCheckResult,
    LinkCheckClaims,
    LinkCheckResult,
    Status,
    TaskStatus,
)
from .prompts import (
    DOMAIN_AGENT_PROMPT,
    FACT_QUESTION_GENERATION_PROMPT,
    LINKS_AGENT_PROMPT,
    get_contextual_prompt,
    get_failed_ratio_prompt,
)
from .providers import (
    LLMProvider,
    SearchProvider,
    build_default_llm_provider,
    build_default_search_provider,
)

DEFAULT_EVIDENCE_OUTPUT_PATH = "evidence_chunks.json"


def _get_or_create_settings(settings: SDKSettings | None) -> SDKSettings:
    return settings or SDKSettings()


def _resolve_llm_provider(
    llm_provider: LLMProvider | None,
    settings: SDKSettings | None,
) -> LLMProvider:
    if llm_provider is not None:
        return llm_provider
    return build_default_llm_provider(_get_or_create_settings(settings))


def _resolve_search_provider(
    search_provider: SearchProvider | None,
    settings: SDKSettings | None,
) -> SearchProvider:
    if search_provider is not None:
        return search_provider
    return build_default_search_provider(_get_or_create_settings(settings))


def _resolve_max_workers(max_workers: int | None, settings: SDKSettings | None) -> int:
    if max_workers is not None:
        return max(1, max_workers)
    if settings is not None:
        return max(1, settings.max_workers)
    return 10


def _emit_progress(
    callback: ProgressCallback,
    task_id: str,
    payload: dict[str, Any],
) -> None:
    try:
        callback.emit(task_id, payload)
    except Exception:
        return


def _normalize_query_text(text: str, max_len: int = 180) -> str:
    cleaned = text.replace("\n", " ").replace("\r", " ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if len(cleaned) > max_len:
        cleaned = cleaned[:max_len].rsplit(" ", 1)[0]
    return cleaned


def _to_domain(domain: DomainType | str) -> DomainType | None:
    if isinstance(domain, DomainType):
        return domain
    if isinstance(domain, str):
        normalized = domain.strip().lower()
        for member in DomainType:
            if member.value == normalized:
                return member
    return None


def build_queries(topic_x: str, domains: list[str]) -> list[str]:
    topic = _normalize_query_text(topic_x)
    queries = [f"{topic} latest update India"]
    queries.extend(f"{topic} site:{domain}" for domain in domains[:6])
    return queries


def _safe_search(
    search_provider: SearchProvider,
    query: str,
    *,
    max_results: int = 5,
    retries: int = 4,
) -> list[dict]:
    for attempt in range(retries + 1):
        try:
            return search_provider.search(query, max_results=max_results)
        except Exception as exc:
            if attempt == retries:
                print(f"Search failed for query: {query}\\nError: {exc}")
                return []
            backoff = min(6.0, (0.8 * (2**attempt)) + random.uniform(0.1, 0.6))
            sleep(backoff)
    return []


def collect_evidence_with_domains(
    topic: str,
    domains: list[str],
    *,
    search_provider: SearchProvider | None = None,
    settings: SDKSettings | None = None,
) -> dict[str, str]:
    provider = _resolve_search_provider(search_provider, settings)
    queries = build_queries(topic, [domain for domain in domains])
    evidence_chunks: dict[str, str] = {}

    for query in queries:
        search_results = _safe_search(provider, query)
        formulated_results = []
        for result in search_results:
            title = result.get("title", "")
            url = result.get("link")
            snippet = result.get("snippet", "")
            formulated_result = f"Title: {title}\nURL: {url}\nSnippet: {snippet}"
            formulated_results.append(formulated_result)
        evidence_chunks[query] = "\n".join(formulated_results)
    return evidence_chunks


def _process_single_question(
    *,
    domain: DomainType,
    question: FactCheckItem,
    search_provider: SearchProvider,
    domain_map: dict[DomainType, list[str]],
) -> dict[str, str] | None:
    allowed_sites = domain_map.get(domain, [])
    if not allowed_sites:
        return None

    sites = " OR site:".join(allowed_sites)
    base_question = _normalize_query_text(question.question, max_len=140)
    query = f"{base_question} site:{sites}"
    aggregated_results = _safe_search(search_provider, query)

    if not aggregated_results:
        fallback_query = f"{base_question} healthcare evidence"
        aggregated_results = _safe_search(search_provider, fallback_query)

    formulated_results = []
    for result in aggregated_results[:5]:
        title = result.get("title", "")
        url = result.get("link")
        snippet = result.get("snippet", "")
        formulated_results.append(f"Title: {title}\nURL: {url}\nSnippet: {snippet}")

    return {
        "question": question.question,
        "expected_answer": question.expected_answer,
        "domain": domain.value,
        "evidence": "\n".join(formulated_results),
    }


def collect_evidence(
    questions: list[FactCheckItem | dict[str, Any]],
    domains: list[DomainType | str],
    *,
    search_provider: SearchProvider | None = None,
    settings: SDKSettings | None = None,
    domain_map: dict[DomainType, list[str]] | None = None,
    max_workers: int | None = None,
    evidence_output_path: str | None = DEFAULT_EVIDENCE_OUTPUT_PATH,
) -> list[dict[str, str]]:
    provider = _resolve_search_provider(search_provider, settings)
    resolved_domain_map = domain_map or DOMAIN_MAP
    resolved_workers = _resolve_max_workers(max_workers, settings)

    normalized_questions = [FactCheckItem.model_validate(item) for item in questions]
    normalized_domains = [
        parsed
        for parsed in (_to_domain(item) for item in domains)
        if parsed is not None
    ]

    if not normalized_questions or not normalized_domains:
        return []

    start = perf_counter()
    evidences: list[dict[str, str]] = []
    lock = Lock()

    def process_and_append(domain: DomainType, question: FactCheckItem) -> None:
        result = _process_single_question(
            domain=domain,
            question=question,
            search_provider=provider,
            domain_map=resolved_domain_map,
        )
        if result is not None:
            with lock:
                evidences.append(result)

    pair_count = len(normalized_domains) * len(normalized_questions)
    worker_count = max(1, min(resolved_workers, pair_count))

    futures = []
    with ThreadPoolExecutor(max_workers=worker_count) as executor:
        for domain in normalized_domains:
            for question in normalized_questions:
                future = executor.submit(process_and_append, domain, question)
                futures.append(future)

        for future in futures:
            future.result()

    if evidence_output_path:
        with open(evidence_output_path, "w", encoding="utf-8") as file:
            json.dump(evidences, file, indent=2)

    print(f"time taken to collect evidence: {perf_counter() - start}")
    return evidences


def classify_content_relevance(
    user_prompt: str,
    content: str,
    *,
    llm_provider: LLMProvider | None = None,
    settings: SDKSettings | None = None,
    domain_map: dict[DomainType, list[str]] | None = None,
) -> ClassificationResult:
    provider = _resolve_llm_provider(llm_provider, settings)
    active_domain_map = domain_map or DOMAIN_MAP

    prompt = DOMAIN_AGENT_PROMPT.format(
        user_prompt=user_prompt,
        content=content,
        domain_map=active_domain_map,
    )
    response = provider.invoke(prompt, response_format=ClassificationResult)
    return ClassificationResult.model_validate(response)


def generate_fact_check_questions(
    user_prompt: str,
    claim_text: str,
    *,
    llm_provider: LLMProvider | None = None,
    settings: SDKSettings | None = None,
) -> FactCheckResult:
    provider = _resolve_llm_provider(llm_provider, settings)
    prompt = FACT_QUESTION_GENERATION_PROMPT.format(
        user_prompt=user_prompt,
        claim_text=claim_text,
    )
    response = provider.invoke(prompt, response_format=FactCheckResult)
    return FactCheckResult.model_validate(response)


def _compact_evidence(
    evidence: list[dict[str, str]] | None,
    max_items: int = 4,
    max_chars: int = 900,
) -> list[dict[str, str]]:
    compacted: list[dict[str, str]] = []
    for item in (evidence or [])[:max_items]:
        text = item.get("evidence", "") if isinstance(item, dict) else ""
        compacted.append(
            {
                "question": item.get("question", "") if isinstance(item, dict) else "",
                "expected_answer": (
                    item.get("expected_answer", "") if isinstance(item, dict) else ""
                ),
                "domain": item.get("domain", "") if isinstance(item, dict) else "",
                "evidence": text[:max_chars],
            }
        )
    return compacted


def check_link_relevance(
    user_prompt: str,
    evidence: dict[str, str],
    claim: str,
    *,
    llm_provider: LLMProvider | None = None,
    settings: SDKSettings | None = None,
) -> LinkCheckResult:
    provider = _resolve_llm_provider(llm_provider, settings)
    prompt = LINKS_AGENT_PROMPT.format(
        user_prompt=user_prompt,
        claim_text=claim,
        evidence=evidence,
    )
    response = provider.invoke(prompt, response_format=LinkCheckResult)
    return LinkCheckResult.model_validate(response)


def check_relevance(
    user_prompt: str,
    claim: str,
    evidence: list[dict[str, str]] | dict[str, str],
    *,
    llm_provider: LLMProvider | None = None,
    settings: SDKSettings | None = None,
) -> LinkCheckResult:
    provider = _resolve_llm_provider(llm_provider, settings)
    prompt = LINKS_AGENT_PROMPT.format(
        user_prompt=user_prompt,
        claim_text=claim,
        evidence=evidence,
    )
    try:
        response = provider.invoke(prompt, response_format=LinkCheckResult)
        return LinkCheckResult.model_validate(response)
    except Exception:
        compacted = _compact_evidence(
            evidence if isinstance(evidence, list) else [evidence],
        )
        fallback_prompt = LINKS_AGENT_PROMPT.format(
            user_prompt=user_prompt,
            claim_text=claim,
            evidence=compacted,
        )
        fallback_response = provider.invoke(
            fallback_prompt,
            response_format=LinkCheckResult,
        )
        return LinkCheckResult.model_validate(fallback_response)


def generate_and_verify_content(
    task_id: str,
    user_prompt: str,
    chat_id: str | None = None,
    user_id: str | None = None,
    *,
    llm_provider: LLMProvider | None = None,
    search_provider: SearchProvider | None = None,
    settings: SDKSettings | None = None,
    progress_callback: ProgressCallback | None = None,
    persistence_hook: PersistenceHook | None = None,
    iterations: int = 3,
    domain_map: dict[DomainType, list[str]] | None = None,
    max_workers: int | None = None,
    evidence_output_path: str | None = DEFAULT_EVIDENCE_OUTPUT_PATH,
) -> dict[str, Any]:
    provider = _resolve_llm_provider(llm_provider, settings)
    search = _resolve_search_provider(search_provider, settings)
    progress = progress_callback or NoOpProgressCallback()
    persistence = persistence_hook or NoOpPersistenceHook()
    active_domain_map = domain_map or DOMAIN_MAP

    def emit(status: TaskStatus, message: str, **extra):
        payload = {
            "task_id": task_id,
            "chat_id": chat_id,
            "status": status.value,
            "message": message,
            **extra,
        }
        _emit_progress(progress, task_id, payload)

    _emit_progress(
        progress,
        task_id,
        {
            "task_id": task_id,
            "chat_id": chat_id,
            "status": TaskStatus.PENDING.value,
            "message": "Starting content generation and verification...",
            "progress": 0,
            "step": "init",
        },
    )

    skip_domain_check_next = False
    cached_domains: set[DomainType] | None = None
    current_prompt = user_prompt
    final_text_content = ""
    final_relevance_results: LinkCheckResult | None = None

    tries_left = max(1, iterations)

    try:
        while tries_left > 0:
            attempt = (max(1, iterations) + 1) - tries_left
            contextual_prompt = get_contextual_prompt(current_prompt)
            emit(
                TaskStatus.IN_PROGRESS,
                f"Generating output (attempt {attempt}/{max(1, iterations)})...",
                progress=10,
                step="generation",
                attempt=attempt,
            )

            output = provider.invoke(contextual_prompt)
            text_content = extract_text_content(output)
            if not text_content.strip():
                emit(
                    TaskStatus.IN_PROGRESS,
                    "Generated output is empty. Regenerating...",
                    progress=15,
                    step="generation_retry",
                    attempt=attempt,
                )
                tries_left -= 1
                continue

            if skip_domain_check_next and cached_domains:
                domains = list(cached_domains)
                skip_domain_check_next = False
            else:
                emit(
                    TaskStatus.IN_PROGRESS,
                    "Classifying domain relevance...",
                    progress=25,
                    step="domain_classification",
                    attempt=attempt,
                )
                classification_result = classify_content_relevance(
                    contextual_prompt,
                    text_content,
                    llm_provider=provider,
                    domain_map=active_domain_map,
                )
                if (
                    not classification_result.is_relevant
                    or classification_result.confidence_score < 0.5
                    or not classification_result.domain_match
                ):
                    emit(
                        TaskStatus.IN_PROGRESS,
                        "Content is not relevant. Regenerating...",
                        progress=30,
                        step="domain_retry",
                        attempt=attempt,
                    )
                    tries_left -= 1
                    continue

                domains = [classification_result.content_domain]
                if (
                    classification_result.confidence_score < 0.7
                    and classification_result.alternate_domain is not None
                ):
                    domains.append(classification_result.alternate_domain)

                cached_domains = set(domains)

            emit(
                TaskStatus.IN_PROGRESS,
                "Generating fact-check questions...",
                progress=45,
                step="fact_questions",
                attempt=attempt,
            )
            fact_check_questions = generate_fact_check_questions(
                contextual_prompt,
                text_content,
                llm_provider=provider,
            )

            emit(
                TaskStatus.IN_PROGRESS,
                "Collecting evidence...",
                progress=60,
                step="evidence_collection",
                attempt=attempt,
            )
            evidence = collect_evidence(
                fact_check_questions.FactCheckQuestions,
                domains,
                search_provider=search,
                domain_map=active_domain_map,
                max_workers=max_workers,
                evidence_output_path=evidence_output_path,
            )

            emit(
                TaskStatus.IN_PROGRESS,
                "Checking evidence relevance...",
                progress=80,
                step="evidence_relevance",
                attempt=attempt,
            )
            relevance_results = check_relevance(
                contextual_prompt,
                text_content,
                evidence,
                llm_provider=provider,
            )

            total_claims = len(relevance_results.claims)
            failed_claims: list[LinkCheckClaims] = [
                claim
                for claim in relevance_results.claims
                if claim.status == Status.UNVERIFIED
            ]
            failed_ratio = (len(failed_claims) / total_claims) if total_claims else 1.0

            if failed_ratio > 0.7:
                failed_summary = "\n".join(
                    f"- {claim.claim_text} | reason: {claim.reason}"
                    for claim in failed_claims[:8]
                )
                current_prompt = get_failed_ratio_prompt(
                    user_prompt,
                    failed_claims,
                    failed_summary,
                )
                emit(
                    TaskStatus.IN_PROGRESS,
                    f"High unverified ratio ({len(failed_claims)}/{total_claims}). Retrying...",
                    progress=85,
                    step="high_failed_ratio_retry",
                    attempt=attempt,
                    failed_ratio=failed_ratio,
                )
                if cached_domains:
                    skip_domain_check_next = True
                tries_left -= 1
                continue

            final_text_content = text_content
            final_relevance_results = relevance_results
            break

        if not final_text_content or final_relevance_results is None:
            emit(
                TaskStatus.FAILED,
                "Unable to produce a verifiable response after retries.",
                progress=100,
                step="failed",
            )
            return {"ok": False, "task_id": task_id}

        if chat_id:
            persistence.persist(
                task_id=task_id,
                chat_id=chat_id,
                user_id=user_id,
                user_prompt=user_prompt,
                assistant_response=final_text_content,
                status="completed",
            )

        result_payload = {
            "content": final_text_content,
            "final_verdict": final_relevance_results.final_verdict,
            "claims": [
                claim.model_dump(mode="json")
                for claim in final_relevance_results.claims
            ],
        }
        emit(
            TaskStatus.COMPLETED,
            "Content generation and verification completed.",
            progress=100,
            step="completed",
            result=result_payload,
        )
        return {
            "ok": True,
            "task_id": task_id,
            "result": result_payload,
        }
    except Exception as exc:
        emit(
            TaskStatus.FAILED,
            f"Task failed: {exc}",
            progress=100,
            step="failed",
        )
        raise
