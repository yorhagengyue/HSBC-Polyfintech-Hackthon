from fastapi import APIRouter, status
from datetime import datetime

router = APIRouter()

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Check if the API is running and healthy"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Financial Alarm Clock API"
    }

@router.get("/hello")
async def hello():
    """Simple hello endpoint"""
    return {"message": "Hello from Financial Alarm Clock! 🚨💰"} 