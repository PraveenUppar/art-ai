from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import List
from enum import Enum


class Status(str, Enum):
    TRUE = "true"
    FALSE = "false"
    UNVERIFIED = "unverified"


class LinkCheckClaims(BaseModel):
    model_config = ConfigDict(extra="ignore")

    claim_text: str = Field(
        description="The specific claim text extracted from the content."
    )
    status: Status = Field(description="The veracity status of the claim.")
    reason: str = Field(
        default="", description="A brief explanation for the assigned status."
    )
    evidence_urls: List[str] = Field(
        default_factory=list,
        description="A list of URLs providing evidence for the assigned status.",
    )
    contradicting_urls: List[str] = Field(
        default_factory=list,
        description="A list of URLs that contradict the claim, if any.",
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_claim_shape(cls, data):
        if not isinstance(data, dict):
            return data

        normalized = dict(data)

        if "claim" not in normalized and isinstance(normalized.get("Claim"), str):
            normalized["claim"] = normalized["Claim"]
        if "status" not in normalized and isinstance(normalized.get("Status"), str):
            normalized["status"] = normalized["Status"].lower()
        if "evidence" not in normalized and isinstance(
            normalized.get("Evidence"), list
        ):
            normalized["evidence"] = normalized["Evidence"]

        if "claim_text" not in normalized and isinstance(normalized.get("claim"), str):
            normalized["claim_text"] = normalized["claim"]
        if "claim_text" not in normalized and isinstance(normalized.get("text"), str):
            normalized["claim_text"] = normalized["text"]

        if "evidence_urls" not in normalized:
            evidence_urls: list[str] = []
            evidence = normalized.get("evidence")
            if isinstance(evidence, list):
                for item in evidence:
                    if isinstance(item, str):
                        evidence_urls.append(item)
                    elif isinstance(item, dict):
                        url = item.get("url")
                        if isinstance(url, str):
                            evidence_urls.append(url)
            supporting = normalized.get("supporting_evidence")
            if isinstance(supporting, dict):
                url = supporting.get("url")
                if isinstance(url, str):
                    evidence_urls.append(url)
            normalized["evidence_urls"] = evidence_urls

        return normalized


class LinkCheckResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    claims: List[LinkCheckClaims] = Field(
        description="A list of checked claims with their statuses."
    )
    final_verdict: str = Field(
        default="unverified",
        description="An overall verdict on all the claims. This should be a concise summary of the overall assessment based on the individual claim statuses and evidence.",
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_result_shape(cls, data):
        if not isinstance(data, dict):
            return data

        normalized = dict(data)

        if "claims" not in normalized and isinstance(normalized.get("Claims"), list):
            normalized["claims"] = normalized["Claims"]

        if "claims" not in normalized:
            claim_block = normalized.get("claim")
            if isinstance(claim_block, dict):
                atomic_claims = claim_block.get("atomic_claims")
                if isinstance(atomic_claims, list):
                    normalized["claims"] = atomic_claims

        if "final_verdict" not in normalized and isinstance(
            normalized.get("FinalVerdict"), str
        ):
            normalized["final_verdict"] = normalized["FinalVerdict"]

        if "final_verdict" not in normalized:
            claims = normalized.get("claims")
            if isinstance(claims, list) and claims:
                statuses = [
                    item.get("status") for item in claims if isinstance(item, dict)
                ]
                if any(status == Status.FALSE.value for status in statuses):
                    normalized["final_verdict"] = Status.FALSE.value
                elif any(status == Status.TRUE.value for status in statuses):
                    normalized["final_verdict"] = Status.TRUE.value
                else:
                    normalized["final_verdict"] = Status.UNVERIFIED.value
            else:
                normalized["final_verdict"] = Status.UNVERIFIED.value

        return normalized
