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


def check_link_relevance(user_prompt: str, evidence: dict[str, str], claim: str):
    llm = get_llm(LinkCheckResult)
    prompt = LINKS_AGENT_PROMPT.format(
        user_prompt=user_prompt, claim_text=claim, evidence=evidence
    )
    response = llm.invoke(prompt)
    return LinkCheckResult.model_validate(response)


def check_relevance(user_prompt: str, claim: str, evidence):
    llm = get_llm(LinkCheckResult)
    prompt = LINKS_AGENT_PROMPT.format(
        user_prompt=user_prompt,
        claim_text=claim,
        evidence=evidence,
    )
    try:
        response = llm.invoke(prompt)
        return LinkCheckResult.model_validate(response)
    except Exception:
        fallback_prompt = LINKS_AGENT_PROMPT.format(
            user_prompt=user_prompt,
            claim_text=claim,
            evidence=_compact_evidence(evidence),
        )
        fallback_response = llm.invoke(fallback_prompt)
        return LinkCheckResult.model_validate(fallback_response)
