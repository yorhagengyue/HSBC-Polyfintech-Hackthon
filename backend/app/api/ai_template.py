"""
AI Template API endpoints
Provides template-based AI analysis using prompt engineering
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging

from app.services.gemini_provider import GeminiProvider
from app.services.prompt_service import prompt_service

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Gemini provider
try:
    gemini = GeminiProvider()
except Exception as e:
    logger.error(f"Failed to initialize Gemini provider: {e}")
    gemini = None

class TemplateAnalysisRequest(BaseModel):
    template_name: str
    context: Dict[str, Any]
    expect_json: Optional[bool] = False

class RiskScoreRequest(BaseModel):
    portfolio: Dict[str, Any]
    user_risk_profile: str = "medium"

class AlertExplainRequest(BaseModel):
    alert: Dict[str, Any]
    user_risk_profile: str = "medium"
    portfolio_exposure: float = 0.0

@router.post("/analyze")
async def analyze_with_template(request: TemplateAnalysisRequest) -> JSONResponse:
    """
    Analyze using a specific prompt template
    """
    if not gemini:
        raise HTTPException(status_code=503, detail="AI service not available")
    
    try:
        result = await gemini.analyze_with_template(
            template_name=request.template_name,
            context=request.context
        )
        
        return JSONResponse({
            "success": True,
            **result
        })
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"Template not found: {request.template_name}")
    except Exception as e:
        logger.error(f"Template analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@router.post("/risk-score")
async def calculate_risk_score(request: RiskScoreRequest) -> JSONResponse:
    """
    Calculate portfolio risk score using template
    """
    if not gemini:
        raise HTTPException(status_code=503, detail="AI service not available")
    
    try:
        # Prepare context for the template
        context = {
            "portfolio_json": request.portfolio,
            "user_risk_profile": request.user_risk_profile
        }
        
        # Use risk_score template
        result = await gemini.analyze_with_template("risk_score", context)
        
        return JSONResponse({
            "success": True,
            "data": result.get("response"),
            "model": result.get("model"),
            "timestamp": result.get("timestamp")
        })
        
    except Exception as e:
        logger.error(f"Risk score error: {e}")
        raise HTTPException(status_code=500, detail=f"Risk calculation error: {str(e)}")

@router.post("/explain-alert")
async def explain_alert(request: AlertExplainRequest) -> JSONResponse:
    """
    Explain an alert using template
    """
    if not gemini:
        raise HTTPException(status_code=503, detail="AI service not available")
    
    try:
        # Prepare context for the template
        event = request.alert
        context = {
            "event": event,
            "user_risk_profile": request.user_risk_profile,
            "portfolio_exposure": request.portfolio_exposure
        }
        
        # Use alert_explain template
        result = await gemini.analyze_with_template("alert_explain", context)
        
        return JSONResponse({
            "success": True,
            "explanation": result.get("response"),
            "model": result.get("model"),
            "timestamp": result.get("timestamp")
        })
        
    except Exception as e:
        logger.error(f"Alert explanation error: {e}")
        raise HTTPException(status_code=500, detail=f"Explanation error: {str(e)}")

@router.get("/templates")
async def list_templates() -> JSONResponse:
    """
    List available prompt templates
    """
    try:
        import os
        templates_dir = prompt_service.prompts_dir / "tasks"
        
        templates = []
        if templates_dir.exists():
            for file in templates_dir.iterdir():
                if file.suffix == ".md":
                    templates.append({
                        "name": file.stem,
                        "file": file.name,
                        "description": _get_template_description(file.stem)
                    })
        
        return JSONResponse({
            "success": True,
            "templates": templates,
            "count": len(templates)
        })
        
    except Exception as e:
        logger.error(f"Template listing error: {e}")
        raise HTTPException(status_code=500, detail=f"Listing error: {str(e)}")

@router.get("/template/{template_name}")
async def get_template_info(template_name: str) -> JSONResponse:
    """
    Get information about a specific template
    """
    try:
        # Load the template to check if it exists
        template_content = prompt_service.load_task_template(template_name)
        
        # Extract variables from template
        import re
        variables = list(set(re.findall(r'\{\{([^}]+)\}\}', template_content)))
        
        return JSONResponse({
            "success": True,
            "template_name": template_name,
            "variables": variables,
            "description": _get_template_description(template_name),
            "preview": template_content[:500] + "..." if len(template_content) > 500 else template_content
        })
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Template not found: {template_name}")
    except Exception as e:
        logger.error(f"Template info error: {e}")
        raise HTTPException(status_code=500, detail=f"Info error: {str(e)}")

def _get_template_description(template_name: str) -> str:
    """Get description for a template"""
    descriptions = {
        "risk_score": "Calculate comprehensive portfolio risk score with HSBC recommendations",
        "alert_explain": "Explain financial alerts with market impact and action recommendations",
        "market_analysis": "Provide detailed market analysis with opportunities and risks",
        "portfolio_recommendation": "Generate personalized portfolio allocation recommendations"
    }
    return descriptions.get(template_name, "Financial analysis template")

@router.get("/config")
async def get_prompt_config() -> JSONResponse:
    """
    Get current prompt configuration
    """
    try:
        config = {
            "system_role": prompt_service.system_config.get("role"),
            "principles": prompt_service.system_config.get("principles"),
            "risk_tiers": prompt_service.system_config.get("risk_allocation_tiers"),
            "strict_mode": gemini.strict_mode if gemini else None,
            "temperature": gemini.generation_config.get("temperature") if gemini else None,
            "top_p": gemini.generation_config.get("top_p") if gemini else None
        }
        
        return JSONResponse({
            "success": True,
            "configuration": config
        })
        
    except Exception as e:
        logger.error(f"Config error: {e}")
        raise HTTPException(status_code=500, detail=f"Config error: {str(e)}")

@router.post("/test-json")
async def test_json_generation() -> JSONResponse:
    """
    Test JSON generation capability
    """
    if not gemini:
        raise HTTPException(status_code=503, detail="AI service not available")
    
    try:
        test_prompt = """
        Generate a sample portfolio analysis in JSON format:
        {
            "total_value": <number>,
            "risk_score": <number 0-100>,
            "top_holdings": [
                {"symbol": "<string>", "value": <number>, "percentage": <number>}
            ],
            "recommendation": "<string>"
        }
        """
        
        result = await gemini.generate_json_response(test_prompt)
        
        return JSONResponse({
            "success": True,
            "generated_json": result,
            "valid": True
        })
        
    except Exception as e:
        logger.error(f"JSON test error: {e}")
        raise HTTPException(status_code=500, detail=f"JSON generation error: {str(e)}") 