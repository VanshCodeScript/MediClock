from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class InteractionCheckRequest(BaseModel):
    drugs: List[str]

class Alternative(BaseModel):
    """Represents a safer alternative medication."""
    drug: str
    reason: str

class AlternativeGroup(BaseModel):
    """Represents alternatives for a specific drug in the interaction."""
    drugName: str
    alternatives: List[Alternative]

class InteractionResponse(BaseModel):
    drugA: str
    drugB: str
    severity: str
    note: str
    mechanism: Optional[str] = None
    sideEffects: Optional[List[str]] = None
    recommendation: Optional[str] = None
    timeGap: Optional[str] = None
    confidence: Optional[float] = None
    alternatives: Optional[List[str]] = None
    dynamicRiskRating: Optional[float] = None  # 0-10 numeric score
    alternativesByDrug: Optional[List[AlternativeGroup]] = None  # Structured alternatives per drug

class InteractionsListResponse(BaseModel):
    interactions: List[InteractionResponse]

class DrugsListResponse(BaseModel):
    drugs: List[str]
