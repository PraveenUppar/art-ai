from ai.prompt import DOMAIN_AGENT_PROMPT
from models.domain import ClassificationResult, DOMAIN_MAP
from core.ai import get_llm


def classify_content_relevance(user_prompt: str, content: str) -> ClassificationResult:
    llm = get_llm(ClassificationResult)

    prompt = DOMAIN_AGENT_PROMPT.format(
        user_prompt=user_prompt,
        content=content,
        domain_map=DOMAIN_MAP,
    )
    response = llm.invoke(prompt)
    return ClassificationResult.model_validate(response)
