from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AlertBase(BaseModel):
    alert_type: str = Field(..., pattern="^(price_drop|volume_spike|news|custom)$")
    severity: str = Field(..., pattern="^(critical|warning|info)$")
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=1000)
    trigger_price: float = Field(..., description="Price that triggered the alert")
    previous_price: float = Field(..., description="Previous price before alert")
    change_percent: float = Field(..., description="Percentage change")
    threshold_used: float = Field(..., description="Threshold used for this alert")

class AlertCreate(AlertBase):
    watchlist_id: int = Field(..., description="Watchlist ID that triggered the alert")

class AlertUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_dismissed: Optional[bool] = None
    read_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None

class AlertResponse(AlertBase):
    id: int
    user_id: int
    watchlist_id: int
    is_read: bool
    is_dismissed: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True 