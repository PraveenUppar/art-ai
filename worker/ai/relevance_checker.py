from models.link_checker import LinkCheckResult
from core.ai import get_llm
from ai.prompt import LINKS_AGENT_PROMPT


def _compact_evidence(evidence, max_items: int = 4, max_chars: int = 900):
    compacted = []
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


def _is_json_generation_limit_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return (
        "json_validate_failed" in message
        or "failed to generate json" in message
        or "max completion tokens reached" in message
    )


def _invoke_relevance_with_retries(llm, user_prompt: str, claim: str, evidence):
    # First attempt uses full context, then progressively smaller evidence payloads.
    attempt_payloads = [
        evidence,
        _compact_evidence(evidence, max_items=4, max_chars=900),
        _compact_evidence(evidence, max_items=3, max_chars=600),
        _compact_evidence(evidence, max_items=2, max_chars=360),
        _compact_evidence(evidence, max_items=1, max_chars=220),
    ]

    last_error: Exception | None = None

    for index, evidence_payload in enumerate(attempt_payloads):
        prompt = LINKS_AGENT_PROMPT.format(
            user_prompt=user_prompt[:800] if index > 0 else user_prompt,
            claim_text=claim[:1500] if index > 0 else claim,
            evidence=evidence_payload,
        )
        try:
            response = llm.invoke(prompt)
            return LinkCheckResult.model_validate(response)
        except Exception as exc:
            last_error = exc

            # If we are already compacting and the error is unrelated, fail fast.
            if index > 0 and not _is_json_generation_limit_error(exc):
                raise

    if last_error is not None:
        raise last_error

    raise RuntimeError("Failed to run relevance checks")


def check_link_relevance(user_prompt: str, evidence: dict[str, str], claim: str):
    llm = get_llm(LinkCheckResult)
    prompt = LINKS_AGENT_PROMPT.format(
        user_prompt=user_prompt, claim_text=claim, evidence=evidence
    )
    response = llm.invoke(prompt)
    return LinkCheckResult.model_validate(response)


def check_relevance(user_prompt: str, claim: str, evidence):
    llm = get_llm(LinkCheckResult)
    return _invoke_relevance_with_retries(llm, user_prompt, claim, evidence)
