"""
Yahoo Finance Service Module
Handles real-time stock price monitoring and data fetching
"""

import yfinance as yf
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import asyncio
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

class YahooFinanceService:
    """Service for interacting with Yahoo Finance API"""
    
    def __init__(self):
        self.monitoring_tasks: Dict[str, asyncio.Task] = {}
        self.price_cache: Dict[str, Dict[str, Any]] = {}
        
    def get_stock_info(self, symbol: str) -> Dict[str, Any]:
        """
        Get comprehensive stock information
        
        Args:
            symbol: Stock ticker symbol (e.g., 'AAPL', 'GOOGL')
            
        Returns:
            Dictionary containing stock information
        """
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            # Extract key information
            return {
                "symbol": symbol,
                "company_name": info.get("longName", "N/A"),
                "current_price": info.get("currentPrice", 0),
                "previous_close": info.get("previousClose", 0),
                "open": info.get("open", 0),
                "day_high": info.get("dayHigh", 0),
                "day_low": info.get("dayLow", 0),
                "volume": info.get("volume", 0),
                "market_cap": info.get("marketCap", 0),
                "pe_ratio": info.get("trailingPE", 0),
                "dividend_yield": info.get("dividendYield", 0),
                "52_week_high": info.get("fiftyTwoWeekHigh", 0),
                "52_week_low": info.get("fiftyTwoWeekLow", 0),
                "price_change": info.get("currentPrice", 0) - info.get("previousClose", 0),
                "price_change_percent": ((info.get("currentPrice", 0) - info.get("previousClose", 0)) / 
                                       info.get("previousClose", 1)) * 100 if info.get("previousClose", 0) > 0 else 0,
                "last_updated": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error fetching stock info for {symbol}: {str(e)}")
            raise ValueError(f"Failed to fetch data for symbol: {symbol}")
    
    def get_stock_history(self, symbol: str, period: str = "1mo", interval: str = "1d") -> List[Dict[str, Any]]:
        """
        Get historical stock data
        
        Args:
            symbol: Stock ticker symbol
            period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
            
        Returns:
            List of historical price data
        """
        try:
            ticker = yf.Ticker(symbol)
            history = ticker.history(period=period, interval=interval)
            
            # Convert to list of dictionaries
            result = []
            for index, row in history.iterrows():
                result.append({
                    "date": index.isoformat(),
                    "open": float(row["Open"]),
                    "high": float(row["High"]),
                    "low": float(row["Low"]),
                    "close": float(row["Close"]),
                    "volume": int(row["Volume"])
                })
            
            return result
        except Exception as e:
            logger.error(f"Error fetching history for {symbol}: {str(e)}")
            raise ValueError(f"Failed to fetch history for symbol: {symbol}")
    
    def get_realtime_price(self, symbol: str) -> Dict[str, Any]:
        """
        Get real-time price data for a stock
        
        Args:
            symbol: Stock ticker symbol
            
        Returns:
            Current price information
        """
        try:
            ticker = yf.Ticker(symbol)
            # Get the most recent price data
            history = ticker.history(period="1d", interval="1m")
            
            if history.empty:
                raise ValueError(f"No data available for {symbol}")
            
            latest = history.iloc[-1]
            
            return {
                "symbol": symbol,
                "price": float(latest["Close"]),
                "volume": int(latest["Volume"]),
                "timestamp": history.index[-1].isoformat(),
                "trading_day": history.index[-1].strftime("%Y-%m-%d")
            }
        except Exception as e:
            logger.error(f"Error fetching real-time price for {symbol}: {str(e)}")
            raise ValueError(f"Failed to fetch real-time price for symbol: {symbol}")
    
    def calculate_price_change(self, current_price: float, previous_price: float) -> Dict[str, float]:
        """
        Calculate price change metrics
        
        Args:
            current_price: Current stock price
            previous_price: Previous stock price (e.g., previous close)
            
        Returns:
            Dictionary with change amount and percentage
        """
        change = current_price - previous_price
        change_percent = (change / previous_price * 100) if previous_price > 0 else 0
        
        return {
            "change": round(change, 2),
            "change_percent": round(change_percent, 2)
        }
    
    def check_price_threshold(self, symbol: str, current_price: float, 
                            threshold_percent: float = 5.0) -> Optional[Dict[str, Any]]:
        """
        Check if price has dropped below threshold
        
        Args:
            symbol: Stock ticker symbol
            current_price: Current stock price
            threshold_percent: Percentage drop threshold
            
        Returns:
            Alert information if threshold is breached, None otherwise
        """
        try:
            # Get previous close price
            ticker = yf.Ticker(symbol)
            info = ticker.info
            previous_close = info.get("previousClose", 0)
            
            if previous_close == 0:
                return None
            
            change_data = self.calculate_price_change(current_price, previous_close)
            
            # Check if price dropped more than threshold
            if change_data["change_percent"] <= -threshold_percent:
                return {
                    "symbol": symbol,
                    "alert_type": "PRICE_DROP",
                    "current_price": current_price,
                    "previous_close": previous_close,
                    "change": change_data["change"],
                    "change_percent": change_data["change_percent"],
                    "threshold": threshold_percent,
                    "message": f"{symbol} has dropped {abs(change_data['change_percent']):.2f}% from previous close",
                    "timestamp": datetime.now().isoformat()
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking threshold for {symbol}: {str(e)}")
            return None
    
    async def start_price_monitoring(self, symbol: str, interval_seconds: int = 60,
                                   threshold_percent: float = 5.0,
                                   callback: Optional[callable] = None):
        """
        Start monitoring a stock price with periodic checks
        
        Args:
            symbol: Stock ticker symbol to monitor
            interval_seconds: Check interval in seconds
            threshold_percent: Alert threshold percentage
            callback: Optional callback function for alerts
        """
        async def monitor_task():
            while True:
                try:
                    # Get current price
                    price_data = self.get_realtime_price(symbol)
                    current_price = price_data["price"]
                    
                    # Update cache
                    self.price_cache[symbol] = price_data
                    
                    # Check threshold
                    alert = self.check_price_threshold(symbol, current_price, threshold_percent)
                    
                    if alert and callback:
                        await callback(alert)
                    
                    # Wait for next check
                    await asyncio.sleep(interval_seconds)
                    
                except Exception as e:
                    logger.error(f"Error in monitoring task for {symbol}: {str(e)}")
                    await asyncio.sleep(interval_seconds)
        
        # Cancel existing task if any
        if symbol in self.monitoring_tasks:
            self.monitoring_tasks[symbol].cancel()
        
        # Create new monitoring task
        task = asyncio.create_task(monitor_task())
        self.monitoring_tasks[symbol] = task
        
        logger.info(f"Started monitoring {symbol} with {interval_seconds}s interval")
    
    def stop_price_monitoring(self, symbol: str):
        """Stop monitoring a specific stock"""
        if symbol in self.monitoring_tasks:
            self.monitoring_tasks[symbol].cancel()
            del self.monitoring_tasks[symbol]
            logger.info(f"Stopped monitoring {symbol}")
    
    def stop_all_monitoring(self):
        """Stop all price monitoring tasks"""
        for symbol, task in self.monitoring_tasks.items():
            task.cancel()
        self.monitoring_tasks.clear()
        logger.info("Stopped all monitoring tasks")
    
    def get_monitored_symbols(self) -> List[str]:
        """Get list of currently monitored symbols"""
        return list(self.monitoring_tasks.keys())
    
    def get_cached_price(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get cached price data for a symbol"""
        return self.price_cache.get(symbol)


# Create singleton instance
yahoo_finance_service = YahooFinanceService() 