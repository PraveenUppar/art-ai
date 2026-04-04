from core import celery_app, emit_task_update, get_llm
from models import TaskStatus, Status
from ai.prompt import get_contextual_prompt, get_failed_ratio_prompt
from tools.context import extract_text_content
from ai.domain import classify_content_relevance
from ai.fact_questions import generate_fact_check_questions
from tools.search import collect_evidence
from ai.relevance_checker import check_relevance
from core.database import persist_chat_result
import re


def _extract_urls(text: str) -> list[str]:
    if not text:
        return []
    return re.findall(r"https?://[^\s\]\)\"']+", text)


def _collect_result_links(relevance_results) -> list[str]:
    links: list[str] = []
    seen: set[str] = set()
    for claim in relevance_results.claims:
        for url in (claim.evidence_urls or []) + (claim.contradicting_urls or []):
            if url not in seen:
                seen.add(url)
                links.append(url)
    return links


def _format_terminal_fallback(attempts_made: int, crash_reasons: list[str]) -> str:
    if attempts_made <= 1:
        return "Unable to generate a reliable response right now. Please try again."

    lines = [
        "I was unable to produce a fully verified response because every safeguard path failed.",
        "",
        "Why this happened:",
    ]

    unique_reasons: list[str] = []
    seen: set[str] = set()
    for reason in crash_reasons:
        compact = " ".join(str(reason).split())[:220]
        if compact and compact not in seen:
            seen.add(compact)
            unique_reasons.append(compact)
        if len(unique_reasons) >= 3:
            break

    if unique_reasons:
        lines.extend([f"- {reason}" for reason in unique_reasons])
    else:
        lines.append("- Verification and structured output checks failed repeatedly.")

    lines.extend(
        [
            "",
            "What you can try:",
            "- Ask a narrower question.",
            "- Split the request into smaller parts.",
            "- Retry in a few moments.",
        ]
    )
    return "\n".join(lines)


