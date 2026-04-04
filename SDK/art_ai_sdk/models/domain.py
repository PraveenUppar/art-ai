from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class DomainType(str, Enum):
    HEALTHCARE = "healthcare"
    LEGAL = "legal"
    NEWS = "news"
    GENERAL = "general"
    FINANCE = "finance"


class ClassificationResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    is_relevant: bool = Field(
        description="Whether the content is relevant to the domain."
    )
    user_prompt_domain: DomainType = Field(
        description="The domain category as classified from the user prompt."
    )
    content_domain: DomainType = Field(
        description="The domain category as classified from the content."
    )
    domain_match: bool = Field(
        description="Whether the user prompt domain and content domain match."
    )
    alternate_domain: DomainType | None = Field(
        default=None,
        description="An alternate domain category. If uncertain, choose the second most likely domain.",
    )
    relevance_explanation: str = Field(
        description="Explanation for the relevance classification."
    )
    confidence_score: float = Field(
        description="A confidence score between 0 and 1 indicating the certainty of the classification."
    )

    def __str__(self):
        return (
            "ClassificationResult("
            f"is_relevant={self.is_relevant}, "
            f"user_prompt_domain={self.user_prompt_domain}, "
            f"content_domain={self.content_domain}, "
            f"domain_match={self.domain_match}, "
            f"alternate_domain={self.alternate_domain}, "
            f"relevance_explanation={self.relevance_explanation}, "
            f"confidence_score={self.confidence_score})"
        )


DOMAIN_MAP: dict[DomainType, list[str]] = {
    DomainType.LEGAL: [
        "indiacode.nic.in",
        "sci.gov.in",
        "legislative.gov.in",
        "lawcommissionofindia.nic.in",
        "highcourtsofindia.nic.in",
    ],
    DomainType.HEALTHCARE: [
        "mohfw.gov.in",
        "icmr.gov.in",
        "nhp.gov.in",
        "who.int",
        "pib.gov.in",
        "ncbi.nlm.nih.gov",
        "rchiips.org",
    ],
    DomainType.GENERAL: [
        "thehindu.com",
        "pib.gov.in",
        "newsonair.gov.in",
        "theprint.in",
        "scroll.in",
    ],
    DomainType.FINANCE: [
        "rbi.org.in",
        "sebi.gov.in",
        "finmin.nic.in",
        "mospi.gov.in",
        "irdai.gov.in",
        "incometax.gov.in",
        "pfrda.org.in",
        "dea.gov.in",
        "cbic.gov.in",
    ],
}
