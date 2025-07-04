from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserPreferencesBase(BaseModel):
    alert_threshold: float = Field(default=3.0, ge=0.1, le=20.0, description="Alert threshold percentage")
    information_density: str = Field(default="detailed", pattern="^(compact|detailed)$")
    theme: str = Field(default="dark", pattern="^(light|dark)$")
    low_risk_mode: bool = Field(default=False)
    email_notifications: bool = Field(default=True)
    push_notifications: bool = Field(default=True)

class UserPreferencesCreate(UserPreferencesBase):
    pass

class UserPreferencesUpdate(BaseModel):
    alert_threshold: Optional[float] = Field(None, ge=0.1, le=20.0)
    information_density: Optional[str] = Field(None, pattern="^(compact|detailed)$")
    theme: Optional[str] = Field(None, pattern="^(light|dark)$")
    low_risk_mode: Optional[bool] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None

class UserPreferencesResponse(UserPreferencesBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True 