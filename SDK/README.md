# art_ai_sdk

Python SDK for generation + evidence + verification workflows used by this project.

This SDK keeps the same high-level behavior as the worker flow:

1. Generate response text from an LLM.
2. Classify domain relevance.
3. Generate atomic fact-check questions.
4. Collect evidence from domain-specific sources.
5. Verify claims against evidence.
6. Retry when quality is weak.

It supports both:

- function-first usage (import and call individual functions)
- client usage (sync and async classes)

## Table of Contents

- Intro
- Installation Guide
- Configuration
- Getting Started
- Critical Functions Explained
- Client API
- Providers and Dependency Injection
- Progress and Persistence Hooks
- Optional Infra Adapters
- Return Shapes and Data Models
- Behavior and Retry Rules
- Notes

## Intro

Use this package when you want to call the workflow directly from Python without going through HTTP routes.

The public API is exported from the package root:

- pipeline functions (`classify_content_relevance`, `collect_evidence`, `check_relevance`, `generate_and_verify_content`, etc.)
- clients (`ArtAIClient`, `AsyncArtAIClient`)
- provider abstractions (`LLMProvider`, `SearchProvider`, callable provider wrappers)
- adapters (`RedisProgressAdapter`, `SQLAlchemyPersistenceAdapter`, `CeleryTaskAdapter`)

## Installation Guide

### 1) Requirements

- Python 3.12+
- Provider API keys for default providers: - `GROQ_API_KEY` - `FIRE_CRAWL_API_KEY`

### 2) Install

From repository root:

```bash
pip install -e ./SDK
```

Optional infra adapters (Redis, Celery, SQLAlchemy):

```bash
pip install -e "./SDK[infra]"
```

Optional dev tools:

```bash
pip install -e "./SDK[dev]"
```

## Configuration

Settings are loaded through `SDKSettings` (`pydantic-settings`).

### Environment Variables

Required for default providers:

```bash
export GROQ_API_KEY="your-groq-key"
export GROQ_MODEL="openai/gpt-oss-20b"
export FIRE_CRAWL_API_KEY="your-firecrawl-key"
```

Optional:

```bash
export REDIS_URL="redis://localhost:6379/0"
export DATABASE_URL="postgresql://user:pass@localhost:5432/db"
```

Other settings in `SDKSettings`:

- `max_workers` default `10` (bounded `1..64`)
- `evidence_output_path` default `evidence_chunks.json`

Tip: to avoid writing evidence to disk, pass `evidence_output_path=None` in `collect_evidence()` or `client.process()`.

## Getting Started

### Quick Start (Sync)

```python
from art_ai_sdk import ArtAIClient


def to_human_status(raw_status: str) -> str:
        mapping = {
                "true": "valid",
                "false": "invalid",
                "unverified": "undetermined",
        }
        return mapping.get(raw_status, raw_status)


client = ArtAIClient()
result = client.process(
        task_id="demo-task-1",
        user_prompt="Summarize the latest RBI inflation update and verify key claims.",
)

print(result["ok"])
print(result["result"]["final_verdict"])
print(result["result"]["content"])

for claim in result["result"]["claims"]:
        print("claim:", claim["claim_text"])
        print("status:", to_human_status(claim["status"]))
        print("evidence:", claim.get("evidence_urls", []))
        print("contradictions:", claim.get("contradicting_urls", []))
```

### Async Client

```python
import asyncio
from art_ai_sdk import AsyncArtAIClient


async def main():
        client = AsyncArtAIClient()
        result = await client.process(
                task_id="demo-task-async",
                user_prompt="Explain recent Supreme Court judgments about privacy rights.",
        )
        print(result["ok"], result["task_id"])


asyncio.run(main())
```

### Function-First Pipeline

```python
from art_ai_sdk import (
        classify_content_relevance,
        generate_fact_check_questions,
        collect_evidence,
        check_relevance,
)

user_prompt = "What are the latest policy changes in Indian healthcare?"
content = "The Ministry of Health launched a new national vaccination program..."

classification = classify_content_relevance(user_prompt, content)
questions = generate_fact_check_questions(user_prompt, content)
evidence = collect_evidence(
        questions.FactCheckQuestions,
        [classification.content_domain],
)
verdict = check_relevance(user_prompt, content, evidence)

print(classification.content_domain)
print(verdict.final_verdict)
```

