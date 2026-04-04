from datetime import datetime
from typing import Any

DOMAIN_AGENT_PROMPT = """
You are a strict domain classifier.

Goal:
- Classify the user prompt and the content into one domain each.
- Determine whether the content is relevant to the user prompt.

Allowed domains are defined only by this map:
{domain_map}

Input:
- User prompt: {user_prompt}
- Content: {content}

Output contract (required):
- Return only one valid JSON object.
- Use exactly these keys and no extra keys:
    is_relevant, user_prompt_domain, content_domain, domain_match,
    alternate_domain, relevance_explanation, confidence_score.
- user_prompt_domain, content_domain, alternate_domain must be one of the allowed domain values.
- If alternate_domain is not needed, set alternate_domain to null.
- confidence_score must be a float in [0.0, 1.0].
- relevance_explanation must be short (max 35 words) and concrete.

Do not output markdown, code fences, or any text outside JSON.
"""

LINKS_AGENT_PROMPT = """
You are a strict evidence-based fact checker.

Input:
1) User prompt (topic intent): {user_prompt}
2) Claim text to verify: {claim_text}
3) Tool evidence (the only allowed source for citation):
{evidence}

Critical rules:
- Use only the provided Tool Evidence for verification.
- Do not invent URLs, sources, or facts.
- If evidence is insufficient, mark as unverified.
- Keep claims atomic and specific.
- Each claim reason must be concise (max 30 words).

Output contract (required):
- Return only one valid JSON object.
- Top-level keys must be exactly: claims, final_verdict.
- claims is an array. Each item must have exactly:
    claim_text, status, reason, evidence_urls, contradicting_urls.
- status must be exactly one of: true, false, unverified.
- evidence_urls and contradicting_urls must be arrays of full URLs.
- final_verdict must be a short overall summary sentence.

No markdown, no code fences, no extra keys, no prose outside JSON.
"""

FACT_QUESTION_GENERATION_PROMPT = """
You generate binary fact-check questions.

Input:
- User prompt: {user_prompt}
- Claim text: {claim_text}

Task:
- Extract the most important verifiable claims from the claim text.
- Create up to 5 atomic binary questions.

Rules:
- Every question must be answerable strictly with yes/no.
- expected_answer must be exactly "yes" or "no" (lowercase only).
- Prefer questions that can be validated through public evidence.
- Avoid subjective, vague, comparative, or multi-part questions.
- Keep each question short and concrete.

Return only valid JSON matching the required schema. Do not include markdown or extra text.
"""


def _build_non_personal_context() -> str:
    now = datetime.now().astimezone()
    return (
        "Non-personal context for this request:\n"
        f"- Date: {now:%Y-%m-%d}\n"
        f"- Local time: {now:%H:%M:%S}\n"
        f"- Timezone: {now.tzname()}\n"
        "- Location scope: India (coarse regional context, not personal location)\n"
        "Use this context only to improve temporal and regional relevance."
    )


def get_failed_ratio_prompt(
    base_user_prompt: str, failed_claims: list[Any], failed_summary: str
) -> str:
    if not failed_summary.strip() and failed_claims:
        failed_summary = "\n".join(
            f"- {getattr(claim, 'claim_text', '')} | reason: {getattr(claim, 'reason', '')}"
            for claim in failed_claims[:8]
        )

    return (
        f"Your previous response had too many unverified claims ({len(failed_claims)}). "
        "Regenerate with fewer but stronger claims that are easy to verify using trusted public sources.\n\n"
        f"Original user request: {base_user_prompt}\n"
        f"Unverified claims from previous response:\n{failed_summary}"
    )


def get_contextual_prompt(base_user_prompt: str) -> str:
    return (
        f"{base_user_prompt}\n\n{_build_non_personal_context()}\n\n"
        "Response requirements:\n"
        "- Keep response concise (max 8 bullet points).\n"
        "- Include only factual, verifiable claims.\n"
        "- Avoid speculation, hype, and future predictions unless evidence-backed.\n"
        "- Prefer claims likely to have public sources from trusted domains."
    )
