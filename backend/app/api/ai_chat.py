"""
AI Chat API endpoints
Enhanced with structured outputs and session management
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import json
import logging
import uuid

from app.services.llm_provider import llm_manager, LLMResponse
from app.services.crypto_data_service import crypto_service
from app.services.session_service import session_service
from app.models.llm_models import FinancialAnalysisResponse

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    context_id: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = []
    analysis_mode: Optional[str] = "simple"  # "simple" or "deep"
    context: Optional[Dict[str, Any]] = None  # Additional context like news articles
    expect_json: Optional[bool] = False
    session_id: Optional[str] = None

class DocumentAnalysisRequest(BaseModel):
    documents: List[str]
    question: str

class ProviderSwitchRequest(BaseModel):
    provider: str  # "gemini", "ollama", "local"

@router.post("/chat")
async def chat_with_ai(
    request: ChatRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
) -> JSONResponse:
    """
    AI chat interface with enhanced features
    - Session management for consistent responses
    - Structured JSON output option
    - Real-time data injection
    """
    try:
        logger.info(f"AI chat request: {request.message[:50]}... Mode: {request.analysis_mode}")
        
        # Generate session ID if not provided
        if not request.session_id:
            request.session_id = str(uuid.uuid4())
        
        # Check if crypto data is needed
        crypto_keywords = ["crypto", "bitcoin", "btc", "ethereum", "eth", "cryptocurrency", "fear greed"]
        needs_crypto_data = any(keyword in request.message.lower() for keyword in crypto_keywords)
        
        crypto_context = ""
        if needs_crypto_data:
            try:
                # Fetch real-time crypto data
                market_data = await crypto_service.get_market_overview()
                
                # Format crypto data for prompt
                if "error" not in market_data:
                    crypto_context = "\n\n=== REAL-TIME CRYPTO DATA ===\n"
                    
                    # Add prices
                    if "prices" in market_data:
                        for coin, data in market_data["prices"].items():
                            if "error" not in data:
                                crypto_context += f"\n{coin.upper()}:"
                                crypto_context += f"\n  Price: ${data['price']:,.2f} [source: {data['source']}]"
                                crypto_context += f"\n  24h Change: {data['change_24h']:.2f}%"
                                crypto_context += f"\n  Market Cap: ${data['market_cap']:,.0f}"
                    
                    # Add fear greed index
                    if "fear_greed_index" in market_data:
                        fgi = market_data["fear_greed_index"]
                        if "error" not in fgi:
                            crypto_context += f"\n\nFear & Greed Index: {fgi['value']} ({fgi['classification']}) [source: {fgi['source']}]"
                    
                    crypto_context += "\n\n"
            except Exception as e:
                logger.error(f"Failed to fetch crypto data: {e}")
        
        # Build full prompt with crypto data
        full_message = request.message
        if crypto_context:
            full_message = f"{crypto_context}\nUser Query: {request.message}"
        
        # Determine if we should use a specific template
        template_name = None
        if request.expect_json:
            template_name = "financial_analysis_json"
        
        # Call LLM with enhanced features
        response = await llm_manager.chat(
            prompt=full_message,
            context_id=request.context_id,
            session_id=request.session_id,
            user_id=x_user_id,
            expect_json=request.expect_json,
            template_name=template_name
        )
        
        # Build response
        result = {
            "success": True,
            "response": response.content,
            "provider": response.provider,
            "model": response.model,
            "context_id": response.context_id,
            "session_id": response.session_id,
            "tokens_used": response.tokens_used,
            "cost_estimate": response.cost_estimate,
            "analysis_mode": request.analysis_mode
        }
        
        # Add structured data if available
        if response.structured_response:
            result["structured_data"] = response.structured_response
        
        # Add session summary
        if response.session_id:
            session_summary = await session_service.get_session_summary(response.session_id)
            result["session_info"] = session_summary
        
        # Add suggestion for deep analysis if in simple mode
        if request.analysis_mode == "simple" and not request.expect_json:
            result["response"] += "\n\n💡 **Want deeper insights?** Click 'Deep Analysis' for comprehensive market analysis with source verification."
        
        return JSONResponse(result)
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@router.post("/analyze-documents")
async def analyze_documents(request: DocumentAnalysisRequest) -> JSONResponse:
    """
    Document analysis interface
    Supports multi-document upload and intelligent analysis
    """
    try:
        logger.info(f"Document analysis request: {len(request.documents)} documents")
        
        # Call document analysis
        response = await llm_manager.analyze_document(request.documents, request.question)
        
        return JSONResponse({
            "success": True,
            "analysis": response.content,
            "provider": response.provider,
            "model": response.model,
            "context_id": response.context_id,
            "documents_processed": len(request.documents),
            "tokens_used": response.tokens_used,
            "cost_estimate": response.cost_estimate
        })
        
    except Exception as e:
        logger.error(f"Document analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Document analysis error: {str(e)}")

@router.post("/upload-document")
async def upload_document(file: UploadFile = File(...)) -> JSONResponse:
    """
    Document upload interface
    Supports PDF, TXT, JSON and other formats
    """
    try:
        # Check file type
        allowed_types = ['text/plain', 'application/pdf', 'application/json']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Read file content
        content = await file.read()
        
        # Process based on file type
        if file.content_type == 'text/plain':
            text_content = content.decode('utf-8')
        elif file.content_type == 'application/json':
            json_content = json.loads(content.decode('utf-8'))
            text_content = json.dumps(json_content, indent=2, ensure_ascii=False)
        elif file.content_type == 'application/pdf':
            # PDF parsing library needed here, return placeholder for now
            text_content = f"PDF file uploaded: {file.filename}\nContent extraction requires PyPDF2 library installation"
        else:
            text_content = content.decode('utf-8', errors='ignore')
        
        return JSONResponse({
            "success": True,
            "filename": file.filename,
            "content_type": file.content_type,
            "content": text_content[:1000] + ("..." if len(text_content) > 1000 else ""),
            "full_content": text_content,
            "size": len(content)
        })
        
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail=f"File upload error: {str(e)}")

@router.get("/provider-info")
async def get_provider_info() -> JSONResponse:
    """
    Get current LLM Provider information
    """
    try:
        info = llm_manager.get_provider_info()
        return JSONResponse({
            "success": True,
            "provider_info": info
        })
    except Exception as e:
        logger.error(f"Provider info error: {e}")
        raise HTTPException(status_code=500, detail=f"Provider info error: {str(e)}")

@router.post("/switch-provider")
async def switch_provider(request: ProviderSwitchRequest) -> JSONResponse:
    """
    Switch LLM Provider
    For demonstrating different model effects
    """
    try:
        # Dynamic provider switching can be implemented here
        # Current version requires service restart to switch
        # Future versions can implement hot-swapping
        
        return JSONResponse({
            "success": True,
            "message": f"Provider switch request received: {request.provider}",
            "note": "Current version requires service restart to switch Provider",
            "current_provider": llm_manager.get_provider_info()["provider"]
        })
        
    except Exception as e:
        logger.error(f"Provider switch error: {e}")
        raise HTTPException(status_code=500, detail=f"Provider switch error: {str(e)}")

@router.post("/financial-analysis")
async def financial_analysis(
    symbol: str,
    analysis_type: str = "technical",  # technical, fundamental, risk
    timeframe: str = "1d",  # 1d, 1w, 1m, 3m
    session_id: Optional[str] = None,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
) -> JSONResponse:
    """
    Professional financial analysis interface
    Returns structured JSON analysis
    """
    try:
        # Generate session ID if not provided
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Build financial analysis prompt
        prompt = f"""
