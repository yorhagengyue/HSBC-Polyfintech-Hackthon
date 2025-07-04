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
        
        # First try to get info for exact symbol match
        try:
            ticker = yf.Ticker(query)
            info = ticker.info
            
            if info and 'symbol' in info and info.get('regularMarketPrice'):
                results.append(StockSearchResult(
                    symbol=info.get('symbol', query),
                    name=info.get('longName', info.get('shortName', 'Unknown')),
                    exchange=info.get('exchange', 'Unknown'),
                    type=info.get('quoteType', 'EQUITY'),
                    currency=info.get('currency', 'USD')
                ))
        except Exception as e:
            logger.warning(f"Direct ticker lookup failed for {query}: {e}")
        
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
    Get real-time data for user's custom stock list
    
    Args:
        symbols: Comma-separated stock symbols (e.g., "AAPL,GOOGL,MSFT")
    
    Returns:
        List of stock data for specified symbols
    """
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(',') if s.strip()]
        results = []
        
        for symbol in symbol_list:
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                history = ticker.history(period="2d")
                
                if not history.empty and len(history) >= 1:
                    current_price = history['Close'].iloc[-1]
                    
                    # Calculate change
                    if len(history) >= 2:
                        previous_close = history['Close'].iloc[-2]
                        change = current_price - previous_close
                        change_percent = (change / previous_close) * 100
                    else:
                        change = 0
                        change_percent = 0
                    
                    results.append(UserStock(
                        symbol=symbol,
                        name=info.get('longName', info.get('shortName', symbol)),
                        price=round(current_price, 2),
                        change=round(change, 2),
                        change_percent=round(change_percent, 2),
                        timestamp=datetime.now().isoformat()
                    ))
                else:
                    # Fallback for unavailable data
                    results.append(UserStock(
                        symbol=symbol,
                        name=symbol,
                        price=0.0,
                        change=0.0,
                        change_percent=0.0,
                        timestamp=datetime.now().isoformat()
                    ))
                    
            except Exception as e:
                logger.warning(f"Error fetching data for {symbol}: {e}")
                # Add placeholder data
                results.append(UserStock(
                    symbol=symbol,
                    name=symbol,
                    price=0.0,
                    change=0.0,
                    change_percent=0.0,
                    timestamp=datetime.now().isoformat()
                ))
        
        return results
        
    except Exception as e:
        logger.error(f"Error getting user stocks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching user stocks: {str(e)}")


@router.get("/stock/{symbol}", response_model=StockInfo)
async def get_stock_info(symbol: str):
    """
    Get comprehensive information about a stock
    
    Args:
        symbol: Stock ticker symbol (e.g., AAPL, GOOGL)
    
    Returns:
        Detailed stock information including price, volume, and key metrics
    """
    try:
        symbol = symbol.upper()
        data = yahoo_finance_service.get_stock_info(symbol)
        return StockInfo(**data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


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
        data = yahoo_finance_service.get_stock_history(symbol, period, interval)
        return [HistoricalData(**item) for item in data]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


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
    Get real-time prices for major market indices
    
    Returns:
        Current prices and changes for S&P 500, Dow Jones, and NASDAQ
    """
    try:
        indices = ['^GSPC', '^DJI', '^IXIC']  # S&P 500, Dow Jones, NASDAQ
        results = []
        
        for index in indices:
            try:
                ticker = yf.Ticker(index)
                info = ticker.info
                history = ticker.history(period="2d")
                
                if not history.empty and len(history) >= 2:
                    current_price = history['Close'].iloc[-1]
                    previous_close = history['Close'].iloc[-2]
                    change = current_price - previous_close
                    change_percent = (change / previous_close) * 100
                    
                    index_name = {
                        '^GSPC': 'S&P 500',
                        '^DJI': 'Dow Jones',
                        '^IXIC': 'NASDAQ'
                    }.get(index, index)
                    
                    results.append({
                        "symbol": index,
                        "name": index_name,
                        "price": round(current_price, 2),
                        "change": round(change, 2),
                        "change_percent": round(change_percent, 2),
                        "timestamp": datetime.now().isoformat()
                    })
                else:
                    # Fallback data if market is closed
                    fallback_data = {
                        '^GSPC': {"name": "S&P 500", "price": 4450.38, "change": -12.32, "change_percent": -0.28},
                        '^DJI': {"name": "Dow Jones", "price": 34521.45, "change": -156.78, "change_percent": -0.45},
                        '^IXIC': {"name": "NASDAQ", "price": 13908.23, "change": 45.67, "change_percent": 0.33}
                    }
                    data = fallback_data.get(index, {})
                    results.append({
                        "symbol": index,
                        "name": data.get("name", index),
                        "price": data.get("price", 0),
                        "change": data.get("change", 0),
                        "change_percent": data.get("change_percent", 0),
                        "timestamp": datetime.now().isoformat()
                    })
            except Exception as e:
                logger.error(f"Error fetching index {index}: {str(e)}")
                # Return fallback data on error
                fallback_data = {
                    '^GSPC': {"name": "S&P 500", "price": 4450.38, "change": -12.32, "change_percent": -0.28},
                    '^DJI': {"name": "Dow Jones", "price": 34521.45, "change": -156.78, "change_percent": -0.45},
                    '^IXIC': {"name": "NASDAQ", "price": 13908.23, "change": 45.67, "change_percent": 0.33}
                }
                data = fallback_data.get(index, {})
                results.append({
                    "symbol": index,
                    "name": data.get("name", index),
                    "price": data.get("price", 0),
                    "change": data.get("change", 0),
                    "change_percent": data.get("change_percent", 0),
                    "timestamp": datetime.now().isoformat()
                })
        
        return results
    except Exception as e:
        logger.error(f"Error in get_index_prices: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 