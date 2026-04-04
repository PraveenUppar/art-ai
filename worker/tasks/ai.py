from core import celery_app, emit_task_update, get_llm
from models import TaskStatus, Status
from ai.prompt import get_contextual_prompt, get_failed_ratio_prompt
from tools.context import extract_text_content
from ai.domain import classify_content_relevance
from ai.fact_questions import generate_fact_check_questions
from tools.search import collect_evidence
from ai.relevance_checker import check_relevance
from core.database import persist_chat_result


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

    iterations = 3
    try:
        while iterations > 0:
            attempt = 4 - iterations
            contextual_prompt = get_contextual_prompt(current_prompt)
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
                "Collecting evidence...",
                progress=60,
                step="evidence_collection",
                attempt=attempt,
            )
            evidence = collect_evidence(
                fact_check_questions.FactCheckQuestions, domains
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
                iterations -= 1
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
            persist_chat_result(
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
        return {"ok": True, "task_id": task_id, "result": result_payload}
    except Exception as exc:
        emit(
            TaskStatus.FAILED,
            f"Task failed: {exc}",
            progress=100,
            step="failed",
        )
        raise
