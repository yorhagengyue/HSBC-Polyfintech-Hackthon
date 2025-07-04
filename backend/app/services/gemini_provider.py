"""
Google Gemini Provider Implementation for AI Studio
Based on ai.md document design using AI Studio API Key
"""
import os
import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import asyncio
import httpx
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GOOGLE_AI_AVAILABLE = True
except ImportError:
    GOOGLE_AI_AVAILABLE = False
    logger.warning("Google AI libraries not available. Install: pip install google-generativeai")

@dataclass
class LLMResponse:
    """Standard LLM response format"""
    content: str
    provider: str
    model: str
    context_id: Optional[str] = None
    tokens_used: int = 0
    cost_estimate: float = 0.0

@dataclass
class LLMContext:
    """Context cache information"""
    context_id: str
    created_at: str
    expires_at: str
    token_count: int

class GeminiProvider:
    """Google Gemini AI Studio Provider - Real Implementation"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.api_key = config.get('GEMINI_API_KEY')
        self.model_name = config.get('GEMINI_MODEL', 'gemini-2.0-flash-exp')
        
        # Initialize Gemini AI Studio
        self._initialize_gemini_ai()
        
        # Context cache
        self.context_cache = {}
        self.cache_ttl = config.get('GEMINI_CONTEXT_CACHE_TTL', 7200)  # 2 hours
    
    def _initialize_gemini_ai(self):
        """Initialize Gemini AI Studio"""
        try:
            if not GOOGLE_AI_AVAILABLE:
                raise ImportError("Google AI libraries not installed")
            
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY not provided")
            
            # Configure Gemini AI Studio
            genai.configure(api_key=self.api_key)
            
            # Test the connection
            models = list(genai.list_models())
            available_models = [m.name for m in models if 'generateContent' in m.supported_generation_methods]
            
            logger.info(f"✅ Gemini AI Studio initialized successfully")
            logger.info(f"📋 Available models: {len(available_models)}")
            
            self.initialized = True
            
        except Exception as e:
            logger.error(f"❌ Gemini AI Studio initialization failed: {e}")
            self.initialized = False
    
    async def generate_content(self, prompt: str, context_id: Optional[str] = None) -> LLMResponse:
        """Generate content using Gemini AI Studio API"""
        try:
            if not self.initialized:
                return await self._fallback_response(prompt, "Gemini AI Studio not initialized")
            
            logger.info(f"🤖 Generating content with Gemini AI Studio")
            
            # Create model instance
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction="You are a professional financial analyst assistant. Provide clear, accurate, and helpful financial advice in a professional manner."
            )
            
            # Build full prompt with context if available
            full_prompt = prompt
            if context_id and context_id in self.context_cache:
                cached_context = self.context_cache[context_id]
                full_prompt = f"{cached_context['content']}\n\nUser Question: {prompt}"
            
            # Configure generation parameters
            generation_config = genai.types.GenerationConfig(
                max_output_tokens=2048,
                temperature=0.7,
                top_p=0.8,
            )
            
            # Generate response asynchronously
            response = await asyncio.to_thread(
                model.generate_content,
                full_prompt,
                generation_config=generation_config
            )
            
            # Calculate cost estimate (Gemini 2.0 Flash pricing: $0.075/1M input, $0.30/1M output)
            input_tokens = len(full_prompt.split()) * 1.3  # Rough estimation
            output_tokens = len(response.text.split()) * 1.3
            cost = (input_tokens * 0.075 + output_tokens * 0.30) / 1000000
            
            return LLMResponse(
                content=response.text,
                provider="gemini-ai-studio",
                model=self.model_name,
                context_id=context_id,
                tokens_used=int(input_tokens + output_tokens),
                cost_estimate=cost
            )
            
        except Exception as e:
            logger.error(f"❌ Gemini AI Studio API error: {e}")
            return await self._fallback_response(prompt, str(e))
    
    async def create_context(self, documents: List[str]) -> LLMContext:
        """Create context cache for documents"""
        try:
            # Combine documents
            combined_content = "\n\n".join(documents)
            
            # Generate context ID
            context_id = f"ctx_{int(asyncio.get_event_loop().time())}"
            
            # Calculate expiration time
            created_at = datetime.now()
            expires_at = created_at + timedelta(seconds=self.cache_ttl)
            
            # Store in cache
            self.context_cache[context_id] = {
                'content': combined_content,
                'created_at': created_at.isoformat(),
                'expires_at': expires_at.isoformat(),
                'token_count': len(combined_content.split()) * 1.3
            }
            
            logger.info(f"📝 Created context cache: {context_id} ({len(documents)} documents)")
            
            return LLMContext(
                context_id=context_id,
                created_at=created_at.isoformat(),
                expires_at=expires_at.isoformat(),
                token_count=int(len(combined_content.split()) * 1.3)
            )
            
        except Exception as e:
            logger.error(f"❌ Context creation error: {e}")
            raise
    
    async def delete_context(self, context_id: str) -> bool:
        """Delete context cache"""
        try:
            if context_id in self.context_cache:
                del self.context_cache[context_id]
                logger.info(f"🗑️ Deleted context cache: {context_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"❌ Context deletion error: {e}")
            return False
    
    def _cleanup_expired_contexts(self):
        """Clean up expired context caches"""
        now = datetime.now()
        expired_contexts = []
        
        for context_id, context_data in self.context_cache.items():
            expires_at = datetime.fromisoformat(context_data['expires_at'])
            if now > expires_at:
                expired_contexts.append(context_id)
        
        for context_id in expired_contexts:
            del self.context_cache[context_id]
            logger.info(f"🕒 Expired context removed: {context_id}")
    
    async def _fallback_response(self, prompt: str, error: str) -> LLMResponse:
        """Fallback response when Gemini fails"""
        logger.warning(f"🔄 Using fallback response due to: {error}")
        
        return LLMResponse(
            content=f"""
I am the Financial Alarm Clock AI assistant, currently operating in local processing mode.

Your question: {prompt[:100]}...

**Basic Analysis Recommendations:**
- Regularly review your investment portfolio risk distribution
- Consider diversifying with HSBC's multi-asset products
- Monitor market trends and news developments
- Set reasonable stop-loss and profit targets

*Note: Currently in local mode. For detailed analysis, please contact HSBC professional advisors.*

Technical Info: {error}
""",
            provider="gemini-fallback",
            model="local-fallback",
            tokens_used=50,
            cost_estimate=0.0
        )
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Get provider information"""
        return {
            'provider': 'GeminiProvider',
            'model': self.model_name,
            'api_source': 'AI Studio',
            'initialized': self.initialized,
            'cached_contexts': len(self.context_cache),
            'cache_ttl_hours': self.cache_ttl / 3600,
            'has_api_key': bool(self.api_key)
        } 