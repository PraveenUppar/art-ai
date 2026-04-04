from typing import List, Literal

from pydantic import BaseModel, Field, field_validator


class FactCheckItem(BaseModel):
    question: str = Field(description="A fact-checking question.")
    expected_answer: Literal["yes", "no"] = Field(
        description="The expected answer to the fact-checking question. Must be either 'yes' or 'no'."
    )

    @field_validator("expected_answer", mode="before")
    @classmethod
    def normalize_expected_answer(cls, value):
        if isinstance(value, str):
            cleaned = value.strip().lower()
            if cleaned in {"yes", "true", "y", "1"}:
                return "yes"
            if cleaned in {"no", "false", "n", "0"}:
                return "no"
        return value


class FactCheckResult(BaseModel):
    FactCheckQuestions: List[FactCheckItem] = Field(
        description="A list of fact-checking questions generated from the claim text."
    )

    def __str__(self):
        return f"FactCheckResult(FactCheckQuestions={self.FactCheckQuestions})"