## Critical Functions Explained

This section explains how the most important functions behave and when to use each one.

### `classify_content_relevance(...)`

Purpose:

- Classify the user prompt and generated content into domains.
- Decide whether content is relevant enough to continue.

Inputs:

- `user_prompt: str`
- `content: str`
- optional `llm_provider`, `settings`, `domain_map`

Returns:

- `ClassificationResult` with fields like `is_relevant`, `content_domain`, `confidence_score`, `domain_match`.

When to use:

- early gate in a pipeline before spending resources on evidence collection.

### `generate_fact_check_questions(...)`

Purpose:

- Turn response text into atomic yes/no verification questions.

Inputs:

- `user_prompt: str`
- `claim_text: str`
- optional `llm_provider`, `settings`

Returns:

- `FactCheckResult` containing `FactCheckQuestions: list[FactCheckItem]`.

Important detail:

- expected answers are normalized to `yes` or `no` in model validation.

### `collect_evidence(...)`

Purpose:

- Parallel evidence collection for `(domain x question)` pairs using search provider.

Inputs:

- `questions: list[FactCheckItem | dict]`
- `domains: list[DomainType | str]`
- optional `search_provider`, `settings`, `domain_map`, `max_workers`, `evidence_output_path`

Behavior:

- validates each question with `FactCheckItem.model_validate`
- normalizes domain strings to `DomainType`
- runs thread pool collection
- returns list of evidence records with keys: - `question` - `expected_answer` - `domain` - `evidence`

Important detail:

- writes JSON file by default (`evidence_chunks.json`) unless disabled.

### `check_relevance(...)`

Purpose:

- Verify claims against evidence and produce claim statuses + final verdict.

Inputs:

- `user_prompt: str`
- `claim: str`
- `evidence: list[dict] | dict`
- optional `llm_provider`, `settings`

Returns:

- `LinkCheckResult` with `claims[]` and `final_verdict`.

Fallback behavior:

- if first structured parse/invoke fails, it compacts evidence and retries once with a fallback prompt path.

### `generate_and_verify_content(...)`

Purpose:

- End-to-end orchestration function used by the client `.process()` methods.

Inputs:

- required: `task_id`, `user_prompt`
- optional: `chat_id`, `user_id`, `iterations`, providers, callbacks, `domain_map`, `max_workers`, `evidence_output_path`

Core flow:

1. emit `PENDING` progress event
2. generate content from contextualized prompt
3. classify domain relevance
4. generate fact-check questions
5. collect evidence
6. check relevance
7. if unverified ratio is too high (`> 0.7`), regenerate with targeted prompt
8. on success, emit `COMPLETED`; on failure, emit `FAILED`

Returns:

- success:

```python
{
    "ok": True,
    "task_id": "...",
    "result": {
        "content": "...",
        "final_verdict": "true|false|unverified|...",
        "claims": [
            {
                "claim_text": "...",
                "status": "true|false|unverified",
                "reason": "...",
                "evidence_urls": [...],
                "contradicting_urls": [...]
            }
        ]
    }
}
```

- exhausted retries:

```python
{"ok": False, "task_id": "..."}
```

### Supporting Functions

- `build_queries(topic_x, domains)`: creates domain-scoped search queries.
- `collect_evidence_with_domains(topic, domains, ...)`: convenience wrapper returning `{query: text_blob}`.
- `check_link_relevance(user_prompt, evidence, claim, ...)`: lower-level verification helper for one evidence block.

## Client API

### `ArtAIClient`

Main methods:

- `classify_content_relevance(...)`
- `generate_fact_check_questions(...)`
- `collect_evidence(...)`
- `check_relevance(...)`
- `process(...)`

`process(...)` is the standard entry point for application use.

### `AsyncArtAIClient`

