import json
import random
import re
import os
from time import sleep, perf_counter
from concurrent.futures import ThreadPoolExecutor
from threading import Lock
from dotenv import load_dotenv

from firecrawl import FirecrawlApp
from models.fact_gen import FactCheckItem
from models.domain import DOMAIN_MAP, DomainType

# Load environment variables
load_dotenv()


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


def build_queries(topic_x: str, domains: list[str]) -> list[str]:
    topic = _normalize_query_text(topic_x)
    queries = [f"{topic} latest update India"]
    queries.extend(f"{topic} site:{domain}" for domain in domains[:6])
    return queries


def _normalize_query_text(text: str, max_len: int = 180) -> str:
    cleaned = text.replace("\n", " ").replace("\r", " ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if len(cleaned) > max_len:
        cleaned = cleaned[:max_len].rsplit(" ", 1)[0]
    return cleaned


def _safe_search(
    firecrawl_app: FirecrawlApp,
    query: str,
    *,
    max_results: int = 5,
    retries: int = 4,
) -> list[dict]:
    for attempt in range(retries + 1):
        try:
            response = firecrawl_app.search(query, limit=max_results)
            # Convert Firecrawl response format to match expected format
            results = []
            if response and hasattr(response, 'web') and response.web:
                for item in response.web:
                    results.append({
                        'title': item.title or '',
                        'link': item.url or '',
                        'snippet': item.description or ''
                    })
            return results
        except Exception as exc:
            if attempt == retries:
                print(f"Search failed for query: {query}\nError: {exc}")
                return []
            backoff = min(6.0, (0.8 * (2**attempt)) + random.uniform(0.1, 0.6))
            sleep(backoff)
    return []


def collect_evidence_with_domains(topic: str, domains: list[str]) -> dict[str, str]:
    firecrawl_app = FirecrawlApp(api_key=os.getenv("FIRECRAWL"))
    queries = build_queries(topic, [domain for domain in domains])
    evidence_chunks: dict[str, str] = {}

    for query in queries:
        search_results = _safe_search(firecrawl_app, query)
        formulated_results = []
        for result in search_results:
            title = result.get("title", "")
            url = result.get("link")
            snippet = result.get("snippet", "")
            formulated_result = f"Title: {title}\nURL: {url}\nSnippet: {snippet}"
            formulated_results.append(formulated_result)
        evidence_chunks[query] = "\n".join(formulated_results)
    return evidence_chunks


def _process_single_question(domain: DomainType, question: FactCheckItem, firecrawl_app: FirecrawlApp):
    """Process a single question for a single domain."""
    allowed_sites = DOMAIN_MAP.get(domain, [])
    if not allowed_sites:
        return None
    
    sites = " OR site:".join(allowed_sites)
    base_question = _normalize_query_text(question.question, max_len=140)
    query = f"{base_question} site:{sites}"
    aggregated_results = _safe_search(firecrawl_app, query)
    
    print("finished fetching results for question")

    # Fallback to a generic query when site-targeted queries return too little.
    if not aggregated_results:
        fallback_query = f"{base_question} healthcare evidence"
        aggregated_results = _safe_search(firecrawl_app, fallback_query)

    formulated_results = []
    for result in aggregated_results[:5]:
        title = result.get("title", "")
        url = result.get("link")
        snippet = result.get("snippet", "")
        formulated_results.append(
            f"Title: {title}\nURL: {url}\nSnippet: {snippet}"
        )

    if not formulated_results:
        print(
            f"No results for question '{question.question}' in domain '{domain.value}'"
        )

    return {
        "question": question.question,
        "expected_answer": question.expected_answer,
        "domain": domain.value,
        "evidence": "\n".join(formulated_results),
    }


def collect_evidence(questions: list[FactCheckItem], domains: list[DomainType]):
    start = perf_counter()
    
    evidences = []
    lock = Lock()
    
    def process_and_append(domain, question):
        # Create a separate Firecrawl instance for each thread to avoid sharing issues
        firecrawl_app = FirecrawlApp(api_key=os.getenv("FIRECRAWL"))
        result = _process_single_question(domain, question, firecrawl_app)
        if result is not None:
            with lock:
                evidences.append(result)
    
    # Launch a thread for each (domain, question) combination
    futures = []
    with ThreadPoolExecutor(max_workers=min(10, len(domains) * len(questions))) as executor:
        for domain in domains:
            for question in questions:
                print("starting new thread")
                future = executor.submit(process_and_append, domain, question)
                futures.append(future)
        
        # Wait for all futures to complete
        for future in futures:
            future.result()
    
    with open("evidence_chunks.json", "w", encoding="utf-8") as f:
        json.dump(evidences, f, indent=2)
    
    print(f'time taken to collect evidence: {perf_counter() - start}')
    return evidences