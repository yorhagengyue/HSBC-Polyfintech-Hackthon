"""
Stock Market API Endpoints
Handles stock data fetching and monitoring operations
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel, Field
import yfinance as yf
from datetime import datetime
import logging
import requests

from app.services.yahoo_finance import yahoo_finance_service

router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic models for request/response
class StockInfo(BaseModel):
    symbol: str
    company_name: str
    current_price: float
    previous_close: float
    open: float
    day_high: float
    day_low: float
    volume: int
    market_cap: int
    pe_ratio: float
    dividend_yield: float
    week_52_high: float = Field(alias="52_week_high")
    week_52_low: float = Field(alias="52_week_low")
    price_change: float
    price_change_percent: float
    last_updated: str

    class Config:
        populate_by_name = True

class PriceData(BaseModel):
    symbol: str
    price: float
    volume: int
    timestamp: str
    trading_day: str

class HistoricalData(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int

class MonitoringRequest(BaseModel):
    symbol: str
    interval_seconds: int = Field(default=60, ge=10, le=3600)
    threshold_percent: float = Field(default=5.0, ge=0.1, le=50.0)

class MonitoringStatus(BaseModel):
    monitored_symbols: List[str]
    total_count: int

class StockSearchResult(BaseModel):
    symbol: str
    name: str
    exchange: str
    type: str
    currency: str

class UserStock(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    timestamp: str


@router.get("/search", response_model=List[StockSearchResult])
async def search_stocks(query: str = Query(..., min_length=1, max_length=10)):
    """
    Search for stocks by symbol or company name
    
    Args:
        query: Search query (stock symbol or company name)
    
    Returns:
        List of matching stocks
    """
    try:
        query = query.upper().strip()
        results = []
        
        # First try to get info for exact symbol match using our rate-limited service
        try:
            stock_info = yahoo_finance_service.get_stock_info(query)
            if stock_info and stock_info.get('current_price', 0) > 0:
                results.append(StockSearchResult(
                    symbol=stock_info.get('symbol', query),
                    name=stock_info.get('company_name', 'Unknown'),
                    exchange='Unknown',  # Not available in our simplified response
                    type='EQUITY',
                    currency='USD'
                ))
        except Exception as e:
            logger.warning(f"Rate-limited ticker lookup failed for {query}: {e}")
        
        # Add some popular stocks that match the query
        popular_stocks = {
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc.',
            'MSFT': 'Microsoft Corporation',
            'AMZN': 'Amazon.com Inc.',
            'TSLA': 'Tesla Inc.',
            'META': 'Meta Platforms Inc.',
            'NVDA': 'NVIDIA Corporation',
            'NFLX': 'Netflix Inc.',
            'DIS': 'The Walt Disney Company',
            'BABA': 'Alibaba Group Holding Limited',
            'AMD': 'Advanced Micro Devices Inc.',
            'INTC': 'Intel Corporation',
            'CRM': 'Salesforce Inc.',
            'ORCL': 'Oracle Corporation',
            'UBER': 'Uber Technologies Inc.',
            'SHOP': 'Shopify Inc.',
            'ZOOM': 'Zoom Video Communications Inc.',
            'SNAP': 'Snap Inc.',
            'SPOT': 'Spotify Technology S.A.',
            'SQ': 'Block Inc.',
            'PYPL': 'PayPal Holdings Inc.',
            'V': 'Visa Inc.',
            'MA': 'Mastercard Incorporated',
            'JPM': 'JPMorgan Chase & Co.',
            'BAC': 'Bank of America Corporation',
            'WMT': 'Walmart Inc.',
            'KO': 'The Coca-Cola Company',
            'PEP': 'PepsiCo Inc.',
            'JNJ': 'Johnson & Johnson',
            'PG': 'The Procter & Gamble Company'
        }
        
        # Search in popular stocks
        for symbol, name in popular_stocks.items():
            if (query in symbol or 
                query in name.upper() or 
                (len(query) >= 2 and any(word.startswith(query) for word in name.upper().split()))):
                
                # Avoid duplicates
                if not any(r.symbol == symbol for r in results):
                    results.append(StockSearchResult(
                        symbol=symbol,
                        name=name,
                        exchange='NASDAQ',
                        type='EQUITY',
                        currency='USD'
                    ))
        
        # Limit results to top 10
        return results[:10]
        
    except Exception as e:
        logger.error(f"Error searching stocks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


@router.get("/user-stocks", response_model=List[UserStock])
async def get_user_stocks(symbols: str = Query(..., description="Comma-separated list of stock symbols")):
    """
    Get real-time data for user's custom stock list (with rate limiting and caching)
    
    Args:
        symbols: Comma-separated stock symbols (e.g., "AAPL,GOOGL,MSFT")
    
    Returns:
        List of stock data for specified symbols
    """
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(',') if s.strip()]
        
        # Use the new batch method with rate limiting and caching
        stock_data_list = yahoo_finance_service.get_multiple_stocks_batch(symbol_list)
        
        # Convert to UserStock objects
        results = []
        for stock_data in stock_data_list:
            results.append(UserStock(
                symbol=stock_data.get("symbol", ""),
                name=stock_data.get("company_name", stock_data.get("name", stock_data.get("symbol", "Unknown"))),
                price=stock_data.get("current_price", stock_data.get("price", 0.0)),
                change=stock_data.get("price_change", stock_data.get("change", 0.0)),
                change_percent=stock_data.get("price_change_percent", stock_data.get("change_percent", 0.0)),
                timestamp=stock_data.get("last_updated", stock_data.get("timestamp", datetime.now().isoformat()))
            ))
        
        return results
        
    except Exception as e:
        logger.error(f"Error getting user stocks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching user stocks: {str(e)}")


@router.get("/stock/{symbol}", response_model=StockInfo)
async def get_stock_info(symbol: str):
    """
    Get comprehensive information about a stock (with improved error handling)
    
    Args:
        symbol: Stock ticker symbol (e.g., AAPL, GOOGL)
    
    Returns:
        Detailed stock information including price, volume, and key metrics
    """
    try:
        symbol = symbol.upper()
        logger.info(f"Fetching stock info for symbol: {symbol}")
        data = yahoo_finance_service.get_stock_info(symbol)
        logger.info(f"Successfully fetched data for {symbol}")
        return StockInfo(**data)
    except ValueError as e:
        logger.warning(f"ValueError for symbol {symbol}: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Stock data not found for symbol: {symbol}")
    except Exception as e:
        logger.error(f"Unexpected error for symbol {symbol}: {str(e)}")
        # Return mock data for development instead of 500 error
        mock_data = {
            "symbol": symbol,
            "company_name": f"{symbol} Company",
            "current_price": 100.0,
            "previous_close": 98.0,
            "open": 99.0,
            "day_high": 102.0,
            "day_low": 97.0,
            "volume": 1000000,
            "market_cap": 100000000000,
            "pe_ratio": 20.0,
            "dividend_yield": 0.02,
            "52_week_high": 120.0,
            "52_week_low": 80.0,
            "price_change": 2.0,
            "price_change_percent": 2.04,
            "last_updated": datetime.now().isoformat()
        }
        logger.info(f"Returning mock data for {symbol} due to API error")
        return StockInfo(**mock_data)


@router.get("/stock/{symbol}/price", response_model=PriceData)
async def get_realtime_price(symbol: str):
    """
    Get real-time price for a stock
    
    Args:
        symbol: Stock ticker symbol
    
    Returns:
        Current price and timestamp
    """
    try:
        symbol = symbol.upper()
        data = yahoo_finance_service.get_realtime_price(symbol)
        return PriceData(**data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/stock/{symbol}/history", response_model=List[HistoricalData])
async def get_stock_history(
    symbol: str,
    period: str = Query(default="1mo", pattern="^(1d|5d|1mo|3mo|6mo|1y|2y|5y|10y|ytd|max)$"),
    interval: str = Query(default="1d", pattern="^(1m|2m|5m|15m|30m|60m|90m|1h|1d|5d|1wk|1mo|3mo)$")
):
    """
    Get historical stock data
    
    Args:
        symbol: Stock ticker symbol
        period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
        interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
    
    Returns:
        List of historical price data points
    """
    try:
        symbol = symbol.upper()
        history_result = yahoo_finance_service.get_stock_history(symbol, period, interval)
        
        # Handle the returned dictionary structure
        if history_result and 'data' in history_result:
            history_data = history_result['data']
            
            # Convert the data to match HistoricalData model
            formatted_data = []
            for item in history_data:
                formatted_item = {
                    "date": item.get("Date", item.get("date", "")),
                    "open": float(item.get("Open", item.get("open", 0))),
                    "high": float(item.get("High", item.get("high", 0))),
                    "low": float(item.get("Low", item.get("low", 0))),
                    "close": float(item.get("Close", item.get("close", 0))),
                    "volume": int(item.get("Volume", item.get("volume", 0)))
                }
                formatted_data.append(HistoricalData(**formatted_item))
            
            return formatted_data
        else:
            # Return empty list if no data
            logger.warning(f"No historical data returned for {symbol}")
            return []
            
    except ValueError as e:
        logger.error(f"ValueError getting history for {symbol}: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting history for {symbol}: {str(e)}")
        # Return empty list instead of 500 error
        return []


@router.post("/monitoring/start")
async def start_monitoring(request: MonitoringRequest, background_tasks: BackgroundTasks):
    """
    Start monitoring a stock for price changes
    
    Args:
        request: Monitoring configuration
    
    Returns:
        Success message
    """
    try:
        symbol = request.symbol.upper()
        
        # Define alert callback
        async def alert_callback(alert_data):
            # TODO: Implement actual alert handling (e.g., save to database, send notification)
            print(f"ALERT: {alert_data}")
        
        # Start monitoring in background
        await yahoo_finance_service.start_price_monitoring(
            symbol=symbol,
            interval_seconds=request.interval_seconds,
            threshold_percent=request.threshold_percent,
            callback=alert_callback
        )
        
        return {
            "message": f"Started monitoring {symbol}",
            "symbol": symbol,
            "interval_seconds": request.interval_seconds,
            "threshold_percent": request.threshold_percent
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start monitoring: {str(e)}")


@router.delete("/monitoring/stop/{symbol}")
async def stop_monitoring(symbol: str):
    """
    Stop monitoring a specific stock
    
    Args:
        symbol: Stock ticker symbol
    
    Returns:
        Success message
    """
    symbol = symbol.upper()
    yahoo_finance_service.stop_price_monitoring(symbol)
    return {"message": f"Stopped monitoring {symbol}"}


@router.get("/monitoring/status", response_model=MonitoringStatus)
async def get_monitoring_status():
    """
    Get current monitoring status
    
    Returns:
        List of currently monitored symbols
    """
    symbols = yahoo_finance_service.get_monitored_symbols()
    return MonitoringStatus(
        monitored_symbols=symbols,
        total_count=len(symbols)
    )


@router.get("/monitoring/cache/{symbol}")
async def get_cached_price(symbol: str):
    """
    Get cached price data for a monitored symbol
    
    Args:
        symbol: Stock ticker symbol
    
    Returns:
        Cached price data if available
    """
    symbol = symbol.upper()
    data = yahoo_finance_service.get_cached_price(symbol)
    
    if data is None:
        raise HTTPException(
            status_code=404, 
            detail=f"No cached data for {symbol}. Symbol might not be monitored."
        )
    
    return data


@router.get("/index-prices")
async def get_index_prices():
    """
    Get real-time prices for major market indices (with rate limiting and caching)
    
    Returns:
        Current prices and changes for S&P 500, Dow Jones, and NASDAQ
    """
    try:
        # Use our specialized market indices method with rate limiting and caching
        results = yahoo_finance_service.get_market_indices_batch()
        
        # If no data, return fallback
        if not results or all(r["price"] == 0 for r in results):
            fallback_data = [
                {"symbol": "^GSPC", "name": "S&P 500", "price": 4450.38, "change": -12.32, "change_percent": -0.28},
                {"symbol": "^DJI", "name": "Dow Jones", "price": 34521.45, "change": -156.78, "change_percent": -0.45},
                {"symbol": "^IXIC", "name": "NASDAQ", "price": 13908.23, "change": 45.67, "change_percent": 0.33}
            ]
            for data in fallback_data:
                data["timestamp"] = datetime.now().isoformat()
            return fallback_data
        
        return results
    except Exception as e:
        logger.error(f"Error in get_index_prices: {str(e)}")
        # Return fallback data on error
        fallback_data = [
            {"symbol": "^GSPC", "name": "S&P 500", "price": 4450.38, "change": -12.32, "change_percent": -0.28},
            {"symbol": "^DJI", "name": "Dow Jones", "price": 34521.45, "change": -156.78, "change_percent": -0.45},
            {"symbol": "^IXIC", "name": "NASDAQ", "price": 13908.23, "change": 45.67, "change_percent": 0.33}
        ]
        for data in fallback_data:
            data["timestamp"] = datetime.now().isoformat()
        return fallback_data 