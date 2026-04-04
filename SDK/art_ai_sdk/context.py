from .models import Status


def extract_text_content(message) -> str:
    content = getattr(message, "content", "")
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and item.get("type") == "text":
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return "\n".join(parts).strip()

    return str(content)


def extract_links_by_status(relevance_results):
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
