"""
Session Management Service
Manages conversation state across multiple interactions
"""
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import redis.asyncio as aioredis
from app.models.llm_models import SessionState

logger = logging.getLogger(__name__)

class SessionService:
    """Service for managing conversation sessions"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self._redis = None
        self._connected = False
    
    async def connect(self):
        """Connect to Redis"""
        try:
            self._redis = await aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            self._connected = True
            logger.info("Connected to Redis for session management")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self._connected = False
    
    async def get_or_create_session(self, session_id: str, user_id: Optional[str] = None) -> SessionState:
        """Get existing session or create new one"""
        if not self._connected:
            # Fallback to in-memory session
            return SessionState(session_id=session_id, user_id=user_id)
        
        try:
            # Try to get existing session
            session_data = await self._redis.get(f"session:{session_id}")
            if session_data:
                data = json.loads(session_data)
                # Convert datetime strings back to datetime objects
                data['created_at'] = datetime.fromisoformat(data['created_at'])
                data['updated_at'] = datetime.fromisoformat(data['updated_at'])
                return SessionState(**data)
            
            # Create new session
            session = SessionState(session_id=session_id, user_id=user_id)
            await self.save_session(session)
            return session
            
        except Exception as e:
            logger.error(f"Session get/create error: {e}")
            return SessionState(session_id=session_id, user_id=user_id)
    
    async def save_session(self, session: SessionState, ttl: int = 3600):
        """Save session to Redis with TTL"""
        if not self._connected:
            return
        
        try:
            # Convert to JSON-serializable format
            data = session.dict()
            data['created_at'] = data['created_at'].isoformat()
            data['updated_at'] = data['updated_at'].isoformat()
            
            await self._redis.setex(
                f"session:{session.session_id}",
                ttl,
                json.dumps(data)
            )
        except Exception as e:
            logger.error(f"Session save error: {e}")
    
    async def update_session_context(self, session_id: str, user_message: str, ai_response: str):
        """Update session with new conversation turn"""
        session = await self.get_or_create_session(session_id)
        
        # Add to conversation context
        session.conversation_context.append({
            "user": user_message,
            "assistant": ai_response,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Keep only last 10 turns
        if len(session.conversation_context) > 10:
            session.conversation_context = session.conversation_context[-10:]
        
        session.updated_at = datetime.utcnow()
        await self.save_session(session)
        
        return session
    
    async def extract_allocations_from_response(self, session_id: str, response: str):
        """Extract and update allocation percentages from AI response"""
        session = await self.get_or_create_session(session_id)
        
        # Simple regex patterns to extract percentages
        import re
        
        # Look for crypto allocation
        crypto_pattern = r'crypto[^\d]*(\d+(?:\.\d+)?)\s*%'
        crypto_match = re.search(crypto_pattern, response.lower())
        if crypto_match:
            session.update_allocation("crypto", float(crypto_match.group(1)))
        
        # Look for stock allocation
        stock_pattern = r'(?:stock|equity)[^\d]*(\d+(?:\.\d+)?)\s*%'
        stock_match = re.search(stock_pattern, response.lower())
        if stock_match:
            session.update_allocation("stocks", float(stock_match.group(1)))
        
        # Look for risk level mentions
        if "conservative" in response.lower() or "low risk" in response.lower():
            session.risk_level = "low"
        elif "aggressive" in response.lower() or "high risk" in response.lower():
            session.risk_level = "high"
        
        await self.save_session(session)
        return session
    
    async def get_session_summary(self, session_id: str) -> Dict[str, Any]:
        """Get summary of session state"""
        session = await self.get_or_create_session(session_id)
        
        return {
            "session_id": session.session_id,
            "risk_level": session.risk_level,
            "last_crypto_pct": session.last_crypto_pct,
            "last_stock_pct": session.last_stock_pct,
            "conversation_turns": len(session.conversation_context),
            "hsbc_products_mentioned": session.hsbc_products_mentioned,
            "last_updated": session.updated_at.isoformat()
        }
    
    async def clear_session(self, session_id: str):
        """Clear session data"""
        if not self._connected:
            return
        
        try:
            await self._redis.delete(f"session:{session_id}")
        except Exception as e:
            logger.error(f"Session clear error: {e}")
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self._redis:
            await self._redis.close()
            self._connected = False

# Global instance (will be initialized in app startup)
session_service = SessionService() 