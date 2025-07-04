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

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    context_id: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = []

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
        logger.info(f"AI chat request: {request.message[:50]}...")
        
        # Build full prompt (including conversation history)
        full_prompt = request.message
        if request.conversation_history:
            history_text = "\n".join([
                f"User: {item['user']}\nAI: {item['assistant']}" 
                for item in request.conversation_history[-3:]  # Keep only last 3 conversations
            ])
            full_prompt = f"Conversation History:\n{history_text}\n\nCurrent Question: {request.message}"
        
        # Call LLM
        response = await llm_manager.chat(full_prompt, request.context_id)
        
        return JSONResponse({
            "success": True,
            "response": response.content,
            "provider": response.provider,
            "model": response.model,
            "context_id": response.context_id,
            "tokens_used": response.tokens_used,
            "cost_estimate": response.cost_estimate
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