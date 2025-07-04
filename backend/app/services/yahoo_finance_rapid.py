"""
Yahoo Finance RapidAPI Service Module
Enhanced Yahoo Finance API with insider trading, options, and advanced analytics
"""

import httpx
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class YahooFinanceRapidService:
    """Enhanced Yahoo Finance service using RapidAPI"""
    
    def __init__(self, api_key: str = "487d9be446msh808a69223d373cbp12cf58jsn24e062ece0ce"):
        self.api_key = api_key
        self.base_url = "https://yahoo-finance15.p.rapidapi.com/api/v1"
        self.headers = {
            "x-rapidapi-host": "yahoo-finance15.p.rapidapi.com",
            "x-rapidapi-key": self.api_key
        }
        self._client = None
    
    @property
    def client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client
    
    async def close(self):
        """Close HTTP client"""
        if self._client:
            await self._client.aclose()
            self._client = None
    
    async def get_quote(self, symbol: str) -> Dict[str, Any]:
        """
        Get real-time quote data for a stock
        
        Args:
            symbol: Stock ticker symbol
            
        Returns:
            Detailed quote information
        """
        try:
            response = await self.client.get(
                f"{self.base_url}/quote/{symbol}",
                headers=self.headers
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract and format key metrics
            if data.get("body"):
                quote = data["body"]
                return {
                    "symbol": symbol,
                    "company_name": quote.get("longName", "N/A"),
                    "current_price": quote.get("regularMarketPrice", 0),
                    "previous_close": quote.get("regularMarketPreviousClose", 0),
                    "open": quote.get("regularMarketOpen", 0),
                    "day_high": quote.get("regularMarketDayHigh", 0),
                    "day_low": quote.get("regularMarketDayLow", 0),
                    "volume": quote.get("regularMarketVolume", 0),
                    "market_cap": quote.get("marketCap", 0),
                    "pe_ratio": quote.get("trailingPE", 0),
                    "forward_pe": quote.get("forwardPE", 0),
                    "dividend_yield": quote.get("dividendYield", 0),
                    "52_week_high": quote.get("fiftyTwoWeekHigh", 0),
                    "52_week_low": quote.get("fiftyTwoWeekLow", 0),
                    "price_change": quote.get("regularMarketChange", 0),
                    "price_change_percent": quote.get("regularMarketChangePercent", 0),
                    "beta": quote.get("beta", 0),
                    "eps": quote.get("epsTrailingTwelveMonths", 0),
                    "analyst_rating": quote.get("averageAnalystRating", "N/A"),
                    "last_updated": datetime.now().isoformat()
                }
            return {}
            
        except Exception as e:
            logger.error(f"Error fetching quote for {symbol}: {str(e)}")
            raise ValueError(f"Failed to fetch quote for symbol: {symbol}")
    
    async def get_insider_trades(self, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get insider trading information
        
        Args:
            symbol: Optional stock symbol to filter by
            
        Returns:
            List of insider trades
        """
        try:
            url = f"{self.base_url}/markets/insider-trades"
            if symbol:
                url += f"?symbol={symbol}"
                
            response = await self.client.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            trades = []
            if data.get("body", {}).get("rows"):
                for trade in data["body"]["rows"]:
                    trades.append({
                        "symbol": trade.get("symbol"),
                        "company_name": trade.get("companyName"),
                        "insider_name": trade.get("insiderName"),
                        "insider_title": trade.get("insiderTitle"),
                        "transaction_type": trade.get("transactionType"),
                        "shares": trade.get("shares", 0),
                        "price": trade.get("price", 0),
                        "value": trade.get("value", 0),
                        "filing_date": trade.get("filingDate"),
                        "transaction_date": trade.get("transactionDate"),
                        "ownership": trade.get("ownership", 0)
                    })
            
            return trades
            
        except Exception as e:
            logger.error(f"Error fetching insider trades: {str(e)}")
            raise ValueError(f"Failed to fetch insider trades: {str(e)}")
    
    async def get_options_chain(self, symbol: str) -> Dict[str, Any]:
        """
        Get options chain data for a stock
        
        Args:
            symbol: Stock ticker symbol
            
        Returns:
            Options chain with calls and puts
        """
        try:
            response = await self.client.get(
                f"{self.base_url}/options/{symbol}",
                headers=self.headers
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("body"):
                options = data["body"]
                return {
                    "symbol": symbol,
                    "expiration_dates": options.get("expirationDates", []),
                    "strikes": options.get("strikes", []),
                    "calls": self._format_options(options.get("calls", [])),
                    "puts": self._format_options(options.get("puts", [])),
                    "quote": options.get("quote", {})
                }
            return {}
            
        except Exception as e:
            logger.error(f"Error fetching options for {symbol}: {str(e)}")
            raise ValueError(f"Failed to fetch options for symbol: {symbol}")
    
    async def get_trending_tickers(self) -> List[Dict[str, Any]]:
        """
        Get trending stocks
        
        Returns:
            List of trending tickers with details
        """
        try:
            response = await self.client.get(
                f"{self.base_url}/markets/trending",
                headers=self.headers
            )
            response.raise_for_status()
            data = response.json()
            
            tickers = []
            if data.get("body"):
                for ticker in data["body"]:
                    tickers.append({
                        "symbol": ticker.get("symbol"),
                        "name": ticker.get("name"),
                        "price": ticker.get("regularMarketPrice", 0),
                        "change": ticker.get("regularMarketChange", 0),
                        "change_percent": ticker.get("regularMarketChangePercent", 0),
                        "volume": ticker.get("regularMarketVolume", 0),
                        "market_cap": ticker.get("marketCap", 0)
                    })
            
            return tickers
            
        except Exception as e:
            logger.error(f"Error fetching trending tickers: {str(e)}")
            raise ValueError(f"Failed to fetch trending tickers: {str(e)}")
    
    async def get_market_summary(self) -> Dict[str, Any]:
        """
        Get overall market summary
        
        Returns:
            Market indices and summary data
        """
        try:
            response = await self.client.get(
                f"{self.base_url}/markets/summary",
                headers=self.headers
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("body"):
                return {
                    "indices": data["body"].get("indices", []),
                    "futures": data["body"].get("futures", []),
                    "currencies": data["body"].get("currencies", []),
                    "commodities": data["body"].get("commodities", []),
                    "last_updated": datetime.now().isoformat()
                }
            return {}
            
        except Exception as e:
            logger.error(f"Error fetching market summary: {str(e)}")
            raise ValueError(f"Failed to fetch market summary: {str(e)}")
    
    async def get_stock_statistics(self, symbol: str) -> Dict[str, Any]:
        """
        Get detailed stock statistics
        
        Args:
            symbol: Stock ticker symbol
            
        Returns:
            Comprehensive statistics
        """
        try:
            response = await self.client.get(
                f"{self.base_url}/stock/{symbol}/statistics",
                headers=self.headers
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("body"):
                stats = data["body"]
                return {
                    "symbol": symbol,
                    "valuation": {
                        "market_cap": stats.get("marketCap", 0),
                        "enterprise_value": stats.get("enterpriseValue", 0),
                        "trailing_pe": stats.get("trailingPE", 0),
                        "forward_pe": stats.get("forwardPE", 0),
                        "peg_ratio": stats.get("pegRatio", 0),
                        "price_to_sales": stats.get("priceToSalesTrailing12Months", 0),
                        "price_to_book": stats.get("priceToBook", 0),
                        "enterprise_to_revenue": stats.get("enterpriseToRevenue", 0),
                        "enterprise_to_ebitda": stats.get("enterpriseToEbitda", 0)
                    },
                    "profitability": {
                        "profit_margin": stats.get("profitMargins", 0),
                        "operating_margin": stats.get("operatingMargins", 0),
                        "return_on_assets": stats.get("returnOnAssets", 0),
                        "return_on_equity": stats.get("returnOnEquity", 0),
                        "revenue": stats.get("totalRevenue", 0),
                        "revenue_per_share": stats.get("revenuePerShare", 0),
                        "quarterly_revenue_growth": stats.get("revenueQuarterlyGrowth", 0),
                        "gross_profit": stats.get("grossProfits", 0),
                        "ebitda": stats.get("ebitda", 0),
                        "net_income": stats.get("netIncomeToCommon", 0),
                        "earnings_quarterly_growth": stats.get("earningsQuarterlyGrowth", 0)
                    },
                    "financial_health": {
                        "total_cash": stats.get("totalCash", 0),
                        "total_cash_per_share": stats.get("totalCashPerShare", 0),
                        "total_debt": stats.get("totalDebt", 0),
                        "debt_to_equity": stats.get("debtToEquity", 0),
                        "current_ratio": stats.get("currentRatio", 0),
                        "book_value_per_share": stats.get("bookValue", 0),
                        "operating_cash_flow": stats.get("operatingCashflow", 0),
                        "free_cash_flow": stats.get("freeCashflow", 0)
                    },
                    "trading_info": {
                        "beta": stats.get("beta", 0),
                        "52_week_change": stats.get("52WeekChange", 0),
                        "sp500_52_week_change": stats.get("SandP52WeekChange", 0),
                        "shares_outstanding": stats.get("sharesOutstanding", 0),
                        "float_shares": stats.get("floatShares", 0),
                        "shares_short": stats.get("sharesShort", 0),
                        "short_ratio": stats.get("shortRatio", 0),
                        "short_percent_of_float": stats.get("shortPercentOfFloat", 0),
                        "held_by_insiders": stats.get("heldPercentInsiders", 0),
                        "held_by_institutions": stats.get("heldPercentInstitutions", 0)
                    },
                    "dividend_info": {
                        "forward_dividend_rate": stats.get("dividendRate", 0),
                        "forward_dividend_yield": stats.get("dividendYield", 0),
                        "trailing_dividend_rate": stats.get("trailingAnnualDividendRate", 0),
                        "trailing_dividend_yield": stats.get("trailingAnnualDividendYield", 0),
                        "payout_ratio": stats.get("payoutRatio", 0),
                        "dividend_date": stats.get("dividendDate"),
                        "ex_dividend_date": stats.get("exDividendDate"),
                        "last_split_factor": stats.get("lastSplitFactor"),
                        "last_split_date": stats.get("lastSplitDate")
                    }
                }
            return {}
            
        except Exception as e:
            logger.error(f"Error fetching statistics for {symbol}: {str(e)}")
            raise ValueError(f"Failed to fetch statistics for symbol: {symbol}")
    
    def _format_options(self, options_list: List[Dict]) -> List[Dict[str, Any]]:
        """Format options data"""
        formatted = []
        for option in options_list:
            formatted.append({
                "contract_symbol": option.get("contractSymbol"),
                "strike": option.get("strike", 0),
                "expiration": option.get("expiration"),
                "last_price": option.get("lastPrice", 0),
                "bid": option.get("bid", 0),
                "ask": option.get("ask", 0),
                "change": option.get("change", 0),
                "change_percent": option.get("percentChange", 0),
                "volume": option.get("volume", 0),
                "open_interest": option.get("openInterest", 0),
                "implied_volatility": option.get("impliedVolatility", 0),
                "in_the_money": option.get("inTheMoney", False)
            })
        return formatted


# Create singleton instance
yahoo_finance_rapid_service = YahooFinanceRapidService() 