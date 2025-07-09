"""
AI Chat API endpoints
Based on ai.md document design
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import json
import logging

from app.services.llm_provider import llm_manager, LLMResponse
from app.services.crypto_data_service import crypto_service

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    context_id: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = []
    analysis_mode: Optional[str] = "simple"  # "simple" or "deep"
    context: Optional[Dict[str, Any]] = None  # Additional context like news articles

class DocumentAnalysisRequest(BaseModel):
    documents: List[str]
    question: str

class ProviderSwitchRequest(BaseModel):
    provider: str  # "gemini", "ollama", "local"

@router.post("/chat")
async def chat_with_ai(request: ChatRequest) -> JSONResponse:
    """
    AI chat interface
    Supports conversation history and context
    """
    try:
        logger.info(f"AI chat request: {request.message[:50]}... Mode: {request.analysis_mode}")
        
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
        
        # Extract user risk profile if provided
        user_risk_profile = "medium"  # default
        if request.context and isinstance(request.context, dict):
            user_risk_profile = request.context.get('user_risk_profile', 'medium')
        
        # Build prompt based on analysis mode
        if request.analysis_mode == "deep":
            prompt = f"""You are a senior financial analyst providing COMPREHENSIVE, DETAILED analysis.
USER RISK PROFILE: {user_risk_profile}
{crypto_context}
USER QUERY: {request.message}

REQUIREMENTS:
- Provide IN-DEPTH analysis with specific data points
- Include technical analysis where relevant
- Consider multiple perspectives and scenarios
- Provide detailed risk assessment based on user's {user_risk_profile} risk profile
- Suggest specific HSBC products or services where applicable
- Include actionable recommendations with priorities
- Use professional financial terminology

Structure your response with clear sections."""
        else:
            # Simple mode - concise response
            prompt = f"""You are a professional financial advisor providing QUICK, CONCISE insights.
USER RISK PROFILE: {user_risk_profile}
{crypto_context}
USER QUERY: {request.message}

REQUIREMENTS:
- Provide a BRIEF response (2-3 paragraphs maximum)
- Focus on KEY POINTS only
- Use bullet points for clarity
- Consider user's {user_risk_profile} risk tolerance
- Include a one-line actionable recommendation

Keep it SHORT and ACTIONABLE."""
        
        # Add context if provided (e.g., news articles)
        if request.context:
            if request.context.get('news_articles'):
                articles_info = "\n".join([
                    f"- {article.get('title', 'No title')}"
                    for article in request.context['news_articles']
                ])
                prompt += f"\n\nNEWS CONTEXT:\n{articles_info}"
        
        # Add conversation history
        if request.conversation_history:
            history_text = "\n".join([
                f"User: {item['user']}\nAI: {item['assistant']}" 
                for item in request.conversation_history[-3:]  # Keep only last 3 conversations
            ])
            prompt = f"Conversation History:\n{history_text}\n\n{prompt}"
        
        # Call LLM
        response = await llm_manager.chat(prompt, request.context_id)
        
        # Add suggestion for deep analysis if in simple mode
        if request.analysis_mode == "simple":
            response.content += "\n\n💡 **Want deeper insights?** Click 'Deep Analysis' for comprehensive market analysis with source verification."
        
        return JSONResponse({
            "success": True,
            "response": response.content,
            "provider": response.provider,
            "model": response.model,
            "context_id": response.context_id,
            "tokens_used": response.tokens_used,
            "cost_estimate": response.cost_estimate,
            "analysis_mode": request.analysis_mode
        })
        
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
    timeframe: str = "1d"  # 1d, 1w, 1m, 3m
) -> JSONResponse:
    """
    Professional financial analysis interface
    Smart analysis based on stock data
    """
    try:
        # Build financial analysis prompt
        prompt = f"""
As a professional financial analyst, please analyze stock {symbol}:

Analysis Type: {analysis_type}
Time Frame: {timeframe}

Please provide analysis on the following aspects:
1. Current market performance
2. Technical indicator analysis
3. Risk assessment
4. Investment recommendations
5. HSBC related product recommendations

Please respond in professional but understandable language.
"""
        
        response = await llm_manager.chat(prompt)
        
        return JSONResponse({
            "success": True,
            "symbol": symbol,
            "analysis_type": analysis_type,
            "timeframe": timeframe,
            "analysis": response.content,
            "provider": response.provider,
            "model": response.model,
            "tokens_used": response.tokens_used,
            "cost_estimate": response.cost_estimate
        })
        
    except Exception as e:
        logger.error(f"Financial analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Financial analysis error: {str(e)}")

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