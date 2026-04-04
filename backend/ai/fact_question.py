from ai.prompt import FACT_QUESTION_GENERATION_PROMPT
from core.ai import get_llm
from models.fact_gen import FactCheckResult

def generate_fact_check_questions(user_prompt: str, claim_text: str) -> FactCheckResult:
    llm = get_llm(FactCheckResult)
    prompt = FACT_QUESTION_GENERATION_PROMPT.format(
        user_prompt=user_prompt,
        claim_text=claim_text
    )
    response = llm.invoke(prompt)
    return FactCheckResult.model_validate(response)