Analyze stock {symbol} with the following parameters:

Analysis Type: {analysis_type}
Time Frame: {timeframe}

Provide a structured financial analysis including:
1. Current market performance with data sources
2. Technical indicator analysis
3. Risk assessment based on user's profile
4. Investment recommendations with specific percentages
5. Relevant HSBC product recommendation

Return as structured JSON.
"""
        
        # Use JSON template for structured response
        response = await llm_manager.chat(
            prompt=prompt,
            session_id=session_id,
            user_id=x_user_id,
            expect_json=True,
            template_name="financial_analysis_json"
        )
        
        return JSONResponse({
            "success": True,
            "symbol": symbol,
            "analysis_type": analysis_type,
            "timeframe": timeframe,
            "analysis": response.structured_response or response.content,
            "provider": response.provider,
            "model": response.model,
            "session_id": session_id,
            "tokens_used": response.tokens_used,
            "cost_estimate": response.cost_estimate
        })
        
    except Exception as e:
        logger.error(f"Financial analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Financial analysis error: {str(e)}")

@router.get("/session/{session_id}")
async def get_session_info(session_id: str) -> JSONResponse:
    """
    Get session information and history
    """
    try:
        summary = await session_service.get_session_summary(session_id)
        return JSONResponse({
            "success": True,
            "session": summary
        })
    except Exception as e:
        logger.error(f"Session info error: {e}")
        raise HTTPException(status_code=500, detail=f"Session info error: {str(e)}")

@router.delete("/session/{session_id}")
async def clear_session(session_id: str) -> JSONResponse:
    """
    Clear session data
    """
    try:
        await session_service.clear_session(session_id)
        return JSONResponse({
            "success": True,
            "message": f"Session {session_id} cleared"
        })
    except Exception as e:
        logger.error(f"Session clear error: {e}")
        raise HTTPException(status_code=500, detail=f"Session clear error: {str(e)}")

@router.get("/health")
async def ai_health_check() -> JSONResponse:
    """
    AI service health check
    """
    try:
        # Simple health check
        test_response = await llm_manager.chat("Hello, are you working?")
        
        return JSONResponse({
            "success": True,
            "status": "healthy",
            "provider": test_response.provider,
            "model": test_response.model,
            "response_time": "< 1s",
            "test_response": test_response.content[:100] + "..."
        })
        
    except Exception as e:
        logger.error(f"AI health check error: {e}")
        return JSONResponse({
            "success": False,
            "status": "unhealthy",
            "error": str(e)
        }, status_code=503) 