- Mirrors sync API.
- Uses `asyncio.to_thread(...)` internally, so it is async-friendly without changing core sync pipeline behavior.

## Providers and Dependency Injection

The SDK is provider-driven. You can inject custom providers for testing, deterministic runs, or alternate vendor integrations.

### LLM side

- `LLMProvider` protocol
- `GroqLLMProvider` default implementation
- `CallableLLMProvider` for custom injection

### Search side

- `SearchProvider` protocol
- `FirecrawlSearchProvider` default implementation
- `CallableSearchProvider` for custom injection

### Deterministic Test Example

```python
from art_ai_sdk import ArtAIClient, CallableLLMProvider, CallableSearchProvider
from art_ai_sdk.models import ClassificationResult, DomainType, FactCheckResult, LinkCheckResult
from art_ai_sdk.models.fact_check import FactCheckItem
from art_ai_sdk.models.link_checker import LinkCheckClaims, Status


def fake_llm(prompt, response_format=None):
        if response_format is ClassificationResult:
                return ClassificationResult(
                        is_relevant=True,
                        user_prompt_domain=DomainType.GENERAL,
                        content_domain=DomainType.GENERAL,
                        domain_match=True,
                        alternate_domain=None,
                        relevance_explanation="ok",
                        confidence_score=0.9,
                )
        if response_format is FactCheckResult:
                return FactCheckResult(
                        FactCheckQuestions=[FactCheckItem(question="q?", expected_answer="yes")]
                )
        if response_format is LinkCheckResult:
                return LinkCheckResult(
                        claims=[
                                LinkCheckClaims(
                                        claim_text="c",
                                        status=Status.TRUE,
                                        reason="r",
                                        evidence_urls=["https://x"],
                                )
                        ],
                        final_verdict="true",
                )
        class Msg:
                content = "generated content"
        return Msg()


def fake_search(query, max_results):
        return [{"title": "t", "link": "https://example.com", "snippet": "s"}]


client = ArtAIClient(
        llm_provider=CallableLLMProvider(fake_llm),
        search_provider=CallableSearchProvider(fake_search),
)
print(client.process(task_id="smoke", user_prompt="test")["ok"])
```

## Progress and Persistence Hooks

### Progress callback

- Protocol: `ProgressCallback.emit(task_id, payload)`
- Built-ins: - `NoOpProgressCallback` - `InMemoryProgressCallback`

`generate_and_verify_content()` emits step/status payloads at key milestones.

### Persistence hook

- Protocol: `PersistenceHook.persist(...)`
- Built-in: `NoOpPersistenceHook`

Persistence is invoked only when `chat_id` is provided.

## Optional Infra Adapters

- `RedisProgressAdapter`
  - emits socket events via Redis manager
  - stores latest task snapshot in Redis with TTL
- `SQLAlchemyPersistenceAdapter`
  - updates `chats` and inserts `messages`
  - auto-normalizes `postgresql://` to `postgresql+psycopg://` when needed
- `CeleryTaskAdapter`
  - submits async background tasks with a fixed task name

## Return Shapes and Data Models

Core enums/models:

- `DomainType`
- `ClassificationResult`
- `FactCheckItem`, `FactCheckResult`
- `Status`, `LinkCheckClaims`, `LinkCheckResult`
- `TaskStatus`

Model behavior worth knowing:

- claim/result validators in link-check models normalize common alternate key shapes.
- fact-check expected answers are normalized for common yes/no variants.

## Behavior and Retry Rules

- iteration loop uses `tries_left = max(1, iterations)`
- domain gate requires: - `is_relevant` true - `domain_match` true - `confidence_score >= 0.5`
- secondary domain is included when confidence is below `0.7` and `alternate_domain` is present
- high unverified ratio (`> 0.7`) triggers targeted regeneration prompt
- final failure returns `{ "ok": False, "task_id": ... }`

## Notes

- Infrastructure is optional by default.
- Default `DOMAIN_MAP` currently contains legal, healthcare, general, and finance mappings.
- If your use case needs additional domain sources (for example, explicit news site mappings), pass a custom `domain_map` to pipeline/client methods.
