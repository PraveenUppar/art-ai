from ai.domain import classify_content_relevance
from core.ai import get_llm
from utils import extract_text_content, collect_evidence_with_domains, collect_evidence
from models.domain import DOMAIN_MAP
from ai.relevance_checker import check_relevance
from ai.fact_question import generate_fact_check_questions
from models.link_checker import Status
from datetime import datetime

import time


def _extract_links_by_status(relevance_results):
    verified_links: list[str] = []
    unverified_links: list[str] = []
    seen_verified: set[str] = set()
    seen_unverified: set[str] = set()

    for claim in relevance_results.claims:
        links = claim.evidence_urls or []
        if claim.status == Status.TRUE:
            for link in links:
                if link not in seen_verified:
                    seen_verified.add(link)
                    verified_links.append(link)
        elif claim.status == Status.UNVERIFIED:
            for link in links:
                if link not in seen_unverified:
                    seen_unverified.add(link)
                    unverified_links.append(link)

    return verified_links, unverified_links


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


def main():
    base_user_prompt = "What are the latest advancements in healthcare technology?"
    prompt = base_user_prompt
    iterations = 3
    skip_domain_check_next = False
    cached_domains = None
    while iterations > 0:
        print(f"\nIteration {4 - iterations}:\n{'=' * 20}")

        contextual_prompt = (
            f"{prompt}\n\n{_build_non_personal_context()}\n\n"
            "Response requirements:\n"
            "- Keep response concise (max 8 bullet points).\n"
            "- Include only factual, verifiable claims.\n"
            "- Avoid speculation, hype, and future predictions unless evidence-backed.\n"
            "- Prefer claims likely to have public sources from trusted domains."
        )

        # Step 1: Generate output
        print("Generating output...")
        llm = get_llm()
        output = llm.invoke(contextual_prompt)
        text_content = extract_text_content(output)
        print(f"Generated Output:\n{text_content}\n")

        if skip_domain_check_next and cached_domains:
            print(
                "Skipping domain relevance check for this retry (already resolved).\n"
            )
            domains = list(cached_domains)
            skip_domain_check_next = False
        else:
            # Step 2: Classify domain relevance
            print("Classifying domain relevance...")
            classification_result = classify_content_relevance(
                contextual_prompt, text_content
            )
            print(f"Classification Result: {classification_result}\n")

            # Step 3: Check if domain confidence is low or if the content is not relevant
            if (
                not classification_result.is_relevant
                or classification_result.confidence_score < 0.5
                or not classification_result.domain_match
            ):
                print(
                    "Content is not relevant to the user's query. Regenerating output...\n"
                )
                prompt = (
                    "The previous response did not match the requested domain. "
                    "Regenerate an answer aligned to the original user request.\n\n"
                    f"Original user request: {base_user_prompt}\n"
                    f"Domain issue: {classification_result.relevance_explanation}"
                )
                iterations -= 1
                continue

            domains = [classification_result.content_domain]
            if classification_result.confidence_score < 0.7:
                print(
                    "Domain confidence is low. Adding alternative domains for evidence collection...\n"
                )
                if classification_result.alternate_domain is not None:
                    domains.append(classification_result.alternate_domain)

            cached_domains = list(domains)
        # Step 4: Divide the output into fact-checkable claims
        print("Generating fact-checking questions...")
        fact_check_questions = generate_fact_check_questions(
            contextual_prompt, text_content
        )
        print(f"Fact-Checking Questions:\n{fact_check_questions}\n")

        # Step 5: Collect evidence for the claims using the domains and fact-checking questions
        print("Collecting evidence...")
        evidence = collect_evidence(fact_check_questions.FactCheckQuestions, domains)

        print(f"Collected Evidence:\n{evidence}\n")
        # Step 6: Check the relevance of the collected evidence to the original claim
        print("Checking evidence relevance...")
        relevance_results = check_relevance(contextual_prompt, text_content, evidence)
        print(f"Relevance Results:\n{relevance_results}\n")

        total_claims = len(relevance_results.claims)
        failed_claims = [
            claim
            for claim in relevance_results.claims
            if claim.status == Status.UNVERIFIED
        ]
        failed_ratio = (len(failed_claims) / total_claims) if total_claims else 1.0

        if failed_ratio > 0.7:
            print(
                f"More than 70% claims failed verification ({len(failed_claims)}/{total_claims}). Reprompting AI to improve factual grounding...\n"
            )
            failed_summary = "\n".join(
                f"- {claim.claim_text} | reason: {claim.reason}"
                for claim in failed_claims[:8]
            )
            prompt = (
                f"Your previous response had too many unverified claims ({len(failed_claims)}/{total_claims}). "
                "Regenerate with fewer but stronger claims that are easy to verify using trusted public sources.\n\n"
                f"Original user request: {base_user_prompt}\n"
                f"Unverified claims from previous response:\n{failed_summary}"
            )
            if cached_domains:
                skip_domain_check_next = True
            iterations -= 1
            continue

        verified_links, unverified_links = _extract_links_by_status(relevance_results)

        print("Final Output:\n")
        print(text_content)
        print("\nVerified Links:")
        if verified_links:
            for link in verified_links:
                print(f"- {link}")
        else:
            print("- None")

        print("\nUnverified Links:")
        if unverified_links:
            for link in unverified_links:
                print(f"- {link}")
        else:
            print("- None")

        break
        iterations -= 1


if __name__ == "__main__":
    start = time.perf_counter()
    main()
    print(f'time taken: {time.perf_counter() - start}')
