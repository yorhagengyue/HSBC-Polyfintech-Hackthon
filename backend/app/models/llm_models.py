"""
LLM-related data models and enums
"""
from enum import Enum
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

class LLMErrorEnum(Enum):
    """LLM error types for granular handling"""
    RATE_LIMIT = "rate_limit"
    NETWORK_ERROR = "network_error"
    VALIDATION_ERROR = "validation_error"
    API_KEY_ERROR = "api_key_error"
    CONTEXT_ERROR = "context_error"
    UNKNOWN_ERROR = "unknown_error"

class SessionState(BaseModel):
    """Session state for maintaining context across conversations"""
    session_id: str
    user_id: Optional[str] = None
    risk_level: Optional[str] = "medium"  # low, medium, high
    last_crypto_pct: Optional[float] = None
    last_stock_pct: Optional[float] = None
    conversation_context: List[Dict[str, str]] = Field(default_factory=list)
    hsbc_products_mentioned: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    def update_allocation(self, asset_type: str, percentage: float):
        """Update allocation percentages"""
        if asset_type == "crypto":
            self.last_crypto_pct = percentage
        elif asset_type == "stocks":
            self.last_stock_pct = percentage
        self.updated_at = datetime.utcnow()

class FinancialAnalysisResponse(BaseModel):
    """Structured response for financial analysis"""
    insight: str = Field(..., description="Brief market insight")
    recommendations: List[Dict[str, str]] = Field(..., description="Specific recommendations")
    hsbc_product: Dict[str, str] = Field(..., description="Relevant HSBC product")
    next_step: str = Field(..., description="Clear next step")
    risk_level: Optional[str] = None
    allocations: Optional[Dict[str, float]] = None
    sources: Optional[List[str]] = None
    
class RiskScoreResponse(BaseModel):
    """Structured response for risk score analysis"""
    risk_score: int = Field(..., ge=0, le=100)
    risk_label: str = Field(..., pattern="^(Low|Medium|High)$")
    volatility_exposure: float
    diversification_score: float = Field(..., ge=0, le=10)
    key_risks: List[str]
    mitigation_strategy: str
    hsbc_product_recommendation: str

class AlertExplanationResponse(BaseModel):
    """Structured response for alert explanations"""
    what_happened: str
    market_impact: Dict[str, str]  # immediate, short_term, long_term
    portfolio_impact: Dict[str, Any]
    recommended_actions: List[str]
    hsbc_solution: str
    disclaimer: str 