@celery_app.task(name="generate_and_verify_content")
def generate_and_verify_content(
    task_id: str,
    user_prompt: str,
    chat_id: str | None = None,
    user_id: str | None = None,
):
    print(
        f"Generating and verifying content for task_id: {task_id} with prompt: {user_prompt}"
    )

    def emit(status: TaskStatus, message: str, **extra):
        payload = {
            "task_id": task_id,
            "chat_id": chat_id,
            "status": status.value,
            "message": message,
            **extra,
        }
        emit_task_update(task_id, payload)

    emit_task_update(
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
    cached_domains = None
    current_prompt = user_prompt
    final_text_content = ""
    final_relevance_results = None
    crash_reasons: list[str] = []
    attempts_made = 0

    iterations = 3
    try:
        while iterations > 0:
            attempt = 4 - iterations
            attempts_made = attempt
            contextual_prompt = get_contextual_prompt(current_prompt)
            try:
                emit(
                    TaskStatus.IN_PROGRESS,
                    f"Generating output (attempt {attempt}/3)...",
                    progress=10,
                    step="generation",
                    attempt=attempt,
                )

                llm = get_llm()
                output = llm.invoke(contextual_prompt)
                text_content = extract_text_content(output)
                if not text_content.strip():
                    emit(
                        TaskStatus.IN_PROGRESS,
                        "Generated output is empty. Regenerating...",
                        progress=15,
                        step="generation_retry",
                        attempt=attempt,
                    )
                    iterations -= 1
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
                        contextual_prompt, text_content
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
                        iterations -= 1
                        continue

                    domains = [classification_result.content_domain]
                    if classification_result.confidence_score < 0.7:
                        if classification_result.alternate_domain:
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
                    contextual_prompt, text_content
                )
                emit(
                    TaskStatus.IN_PROGRESS,
                    "Prepared fact-check questions.",
                    progress=52,
                    step="fact_questions_ready",
                    attempt=attempt,
                    questions=[
                        item.question
                        for item in fact_check_questions.FactCheckQuestions[:5]
                    ],
                )

                emit(
                    TaskStatus.IN_PROGRESS,
                    "Collecting evidence...",
                    progress=60,
                    step="evidence_collection",
                    attempt=attempt,
                )
                evidence = collect_evidence(
                    fact_check_questions.FactCheckQuestions, domains
                )
                evidence_links: list[str] = []
                seen_evidence_links: set[str] = set()
                for row in evidence:
                    for url in _extract_urls(row.get("evidence", ""))[:5]:
                        if url not in seen_evidence_links:
                            seen_evidence_links.add(url)
                            evidence_links.append(url)

                emit(
                    TaskStatus.IN_PROGRESS,
                    "Evidence search completed.",
                    progress=70,
                    step="evidence_ready",
                    attempt=attempt,
                    searches=[row.get("question", "") for row in evidence[:8]],
                    evidence_links=evidence_links[:20],
                )

                emit(
                    TaskStatus.IN_PROGRESS,
                    "Checking evidence relevance...",
                    progress=80,
                    step="evidence_relevance",
                    attempt=attempt,
                )
                relevance_results = check_relevance(
                    contextual_prompt, text_content, evidence
                )

                total_claims = len(relevance_results.claims)
                failed_claims = [
                    claim
                    for claim in relevance_results.claims
                    if claim.status == Status.UNVERIFIED
                ]
                failed_ratio = (
                    (len(failed_claims) / total_claims) if total_claims else 1.0
                )

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
                    iterations -= 1
                    continue

                final_text_content = text_content
                final_relevance_results = relevance_results
                break

            except Exception as iter_exc:
                crash_reasons.append(str(iter_exc))
                iterations -= 1
                if iterations > 0:
                    emit(
                        TaskStatus.IN_PROGRESS,
                        "Safeguard path failed for this attempt. Retrying with reduced context...",
                        progress=88,
                        step="safeguard_retry",
                        attempt=attempt,
                    )
                    continue
                break

        if not final_text_content or final_relevance_results is None:
            fallback_response = _format_terminal_fallback(attempts_made, crash_reasons)

            if chat_id:
                persist_chat_result(
                    task_id=task_id,
                    chat_id=chat_id,
                    user_id=user_id,
                    user_prompt=user_prompt,
                    assistant_response=fallback_response,
                    assistant_links=[],
                    status="failed",
                )

            emit(
                TaskStatus.FAILED,
                "Unable to produce a verifiable response after retries.",
                progress=100,
                step="failed",
                result={
                    "content": fallback_response,
                    "final_verdict": "failed",
                    "links": [],
                    "claims": [],
                },
            )
            return {
                "ok": False,
                "task_id": task_id,
                "result": {
                    "content": fallback_response,
                    "final_verdict": "failed",
                    "links": [],
                    "claims": [],
                },
            }

        if chat_id:
            result_links = _collect_result_links(final_relevance_results)
            persist_chat_result(
                task_id=task_id,
                chat_id=chat_id,
                user_id=user_id,
                user_prompt=user_prompt,
                assistant_response=final_text_content,
                assistant_links=result_links,
                status="completed",
            )

        result_links = _collect_result_links(final_relevance_results)
        result_payload = {
            "content": final_text_content,
            "final_verdict": final_relevance_results.final_verdict,
            "links": result_links,
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
        return {"ok": True, "task_id": task_id, "result": result_payload}
    except Exception as exc:
        fallback_response = _format_terminal_fallback(
            attempts_made, crash_reasons + [str(exc)]
        )
        if chat_id:
            persist_chat_result(
                task_id=task_id,
                chat_id=chat_id,
                user_id=user_id,
                user_prompt=user_prompt,
                assistant_response=fallback_response,
                assistant_links=[],
                status="failed",
            )
        emit(
            TaskStatus.FAILED,
            "Task failed after all safeguards were exhausted.",
            progress=100,
            step="failed",
            result={
                "content": fallback_response,
                "final_verdict": "failed",
                "links": [],
                "claims": [],
            },
        )
        return {
            "ok": False,
            "task_id": task_id,
            "result": {
                "content": fallback_response,
                "final_verdict": "failed",
                "links": [],
                "claims": [],
            },
        }
