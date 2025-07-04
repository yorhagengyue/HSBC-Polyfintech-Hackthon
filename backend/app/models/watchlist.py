from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Watchlist(Base):
    __tablename__ = "watchlists"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Stock information
    symbol = Column(String(20), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    
    # Monitoring settings
    is_active = Column(Boolean, default=True)
    custom_threshold = Column(Float, nullable=True)  # Override user's default threshold
    
    # Stock data (cached)
    current_price = Column(Float, nullable=True)
    previous_close = Column(Float, nullable=True)
    change_percent = Column(Float, nullable=True)
    volume = Column(Integer, nullable=True)
    market_cap = Column(Float, nullable=True)
    
    # Timestamps
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_alert_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="watchlists")
    alerts = relationship("Alert", back_populates="watchlist", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Watchlist(user_id={self.user_id}, symbol='{self.symbol}', price=${self.current_price})>" 