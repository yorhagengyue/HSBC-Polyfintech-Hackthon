from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class UserPreferences(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Alert settings
    alert_threshold = Column(Float, default=3.0)  # Default 3% threshold
    
    # UI settings
    information_density = Column(String(20), default="detailed")  # 'compact' or 'detailed'
    theme = Column(String(20), default="dark")  # 'light' or 'dark'
    
    # Risk settings
    low_risk_mode = Column(Boolean, default=False)
    
    # Notification settings
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="preferences")
    
    def __repr__(self):
        return f"<UserPreferences(user_id={self.user_id}, threshold={self.alert_threshold}%)>" 