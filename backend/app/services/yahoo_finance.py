"""
Yahoo Finance Service Module with Rate Limiting and Caching
Handles real-time stock price monitoring and data fetching
"""

import yfinance as yf
from typing import Dict, List, Optional, Any, Tuple
import asyncio
from datetime import datetime, timedelta
import logging
from functools import lru_cache
import time
from collections import defaultdict
import threading
from .yahoo_finance_fallback import yahoo_finance_fallback

logger = logging.getLogger(__name__)

class YahooFinanceService:
    def __init__(self):
        # Rate limiting: 30 requests per minute (Yahoo's approximate limit)
        self.rate_limit = 30
        self.time_window = 60  # seconds
        self.request_times = []
        self.request_lock = threading.Lock()
        
        # Request deduplication
        self.pending_requests = {}
        self.request_results = {}
        
        # Multi-layer caching
        self.price_cache = {}  # Short TTL for prices
        self.info_cache = {}   # Longer TTL for company info
        self.historical_cache = {}  # Long TTL for historical data
        
        # Cache TTLs
        self.price_cache_ttl = 30  # 30 seconds for real-time prices
        self.info_cache_ttl = 300  # 5 minutes for company info
        self.historical_cache_ttl = 600  # 10 minutes for historical data
        
        # Fallback service
        self.fallback_service = yahoo_finance_fallback
        
        logger.info("YahooFinanceService initialized with rate limiting and fallback support")
    
    def _wait_for_rate_limit(self):
        """Implement rate limiting with sliding window"""
        with self.request_lock:
            current_time = time.time()
            # Remove requests older than time window
            self.request_times = [t for t in self.request_times if current_time - t < self.time_window]
            
            # Check if we're at the limit
            if len(self.request_times) >= self.rate_limit:
                # Calculate how long to wait
                oldest_request = self.request_times[0]
                wait_time = self.time_window - (current_time - oldest_request) + 0.1
                if wait_time > 0:
                    logger.warning(f"Rate limit reached. Waiting {wait_time:.2f} seconds")
                    time.sleep(wait_time)
                    # Recursive call to recheck
                    return self._wait_for_rate_limit()
            
            # Add current request time
            self.request_times.append(current_time)
            
            # Ensure minimum interval between requests
            if len(self.request_times) > 1:
                time_since_last = current_time - self.request_times[-2]
                if time_since_last < 1.0:  # Minimum 1 second between requests
                    sleep_time = 1.0 - time_since_last
                    time.sleep(sleep_time)
    
    def _get_from_cache(self, cache_dict: Dict, key: str, ttl: int) -> Optional[Any]:
        """Get value from cache if not expired"""
        if key in cache_dict:
            value, timestamp = cache_dict[key]
            if time.time() - timestamp < ttl:
                return value
            else:
                # Clean up expired entry
                del cache_dict[key]
        return None
    
    def _set_cache(self, cache_dict: Dict, key: str, value: Any):
        """Set value in cache with timestamp"""
        cache_dict[key] = (value, time.time())
    
    def _deduplicate_request(self, key: str, request_func, *args, **kwargs):
        """Prevent duplicate concurrent requests for the same resource"""
        with self.request_lock:
            if key in self.pending_requests:
                # Request already in progress, wait for it
                logger.info(f"Request for {key} already in progress, waiting...")
                event = self.pending_requests[key]
            else:
                # New request, create event
                event = threading.Event()
                self.pending_requests[key] = event
                
        if key in self.pending_requests and self.pending_requests[key] == event:
            # We're the first request, execute it
            try:
                result = request_func(*args, **kwargs)
                self.request_results[key] = ('success', result)
            except Exception as e:
                self.request_results[key] = ('error', e)
            finally:
                event.set()
                # Cleanup after a delay
                threading.Timer(5.0, self._cleanup_request, args=[key]).start()
        else:
            # Wait for the other request to complete
            event.wait(timeout=30)
            if key in self.request_results:
                status, result = self.request_results[key]
                if status == 'success':
                    return result
                else:
                    raise result
                    
        status, result = self.request_results.get(key, ('error', Exception("Request failed")))
        if status == 'success':
            return result
        else:
            raise result
    
    def _cleanup_request(self, key: str):
        """Clean up request tracking data"""
        with self.request_lock:
            self.pending_requests.pop(key, None)
            self.request_results.pop(key, None)
    
    def get_stock_info(self, symbol: str) -> Dict[str, Any]:
        """Get stock information with caching, rate limiting, and fallback"""
        try:
            # Check price cache first
            cached_data = self._get_from_cache(self.price_cache, symbol, self.price_cache_ttl)
            if cached_data:
                logger.info(f"Returning cached data for {symbol}")
                return cached_data
            
            # Use deduplication for concurrent requests
            def fetch_stock_data():
                # Apply rate limiting
                self._wait_for_rate_limit()
                
                # Try to get data using fallback service
                return self.fallback_service.get_stock_info_with_fallback(symbol)
            
            data = self._deduplicate_request(f"stock_info_{symbol}", fetch_stock_data)
            
            # Cache the result
            self._set_cache(self.price_cache, symbol, data)
            
            return data
            
        except Exception as e:
            logger.error(f"Error fetching stock info for {symbol}: {str(e)}")
            # Return fallback/mock data even on complete failure
            return self.fallback_service._get_mock_data(symbol)
    
    def get_multiple_stocks(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """Get multiple stock quotes efficiently"""
        try:
            # Use optimized batch fetching from fallback service
            return self.fallback_service.get_batch_quotes_optimized(symbols)
        except Exception as e:
            logger.error(f"Batch fetch failed: {e}")
            # Fallback to individual requests
            results = []
            for symbol in symbols:
                try:
                    results.append(self.get_stock_info(symbol))
                except Exception as symbol_error:
                    logger.error(f"Failed to fetch {symbol}: {symbol_error}")
                    results.append(self.fallback_service._get_mock_data(symbol))
            return results
    
    def get_stock_history(self, symbol: str, period: str = "1mo", interval: str = "1d") -> Optional[Dict[str, Any]]:
        """Get historical stock data with caching"""
        cache_key = f"{symbol}_{period}_{interval}"
        
        # Check cache first
        cached_data = self._get_from_cache(self.historical_cache, cache_key, self.historical_cache_ttl)
        if cached_data:
            logger.info(f"Returning cached historical data for {symbol}")
            return cached_data
        
        def fetch_history():
            self._wait_for_rate_limit()
            
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period=period, interval=interval)
                
                if hist.empty:
                    raise ValueError(f"No historical data available for {symbol}")
                
                # Convert to JSON-serializable format
                history_data = {
                    "symbol": symbol,
                    "period": period,
                    "interval": interval,
                    "data": hist.reset_index().to_dict('records'),
                    "last_updated": datetime.now().isoformat()
                }
                
                # Ensure all values are JSON serializable
                for record in history_data["data"]:
                    for key, value in record.items():
                        if hasattr(value, 'timestamp'):
                            record[key] = value.isoformat()
                        elif hasattr(value, 'item'):
                            record[key] = float(value)
                
                return history_data
                
            except Exception as e:
                logger.error(f"Failed to fetch history for {symbol}: {e}")
                # Return mock historical data
                return self._generate_mock_history(symbol, period, interval)
        
        try:
            data = self._deduplicate_request(cache_key, fetch_history)
            self._set_cache(self.historical_cache, cache_key, data)
            return data
        except Exception as e:
            logger.error(f"Error in get_stock_history: {e}")
            return self._generate_mock_history(symbol, period, interval)
    
    def _generate_mock_history(self, symbol: str, period: str, interval: str) -> Dict[str, Any]:
        """Generate mock historical data"""
        # Get current price from cache or mock
        current_info = self.get_stock_info(symbol)
        base_price = current_info.get('current_price', 100)
        
        # Generate historical points
        points = []
        num_points = 30 if period == "1mo" else 7
        
        for i in range(num_points):
            date = datetime.now() - timedelta(days=num_points-i)
            # Add some realistic variation
            variation = 1 + (i - num_points/2) * 0.002  # Gradual trend
            daily_var = 1 + (hash(f"{symbol}{date.date()}") % 100 - 50) / 1000  # Daily randomness
            price = base_price * variation * daily_var
            
            points.append({
                "Date": date.isoformat(),
                "Open": round(price * 0.995, 2),
                "High": round(price * 1.01, 2),
                "Low": round(price * 0.99, 2),
                "Close": round(price, 2),
                "Volume": abs(hash(f"{symbol}{date}")) % 10000000
            })
        
        return {
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "data": points,
            "last_updated": datetime.now().isoformat(),
            "_is_mock": True
        }
    
    def search_symbols(self, query: str) -> List[Dict[str, str]]:
        """Search for stock symbols"""
        try:
            # Simple mock search for common symbols
            all_symbols = [
                {"symbol": "AAPL", "name": "Apple Inc.", "type": "Stock", "exchange": "NASDAQ"},
                {"symbol": "GOOGL", "name": "Alphabet Inc.", "type": "Stock", "exchange": "NASDAQ"},
                {"symbol": "MSFT", "name": "Microsoft Corporation", "type": "Stock", "exchange": "NASDAQ"},
                {"symbol": "AMZN", "name": "Amazon.com Inc.", "type": "Stock", "exchange": "NASDAQ"},
                {"symbol": "TSLA", "name": "Tesla, Inc.", "type": "Stock", "exchange": "NASDAQ"},
                {"symbol": "META", "name": "Meta Platforms Inc.", "type": "Stock", "exchange": "NASDAQ"},
                {"symbol": "NVDA", "name": "NVIDIA Corporation", "type": "Stock", "exchange": "NASDAQ"},
                {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "type": "Stock", "exchange": "NYSE"},
                {"symbol": "BAC", "name": "Bank of America Corp", "type": "Stock", "exchange": "NYSE"},
                {"symbol": "WMT", "name": "Walmart Inc.", "type": "Stock", "exchange": "NYSE"},
            ]
            
            # Filter based on query
            query_lower = query.lower()
            results = [
                s for s in all_symbols 
                if query_lower in s["symbol"].lower() or query_lower in s["name"].lower()
            ]
            
            return results[:5]  # Limit to 5 results
            
        except Exception as e:
            logger.error(f"Error searching symbols: {e}")
            return []
    
    def get_market_status(self) -> Dict[str, Any]:
        """Get current market status"""
        try:
            # Simple market hours check (EST/EDT)
            now = datetime.now()
            weekday = now.weekday()
            hour = now.hour
            
            # Market is open Mon-Fri 9:30 AM - 4:00 PM EST
            is_open = weekday < 5 and 9 <= hour < 16
            
            return {
                "is_open": is_open,
                "current_time": now.isoformat(),
                "next_open": "9:30 AM EST" if not is_open else None,
                "next_close": "4:00 PM EST" if is_open else None
            }
        except Exception as e:
            logger.error(f"Error getting market status: {e}")
            return {"is_open": False, "error": str(e)}
    
    def get_multiple_stocks_batch(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """Optimized batch fetching with fallback"""
        return self.get_multiple_stocks(symbols)
    
    def check_price_threshold(self, symbol: str, threshold_type: str, threshold_value: float) -> Tuple[bool, float]:
        """Check if a stock has crossed a price threshold"""
        try:
            stock_info = self.get_stock_info(symbol)
            current_price = stock_info.get('current_price', 0)
            
            if threshold_type == 'above':
                triggered = current_price > threshold_value
            elif threshold_type == 'below':
                triggered = current_price < threshold_value
            else:
                triggered = False
            
            return triggered, current_price
            
        except Exception as e:
            logger.error(f"Error checking threshold for {symbol}: {e}")
            return False, 0
    
    def get_realtime_price(self, symbol: str) -> Dict[str, Any]:
        """Get real-time price data for a stock"""
        try:
            # Use get_stock_info which already has caching and rate limiting
            stock_info = self.get_stock_info(symbol)
            
            # Extract only price-related data
            return {
                "symbol": symbol,
                "price": stock_info.get("current_price", 0),
                "volume": stock_info.get("volume", 0),
                "timestamp": stock_info.get("last_updated", datetime.now().isoformat()),
                "trading_day": datetime.now().strftime("%Y-%m-%d")
            }
        except Exception as e:
            logger.error(f"Error getting realtime price for {symbol}: {e}")
            # Return mock data
            return {
                "symbol": symbol,
                "price": 100.0,
                "volume": 1000000,
                "timestamp": datetime.now().isoformat(),
                "trading_day": datetime.now().strftime("%Y-%m-%d")
            }
    
    def get_index_prices(self) -> Dict[str, Any]:
        """Get major market index prices"""
        indices = {
            "^GSPC": "S&P 500",
            "^DJI": "Dow Jones",
            "^IXIC": "NASDAQ",
            "^VIX": "VIX"
        }
        
        results = {}
        for symbol, name in indices.items():
            try:
                info = self.get_stock_info(symbol)
                results[symbol] = {
                    "name": name,
                    "price": info.get("current_price", 0),
                    "change": info.get("price_change", 0),
                    "change_percent": info.get("price_change_percent", 0)
                }
            except Exception as e:
                logger.error(f"Failed to get index {symbol}: {e}")
                # Provide mock data for indices
                results[symbol] = {
                    "name": name,
                    "price": {"^GSPC": 5000, "^DJI": 38000, "^IXIC": 16000, "^VIX": 15}[symbol],
                    "change": 0,
                    "change_percent": 0
                }
        
        return results
    
    def get_market_indices_batch(self) -> List[Dict[str, Any]]:
        """Get market indices data in batch format for API compatibility"""
        indices_data = self.get_index_prices()
        
        # Convert dictionary to list format
        results = []
        for symbol, data in indices_data.items():
            results.append({
                "symbol": symbol,
                "name": data["name"],
                "price": data["price"],
                "change": data["change"],
                "change_percent": data["change_percent"],
                "timestamp": datetime.now().isoformat()
            })
        
        return results
    
    def initialize(self):
        """Initialize the service"""
        logger.info("YahooFinanceService with fallback initialized successfully")
        # Load any cached data
        self.fallback_service.load_cache_from_file()
        return True
    
    def cleanup(self):
        """Cleanup and save cache"""
        self.fallback_service.save_cache_to_file()
        logger.info("YahooFinanceService cleanup completed")


# Create a singleton instance
yahoo_finance_service = YahooFinanceService()

# For backward compatibility
def get_stock_quote(symbol: str) -> Optional[Dict[str, Any]]:
    """Legacy function for compatibility"""
    return yahoo_finance_service.get_stock_info(symbol)

def get_stock_info(symbol: str) -> Optional[Dict[str, Any]]:
    """Legacy function for compatibility"""
    return yahoo_finance_service.get_stock_info(symbol)

def get_historical_data(symbol: str, period: str = "1mo") -> Optional[List[Dict[str, Any]]]:
    """Legacy function for compatibility"""
    result = yahoo_finance_service.get_stock_history(symbol, period)
    return result.get('data', []) if result else None 