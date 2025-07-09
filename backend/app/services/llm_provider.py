"""
LLM Provider abstraction layer
Enhanced with structured outputs, session management, and cost tracking
"""
import os
import json
import logging
import time
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import httpx
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# Import our new services
from app.services.prompt_service import prompt_service
from app.services.product_mapping_service import product_mapper
from app.services.session_service import session_service
from app.services.cost_tracking_service import cost_tracker
from app.models.llm_models import LLMErrorEnum, FinancialAnalysisResponse

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
    structured_response: Optional[Dict[str, Any]] = None
    usage_metadata: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None

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
    async def generate_content(self, prompt: str, context_id: Optional[str] = None, **kwargs) -> LLMResponse:
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
    """Google Gemini AI Studio Provider - Enhanced"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get('GEMINI_API_KEY')
        self.model = config.get('GEMINI_MODEL', 'gemini-2.0-flash-exp')
        
        # Initialize AI Studio authentication
        if self.api_key:
            os.environ['GEMINI_API_KEY'] = self.api_key
        
        # TODO[PromptRefactor]: System instruction now loaded from template
        self.system_instruction = prompt_service.get_system_prompt()
    
    async def generate_content(
        self, 
        prompt: str, 
        context_id: Optional[str] = None,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None,
        expect_json: bool = False,
        template_name: Optional[str] = None,
        **kwargs
    ) -> LLMResponse:
        """Generate content using Gemini AI Studio API"""
        start_time = time.time()
        
        try:
            # Check if API key is available
            if not self.api_key:
                raise Exception("API key not configured", LLMErrorEnum.API_KEY_ERROR)
            
            # Import and initialize Gemini
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            
            # TODO[Session]: Get session state if session_id provided
            session_state = None
            if session_id:
                session_state = await session_service.get_or_create_session(session_id, user_id)
            
            # TODO[ProductMap]: Inject HSBC product based on query topic
            hsbc_product = product_mapper.get_relevant_product(prompt, str(session_state) if session_state else None)
            
            # Build enhanced prompt with session context
            enhanced_prompt = await self._build_enhanced_prompt(
                prompt, 
                session_state, 
                hsbc_product, 
                template_name,
                expect_json
            )
            
            # Create model with appropriate configuration
            generation_config = {
                "temperature": prompt_service.system_config['response_constraints']['temperature_strict'],
                "top_p": prompt_service.system_config['response_constraints']['top_p_strict'],
                "max_output_tokens": prompt_service.system_config['response_constraints']['max_tokens'],
            }
            
            # FIXME[JSON]: Enforce JSON response if expected
            if expect_json:
                generation_config["response_mime_type"] = "application/json"
            
            model = genai.GenerativeModel(
                model_name=self.model,
                system_instruction=self.system_instruction,
                generation_config=generation_config
            )
            
            # Generate response with retry logic
            response = await self._generate_with_retry(model, enhanced_prompt, expect_json)
            
            # Extract usage metadata if available
            usage_metadata = None
            if hasattr(response, 'usage_metadata'):
                usage_metadata = {
                    'promptTokenCount': response.usage_metadata.prompt_token_count,
                    'candidatesTokenCount': response.usage_metadata.candidates_token_count,
                    'totalTokenCount': response.usage_metadata.total_token_count
                }
            
            # FIXME[Cost]: Use actual token counts from response
            if usage_metadata:
                input_tokens = usage_metadata['promptTokenCount']
                output_tokens = usage_metadata['candidatesTokenCount']
            else:
                # Fallback estimation
                input_tokens = len(enhanced_prompt.split()) * 1.3
                output_tokens = len(response.text.split()) * 1.3
            
            cost = cost_tracker.calculate_cost("gemini", self.model, int(input_tokens), int(output_tokens))
            
            # Parse structured response if JSON expected
            structured_response = None
            content = response.text
            
            if expect_json:
                try:
                    structured_response = json.loads(content)
                    # Validate against Pydantic model if template specifies one
                    if template_name == "financial_analysis_json":
                        validated = FinancialAnalysisResponse(**structured_response)
                        structured_response = validated.dict()
                except Exception as e:
                    logger.error(f"JSON parsing/validation error: {e}")
                    # Retry with explicit JSON instruction
                    retry_response = await self._generate_with_retry(
                        model, 
                        enhanced_prompt + "\n\nIMPORTANT: Output ONLY valid JSON, no markdown.",
                        True
                    )
                    content = retry_response.text
                    structured_response = json.loads(content)
            
            # Update session with response
            if session_id:
                await session_service.update_session_context(session_id, prompt, content)
                await session_service.extract_allocations_from_response(session_id, content)
            
            # Log usage for cost tracking
            response_time_ms = int((time.time() - start_time) * 1000)
            await cost_tracker.log_usage(
                user_id=user_id,
                session_id=session_id or "no-session",
                provider="gemini",
                model=self.model,
                input_tokens=int(input_tokens),
                output_tokens=int(output_tokens),
                cost_usd=cost,
                response_time_ms=response_time_ms,
                success=True,
                usage_metadata=usage_metadata
            )
            
            return LLMResponse(
                content=content,
                provider="gemini-ai-studio",
                model=self.model,
                context_id=context_id,
                tokens_used=int(input_tokens + output_tokens),
                cost_estimate=cost,
                structured_response=structured_response,
                usage_metadata=usage_metadata,
                session_id=session_id
            )
            
        except Exception as e:
            error_type = self._classify_error(e)
            logger.error(f"Gemini API error ({error_type}): {e}")
            
            # Log failed usage
            if 'start_time' in locals():
                await cost_tracker.log_usage(
                    user_id=user_id,
                    session_id=session_id or "no-session",
                    provider="gemini",
                    model=self.model,
                    input_tokens=0,
                    output_tokens=0,
                    cost_usd=0.0,
                    response_time_ms=int((time.time() - start_time) * 1000),
                    success=False,
                    error_type=error_type.value
                )
            
            # TODO[ErrorType]: Handle different error types appropriately
            return await self._handle_error(e, error_type, prompt, context_id)
    
    async def _build_enhanced_prompt(
        self,
        prompt: str,
        session_state,
        hsbc_product: Dict[str, str],
        template_name: Optional[str],
        expect_json: bool
    ) -> str:
        """Build enhanced prompt with context"""
        if template_name:
            # Use template-based prompt
            context = {
                "query": prompt,
                "risk_profile": session_state.risk_level if session_state else "medium",
                "session_context": str(session_state.conversation_context[-3:]) if session_state else "",
                "hsbc_product": hsbc_product,
                "crypto_allocation": session_state.last_crypto_pct or self._get_default_allocation("crypto", session_state.risk_level if session_state else "medium"),
                "stock_allocation": session_state.last_stock_pct or self._get_default_allocation("stocks", session_state.risk_level if session_state else "medium"),
                "bond_allocation": self._get_default_allocation("bonds", session_state.risk_level if session_state else "medium"),
                "data_source": "Real-time market data"
            }
            return prompt_service.render_template(template_name, context)
        else:
            # Build prompt with session context
            prompt_parts = []
            
            # Add session context if available
            if session_state:
                prompt_parts.append(f"User Risk Profile: {session_state.risk_level}")
                if session_state.last_crypto_pct:
                    prompt_parts.append(f"Previous crypto allocation: {session_state.last_crypto_pct}%")
                if session_state.last_stock_pct:
                    prompt_parts.append(f"Previous stock allocation: {session_state.last_stock_pct}%")
            
            prompt_parts.append(f"\nUser Query: {prompt}")
            
            # Add HSBC product context
            prompt_parts.append(f"\nRelevant HSBC Product: {hsbc_product['name']} - {hsbc_product['benefit']}")
            
            if expect_json:
                prompt_parts.append("\nReturn response as valid JSON following the schema provided.")
            
            return "\n".join(prompt_parts)
    
    def _get_default_allocation(self, asset_type: str, risk_level: str) -> float:
        """Get default allocation based on risk level"""
        allocations = {
            "low": {"crypto": 1.0, "stocks": 30.0, "bonds": 60.0},
            "medium": {"crypto": 3.0, "stocks": 50.0, "bonds": 40.0},
            "high": {"crypto": 7.0, "stocks": 70.0, "bonds": 20.0}
        }
        return allocations.get(risk_level, allocations["medium"]).get(asset_type, 0.0)
    
    async def _generate_with_retry(self, model, prompt: str, expect_json: bool, max_retries: int = 2):
        """Generate content with retry logic"""
        last_error = None
        
        for attempt in range(max_retries):
            try:
                response = await asyncio.to_thread(model.generate_content, prompt)
                
                # Validate JSON if expected
                if expect_json:
                    json.loads(response.text)  # Will raise if invalid
                
                return response
                
            except json.JSONDecodeError as e:
                last_error = e
                if attempt < max_retries - 1:
                    # Add more explicit JSON instruction
                    prompt = prompt + "\n\nPrevious response was not valid JSON. Please output ONLY valid JSON."
                    await asyncio.sleep(1)  # Brief delay before retry
                continue
                
            except Exception as e:
                last_error = e
                error_type = self._classify_error(e)
                
                if error_type == LLMErrorEnum.RATE_LIMIT and attempt < max_retries - 1:
                    # Exponential backoff for rate limits
                    await asyncio.sleep(2 ** attempt)
                    continue
                elif error_type == LLMErrorEnum.NETWORK_ERROR and attempt < max_retries - 1:
                    await asyncio.sleep(1)
                    continue
                else:
                    raise
        
        raise last_error or Exception("Max retries exceeded")
    
    def _classify_error(self, error: Exception) -> LLMErrorEnum:
        """Classify error type for appropriate handling"""
        error_str = str(error).lower()
        
        if "rate limit" in error_str or "quota" in error_str:
            return LLMErrorEnum.RATE_LIMIT
        elif "network" in error_str or "connection" in error_str or "timeout" in error_str:
            return LLMErrorEnum.NETWORK_ERROR
        elif "api key" in error_str or "authentication" in error_str:
            return LLMErrorEnum.API_KEY_ERROR
        elif "json" in error_str or "validation" in error_str:
            return LLMErrorEnum.VALIDATION_ERROR
        elif "context" in error_str:
            return LLMErrorEnum.CONTEXT_ERROR
        else:
            return LLMErrorEnum.UNKNOWN_ERROR
    
    async def _handle_error(self, error: Exception, error_type: LLMErrorEnum, prompt: str, context_id: Optional[str]) -> LLMResponse:
        """Handle errors based on type"""
        if error_type == LLMErrorEnum.RATE_LIMIT:
            return LLMResponse(
                content="I'm experiencing high demand. Please try again in a moment. For immediate assistance, contact HSBC Premier support.",
                provider="error",
                model=self.model,
                tokens_used=0,
                cost_estimate=0.0
            )
        elif error_type == LLMErrorEnum.NETWORK_ERROR:
            # Fallback to cached response or simple answer
            return await self._fallback_to_local(prompt)
        elif error_type == LLMErrorEnum.API_KEY_ERROR:
            return LLMResponse(
                content="Configuration error. Please contact support with error code: AUTH_001",
                provider="error",
                model=self.model,
                tokens_used=0,
                cost_estimate=0.0
            )
        else:
            return LLMResponse(
                content=f"I encountered an issue processing your request. Please try rephrasing or contact HSBC support. Error: {error_type.value}",
                provider="error",
                model=self.model,
                tokens_used=0,
                cost_estimate=0.0
            )
    
    async def create_context(self, documents: List[str]) -> LLMContext:
        """Create Gemini context cache"""
        try:
            logger.info(f"Creating context cache for {len(documents)} documents")
            
            # Mock context creation for now
            context_id = f"ctx_{int(asyncio.get_event_loop().time())}"
            token_count = sum(len(doc.split()) for doc in documents)
            
            return LLMContext(
                context_id=context_id,
                created_at=datetime.utcnow().isoformat(),
                expires_at=datetime.utcnow().isoformat(),
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
        """Fallback to cached or simple response"""
        logger.warning("Using fallback response due to network error")
        
        # Simple rule-based fallback
        fallback_responses = {
            "crypto": "Based on general market conditions, crypto allocations typically range from 1-2% (conservative) to 5-10% (aggressive). Consider HSBC Digital Asset Custody for secure storage.",
            "stock": "Stock allocations vary by risk profile: 30% (conservative), 50% (moderate), 70% (aggressive). HSBC InvestDirect offers comprehensive trading tools.",
            "risk": "Your risk profile determines optimal allocation. HSBC Wealth Management can provide personalized assessment and recommendations.",
        }
        
        # Find matching fallback
        prompt_lower = prompt.lower()
        for key, response in fallback_responses.items():
            if key in prompt_lower:
                return LLMResponse(
                    content=f"[Offline Mode] {response}",
                    provider="fallback",
                    model="rule-based",
                    tokens_used=50,
                    cost_estimate=0.0
                )
        
        # Generic fallback
        return LLMResponse(
            content="[Offline Mode] I'm temporarily unable to access real-time data. Please visit your nearest HSBC branch or call Premier support for immediate assistance.",
            provider="fallback",
            model="rule-based",
            tokens_used=30,
            cost_estimate=0.0
        )

class OllamaProvider(BaseLLMProvider):
    """Ollama local Provider"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.base_url = config.get('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.model = config.get('OLLAMA_MODEL', 'mistral:7b')
    
    async def generate_content(
        self, 
        prompt: str, 
        context_id: Optional[str] = None,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None,
        expect_json: bool = False,
        **kwargs
    ) -> LLMResponse:
        """Generate content using Ollama API"""
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient() as client:
                # Add system prompt for consistency
                full_prompt = f"{prompt_service.get_system_prompt()}\n\n{prompt}"
                
                if expect_json:
                    full_prompt += "\n\nReturn response as valid JSON only."
                
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": full_prompt,
                        "stream": False,
                        "format": "json" if expect_json else None
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result.get('response', '')
                    
                    # Parse JSON if expected
                    structured_response = None
                    if expect_json:
                        try:
                            structured_response = json.loads(content)
                        except json.JSONDecodeError:
                            logger.error("Ollama returned invalid JSON")
                    
                    # Log usage
                    tokens = len(content.split())
                    await cost_tracker.log_usage(
                        user_id=user_id,
                        session_id=session_id or "no-session",
                        provider="ollama",
                        model=self.model,
                        input_tokens=len(full_prompt.split()),
                        output_tokens=tokens,
                        cost_usd=0.0,  # Local model is free
                        response_time_ms=int((time.time() - start_time) * 1000),
                        success=True
                    )
                    
                    return LLMResponse(
                        content=content,
                        provider="ollama",
                        model=self.model,
                        tokens_used=tokens,
                        cost_estimate=0.0,
                        structured_response=structured_response,
                        session_id=session_id
                    )
                else:
                    raise Exception(f"Ollama API error: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            
            # Log failed usage
            await cost_tracker.log_usage(
                user_id=user_id,
                session_id=session_id or "no-session",
                provider="ollama",
                model=self.model,
                input_tokens=0,
                output_tokens=0,
                cost_usd=0.0,
                response_time_ms=int((time.time() - start_time) * 1000),
                success=False,
                error_type=LLMErrorEnum.NETWORK_ERROR.value
            )
            
            return LLMResponse(
                content=f"Local AI model temporarily unavailable. Please try again or contact support.",
                provider="error",
                model=self.model,
                tokens_used=0,
                cost_estimate=0.0
            )
    
    async def create_context(self, documents: List[str]) -> LLMContext:
        """Ollama doesn't support context caching"""
        return LLMContext(
            context_id="ollama_no_cache",
            created_at=datetime.utcnow().isoformat(),
            expires_at=datetime.utcnow().isoformat(),
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
        gemini_key = self.config.get('GEMINI_API_KEY')
        
        if provider_name == 'gemini' and gemini_key:
            logger.info("Initializing Gemini provider")
            return GeminiProvider(self.config)
        elif use_local or provider_name == 'ollama':
            logger.info("Initializing Ollama provider")
            return OllamaProvider(self.config)
        elif gemini_key:
            logger.info("Falling back to Gemini provider")
            return GeminiProvider(self.config)
        else:
            logger.warning("No valid provider configuration, defaulting to Ollama")
            return OllamaProvider(self.config)
    
    async def chat(
        self, 
        prompt: str, 
        context_id: Optional[str] = None,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None,
        expect_json: bool = False,
        template_name: Optional[str] = None
    ) -> LLMResponse:
        """Unified chat interface with enhanced features"""
        return await self.provider.generate_content(
            prompt, 
            context_id=context_id,
            session_id=session_id,
            user_id=user_id,
            expect_json=expect_json,
            template_name=template_name
        )
    
    async def analyze_document(self, documents: List[str], question: str) -> LLMResponse:
        """Document analysis interface"""
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