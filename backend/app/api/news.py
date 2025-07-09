"""
News API endpoints
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime

from ..services.news_monitor import news_monitor, NewsArticle

router = APIRouter(tags=["news"])


@router.get("/market", response_model=List[dict])
async def get_market_news(
    category: str = Query("business", description="News category (business, technology, etc.)")
):
    """Get top market/business news"""
    try:
        articles = await news_monitor.get_market_news(category)
        return [article.to_dict() for article in articles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search", response_model=List[dict])
async def search_news(
    query: str = Query(..., description="Search query"),
    language: str = Query("en", description="Language code"),
    sort_by: str = Query("relevancy", description="Sort by: relevancy, popularity, publishedAt"),
    page_size: int = Query(20, ge=1, le=100, description="Number of results")
):
    """Search for news articles"""
    try:
        articles = await news_monitor.search_news(
            query=query,
            language=language,
            sort_by=sort_by,
            page_size=page_size
        )
        return [article.to_dict() for article in articles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/symbol/{symbol}", response_model=List[dict])
async def get_symbol_news(symbol: str):
    """Get news for a specific stock symbol"""
    try:
        articles = await news_monitor.get_symbol_news(symbol)
        return [article.to_dict() for article in articles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/monitor/{symbol}")
async def add_symbol_monitoring(
    symbol: str,
    keywords: Optional[List[str]] = None
):
    """Add a symbol to news monitoring"""
    try:
        news_monitor.add_symbol_monitoring(symbol, keywords)
        return {
            "status": "success",
            "message": f"Added {symbol} to news monitoring",
            "monitored_symbols": list(news_monitor.monitored_symbols)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/monitor/{symbol}")
async def remove_symbol_monitoring(symbol: str):
    """Remove a symbol from news monitoring"""
    try:
        news_monitor.remove_symbol_monitoring(symbol)
        return {
            "status": "success",
            "message": f"Removed {symbol} from news monitoring",
            "monitored_symbols": list(news_monitor.monitored_symbols)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monitor/symbols", response_model=List[str])
async def get_monitored_symbols():
    """Get list of symbols being monitored for news"""
    return list(news_monitor.monitored_symbols)


@router.get("/alerts")
async def get_news_alerts():
    """Get news alerts for monitored symbols"""
    try:
        alerts = await news_monitor.monitor_news_alerts()
        return {
            "alerts": alerts,
            "count": len(alerts),
            "monitored_symbols": list(news_monitor.monitored_symbols)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_news_api_status():
    """Get news API configuration status"""
    return {
        "api_key_configured": bool(news_monitor.api_key and news_monitor.api_key not in ["", "demo_mock_mode", "your_news_api_key_here"]),
        "api_key_preview": news_monitor.api_key[:10] + "..." if news_monitor.api_key and len(news_monitor.api_key) > 10 else news_monitor.api_key,
        "newsapi_client_initialized": news_monitor.newsapi is not None,
        "using_mock_data": news_monitor.newsapi is None,
        "cache_entries": len(news_monitor.cache)
    } 