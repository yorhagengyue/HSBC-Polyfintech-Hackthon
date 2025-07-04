"""
LLM Provider abstraction layer
Support for Gemini AI Studio and Ollama local models
Based on ai.md document architecture design
"""
import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import httpx
import asyncio
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

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

class BaseLLMProvider(ABC):
    """LLM Provider base class"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.provider_name = self.__class__.__name__
    
    @abstractmethod
    async def generate_content(self, prompt: str, context_id: Optional[str] = None) -> LLMResponse:
        """Generate content"""
        pass
    
    @abstractmethod
    async def create_context(self, documents: List[str]) -> LLMContext:
        """Create context cache"""
        pass
    
    @abstractmethod
    async def delete_context(self, context_id: str) -> bool:
        """Delete context cache"""
        pass

class GeminiProvider(BaseLLMProvider):
    """Google Gemini AI Studio Provider"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get('GEMINI_API_KEY')
        self.model = config.get('GEMINI_MODEL', 'gemini-2.0-flash-exp')
        
        # Initialize AI Studio authentication
        if self.api_key:
            os.environ['GEMINI_API_KEY'] = self.api_key
    
    async def generate_content(self, prompt: str, context_id: Optional[str] = None) -> LLMResponse:
        """Generate content using Gemini AI Studio API"""
        try:
            # Check if API key is available
            if not self.api_key:
                logger.error("Gemini API key not found")
                return LLMResponse(
                    content="Sorry, Gemini API key is not configured. Please check your environment variables.",
                    provider="error",
                    model=self.model,
                    tokens_used=0,
                    cost_estimate=0.0
                )
            
            # Import and initialize Gemini directly
            try:
                import google.generativeai as genai
                
                # Configure Gemini
                genai.configure(api_key=self.api_key)
                
                # Create model
                model = genai.GenerativeModel(
                    model_name=self.model,
                    system_instruction="""You are a professional AI Financial Advisor for HSBC's Financial Alarm Clock application. 

GUIDELINES:
- Provide direct, actionable financial advice in 150-250 words
- Focus on specific recommendations without lengthy explanations
- Include 1-2 relevant HSBC products naturally
- Use bullet points for clarity
- Avoid repetitive disclaimers and excessive detail

RESPONSE FORMAT:
- Brief market insight (1-2 sentences)
- 2-3 specific recommendations with clear actions
- 1 relevant HSBC product suggestion
- One clear next step

TONE: Professional but concise, like a quick expert consultation."""
                )
                
                # Generate response
                response = await asyncio.to_thread(
                    model.generate_content,
                    prompt
                )
                
                # Calculate cost estimate
                input_tokens = len(prompt.split()) * 1.3
                output_tokens = len(response.text.split()) * 1.3
                cost = (input_tokens * 0.075 + output_tokens * 0.30) / 1000000
                
                return LLMResponse(
                    content=response.text,
                    provider="gemini-ai-studio",
                    model=self.model,
                    context_id=context_id,
                    tokens_used=int(input_tokens + output_tokens),
                    cost_estimate=cost
                )
                
            except ImportError as e:
                logger.error(f"Google AI library not available: {e}")
                return LLMResponse(
                    content="Sorry, Google AI library is not installed. Please install: pip install google-generativeai",
                    provider="error",
                    model=self.model,
                    tokens_used=0,
                    cost_estimate=0.0
                )
            
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return LLMResponse(
                content=f"Sorry, I encountered an error while processing your request: {str(e)}",
                provider="error",
                model=self.model,
                tokens_used=0,
                cost_estimate=0.0
            )
    
    async def create_context(self, documents: List[str]) -> LLMContext:
        """Create Gemini context cache"""
        try:
            logger.info(f"Creating context cache for {len(documents)} documents")
            
            # Mock context creation
            context_id = f"ctx_{int(asyncio.get_event_loop().time())}"
            token_count = sum(len(doc.split()) for doc in documents)
            
            return LLMContext(
                context_id=context_id,
                created_at="2025-01-10T10:00:00Z",
                expires_at="2025-01-10T12:00:00Z",
                token_count=token_count
            )
        except Exception as e:
            logger.error(f"Context creation error: {e}")
            raise
    
    async def delete_context(self, context_id: str) -> bool:
        """Delete context cache"""
        try:
            logger.info(f"Deleting context: {context_id}")
            return True
        except Exception as e:
            logger.error(f"Context deletion error: {e}")
            return False
    
    async def _fallback_to_local(self, prompt: str) -> LLMResponse:
        """Fallback to local model"""
        logger.warning("Falling back to local model")
        return LLMResponse(
            content=f"[Local Fallback] {prompt[:50]}... (Network error, using local model response)",
            provider="local-fallback",
            model="mistral-7b",
            tokens_used=50,
            cost_estimate=0.0
        )

