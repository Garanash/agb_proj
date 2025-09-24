from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# API Key schemas
class ApiKeyBase(BaseModel):
    name: str
    provider: str
    is_active: bool = True

class ApiKeyCreate(ApiKeyBase):
    key: str

class ApiKeyUpdate(BaseModel):
    name: Optional[str] = None
    provider: Optional[str] = None
    key: Optional[str] = None
    is_active: Optional[bool] = None

class ApiKeyResponse(ApiKeyBase):
    id: int
    created_at: datetime
    last_used: Optional[datetime] = None
    created_by: int

    class Config:
        from_attributes = True

# AI Processing schemas
class AIMatchingRequest(BaseModel):
    message: str
    files: Optional[List[str]] = None

class MatchingResult(BaseModel):
    id: str
    contractor_article: str
    description: str
    matched: bool
    agb_article: Optional[str] = None
    bl_article: Optional[str] = None
    match_confidence: Optional[float] = None
    packaging_factor: Optional[float] = None
    recalculated_quantity: Optional[float] = None
    nomenclature: Optional[dict] = None

class AIMatchingResponse(BaseModel):
    message: str
    matching_results: Optional[List[MatchingResult]] = None
    processing_time: Optional[float] = None
    status: str
