from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    watchlist_id = Column(Integer, ForeignKey("watchlists.id"), nullable=False)
    
    # Alert details
    alert_type = Column(String(50), nullable=False)  # 'price_drop', 'volume_spike', 'news', etc.
    severity = Column(String(20), nullable=False)  # 'critical', 'warning', 'info'
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Price data at alert time
    trigger_price = Column(Float, nullable=False)
    previous_price = Column(Float, nullable=False)
    change_percent = Column(Float, nullable=False)
    threshold_used = Column(Float, nullable=False)
    
    # Status
    is_read = Column(Boolean, default=False)
    is_dismissed = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    dismissed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="alerts")
    watchlist = relationship("Watchlist", back_populates="alerts")
    
    def __repr__(self):
        return f"<Alert(id={self.id}, type='{self.alert_type}', severity='{self.severity}')>" 