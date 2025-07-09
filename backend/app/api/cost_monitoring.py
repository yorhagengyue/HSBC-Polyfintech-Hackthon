"""
Cost Monitoring API endpoints
Track and report LLM usage costs
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from typing import Optional
import logging

from app.services.cost_tracking_service import cost_tracker

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/usage/summary")
async def get_usage_summary(days: int = 7) -> JSONResponse:
    """
    Get usage summary for the last N days
    """
    try:
        summary = await cost_tracker.get_usage_summary(days)
        return JSONResponse({
            "success": True,
            "summary": summary
        })
    except Exception as e:
        logger.error(f"Usage summary error: {e}")
        raise HTTPException(status_code=500, detail=f"Usage summary error: {str(e)}")

@router.get("/usage/download")
async def download_usage_logs() -> FileResponse:
    """
    Download detailed usage logs as CSV
    """
    try:
        # Return the CSV file
        return FileResponse(
            path=cost_tracker.usage_file,
            filename="llm_usage.csv",
            media_type="text/csv"
        )
    except Exception as e:
        logger.error(f"Usage download error: {e}")
        raise HTTPException(status_code=500, detail=f"Usage download error: {str(e)}")

@router.get("/pricing")
async def get_pricing_info() -> JSONResponse:
    """
    Get current pricing information for all providers
    """
    try:
        pricing = {
            "gemini": {
                "gemini-2.0-flash-exp": {
                    "input_per_million": 0.075,
                    "output_per_million": 0.30,
                    "currency": "USD"
                },
                "gemini-1.5-pro": {
                    "input_per_million": 3.50,
                    "output_per_million": 10.50,
                    "currency": "USD"
                }
            },
            "ollama": {
                "all_models": {
                    "input_per_million": 0.0,
                    "output_per_million": 0.0,
                    "currency": "USD",
                    "note": "Local models are free"
                }
            }
        }
        
        return JSONResponse({
            "success": True,
            "pricing": pricing,
            "last_updated": "2025-01-10"
        })
    except Exception as e:
        logger.error(f"Pricing info error: {e}")
        raise HTTPException(status_code=500, detail=f"Pricing info error: {str(e)}") 