class OllamaProvider(BaseLLMProvider):
    """Ollama local Provider"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.base_url = config.get('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.model = config.get('OLLAMA_MODEL', 'mistral:7b')
    
    async def generate_content(self, prompt: str, context_id: Optional[str] = None) -> LLMResponse:
        """Generate content using Ollama API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return LLMResponse(
                        content=result.get('response', ''),
                        provider="ollama",
                        model=self.model,
                        tokens_used=len(result.get('response', '').split()),
                        cost_estimate=0.0
                    )
                else:
                    raise Exception(f"Ollama API error: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            return LLMResponse(
                content=f"Sorry, the local AI model is temporarily unavailable. Error: {str(e)}",
                provider="error",
                model=self.model,
                tokens_used=0,
                cost_estimate=0.0
            )
    
    async def create_context(self, documents: List[str]) -> LLMContext:
        """Ollama doesn't support context caching, return virtual context"""
        return LLMContext(
            context_id="ollama_no_cache",
            created_at="2025-01-10T10:00:00Z",
            expires_at="2025-01-10T10:00:00Z",
            token_count=0
        )
    
    async def delete_context(self, context_id: str) -> bool:
        """Ollama doesn't need to delete context"""
        return True

class LLMManager:
    """LLM Manager - Unified entry point"""
    
    def __init__(self):
        self.config = self._load_config()
        self.provider = self._initialize_provider()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from environment variables"""
        # Load .env file explicitly
        load_dotenv()
        
        config = {
            'LLM_PROVIDER': os.getenv('LLM_PROVIDER', 'gemini'),
            'USE_LOCAL_LLM': os.getenv('USE_LOCAL_LLM', 'false').lower() == 'true',
            'GEMINI_API_KEY': os.getenv('GEMINI_API_KEY'),
            'GEMINI_MODEL': os.getenv('GEMINI_MODEL', 'gemini-2.0-flash-exp'),
            'OLLAMA_BASE_URL': os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434'),
            'OLLAMA_MODEL': os.getenv('OLLAMA_MODEL', 'mistral:7b')
        }
        
        logger.info(f"Loaded config - Provider: {config['LLM_PROVIDER']}, Has Gemini Key: {bool(config['GEMINI_API_KEY'])}")
        return config
    
    def _initialize_provider(self) -> BaseLLMProvider:
        """Initialize LLM Provider"""
        provider_name = self.config['LLM_PROVIDER']
        use_local = self.config['USE_LOCAL_LLM']
        
        # Check if Gemini API key is available
        gemini_key = self.config.get('GEMINI_API_KEY')
        
        if provider_name == 'gemini' and gemini_key:
            logger.info("Initializing Gemini provider")
            return GeminiProvider(self.config)
        elif use_local or provider_name == 'ollama':
            logger.info("Initializing Ollama provider")
            return OllamaProvider(self.config)
        elif gemini_key:
            # Fallback to Gemini if available
            logger.info("Falling back to Gemini provider")
            return GeminiProvider(self.config)
        else:
            logger.warning(f"No valid provider configuration found, defaulting to Ollama")
            logger.warning(f"Unknown provider {provider_name}, defaulting to Ollama")
            return OllamaProvider(self.config)
    
    async def chat(self, prompt: str, context_id: Optional[str] = None) -> LLMResponse:
        """Unified chat interface"""
        return await self.provider.generate_content(prompt, context_id)
    
    async def analyze_document(self, documents: List[str], question: str) -> LLMResponse:
        """Document analysis interface"""
        # If it's Gemini, create context cache first
        context_id = None
        if isinstance(self.provider, GeminiProvider):
            context = await self.provider.create_context(documents)
            context_id = context.context_id
        
        # Build analysis prompt
        prompt = f"""
Based on the following document content, answer the question:

Question: {question}

Please provide detailed analysis and recommendations.
"""
        
        return await self.provider.generate_content(prompt, context_id)
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Get current Provider information"""
        return {
            'provider': self.provider.provider_name,
            'model': getattr(self.provider, 'model', 'unknown'),
            'config': {k: v for k, v in self.config.items() if 'KEY' not in k and 'CREDENTIALS' not in k}
        }

# Global instance
llm_manager = LLMManager() 