from typing import Callable, Protocol

from firecrawl import FirecrawlApp

from ..config import SDKSettings


class SearchProvider(Protocol):
    def search(self, query: str, *, max_results: int = 5) -> list[dict]: ...


class FirecrawlSearchProvider:
    def __init__(self, *, api_key: str):
        self._client = FirecrawlApp(api_key=api_key)

    def search(self, query: str, *, max_results: int = 5) -> list[dict]:
        response = self._client.search(query, limit=max_results)
        results: list[dict] = []
        if response and hasattr(response, "web") and response.web:
            for item in response.web:
                title = getattr(item, "title", "") or ""
                link = getattr(item, "url", "") or ""
                snippet = getattr(item, "description", "") or ""
                results.append(
                    {
                        "title": title,
                        "link": link,
                        "snippet": snippet,
                    }
                )
        return results


class CallableSearchProvider:
    def __init__(self, search_fn: Callable[[str, int], list[dict]]):
        self._search_fn = search_fn

    def search(self, query: str, *, max_results: int = 5) -> list[dict]:
        return self._search_fn(query, max_results)


def build_default_search_provider(
    settings: SDKSettings | None = None,
) -> SearchProvider:
    resolved = settings or SDKSettings()
    if not resolved.fire_crawl_api_key:
        raise ValueError(
            "fire_crawl_api_key is required. Pass an explicit provider or set FIRE_CRAWL_API_KEY."
        )
    return FirecrawlSearchProvider(api_key=resolved.fire_crawl_api_key)
