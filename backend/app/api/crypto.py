"""
Crypto API endpoints for real-time cryptocurrency data
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from ..services.crypto_data_service import crypto_service

router = APIRouter()

@router.get("/crypto/prices")
async def get_crypto_prices(symbols: str = "bitcoin,ethereum") -> Dict:
    """Get current cryptocurrency prices with citations"""
    try:
        symbol_list = [s.strip() for s in symbols.split(",")]
        data = await crypto_service.get_crypto_prices(symbol_list)
        return {
            "status": "success",
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/crypto/fear-greed")
async def get_fear_greed_index() -> Dict:
    """Get crypto fear and greed index"""
    try:
        data = await crypto_service.get_fear_greed_index()
        return {
            "status": "success",
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/crypto/trending")
async def get_trending_cryptos() -> Dict:
    """Get trending cryptocurrencies"""
    try:
        data = await crypto_service.get_trending_cryptos()
        return {
            "status": "success",
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/crypto/market-overview")
async def get_market_overview() -> Dict:
    """Get comprehensive crypto market overview"""
    try:
        data = await crypto_service.get_market_overview()
        return {
            "status": "success",
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 