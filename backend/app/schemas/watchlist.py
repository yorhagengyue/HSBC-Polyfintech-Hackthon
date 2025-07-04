from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class WatchlistBase(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10, description="Stock symbol")
    name: str = Field(..., min_length=1, max_length=100, description="Stock name")
    is_active: bool = Field(default=True)
    custom_threshold: Optional[float] = Field(None, ge=0.1, le=20.0, description="Custom alert threshold")

class WatchlistCreate(WatchlistBase):
    pass

class WatchlistUpdate(BaseModel):
    symbol: Optional[str] = Field(None, min_length=1, max_length=10)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None
    custom_threshold: Optional[float] = Field(None, ge=0.1, le=20.0)
    current_price: Optional[float] = None
    previous_close: Optional[float] = None
    change_percent: Optional[float] = None
    volume: Optional[int] = None
    market_cap: Optional[float] = None

class WatchlistResponse(WatchlistBase):
    id: int
    user_id: int
    current_price: Optional[float] = None
    previous_close: Optional[float] = None
    change_percent: Optional[float] = None
    volume: Optional[int] = None
    market_cap: Optional[float] = None
    added_at: datetime
    updated_at: Optional[datetime] = None
    last_alert_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True 