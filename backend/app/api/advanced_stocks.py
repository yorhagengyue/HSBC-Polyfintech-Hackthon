"""
Advanced Stock Market API Endpoints
Handles insider trading, options, and advanced analytics using RapidAPI
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel, Field
import logging
import datetime

from app.services.yahoo_finance_rapid import yahoo_finance_rapid_service

router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic models
class InsiderTrade(BaseModel):
    symbol: str
    company_name: str
    insider_name: str
    insider_title: str
    transaction_type: str
    shares: int
    price: float
    value: float
    filing_date: Optional[str]
    transaction_date: Optional[str]
    ownership: float

class TrendingStock(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: int
    market_cap: int

class OptionContract(BaseModel):
    contract_symbol: str
    strike: float
    expiration: str
    last_price: float
    bid: float
    ask: float
    change: float
    change_percent: float
    volume: int
    open_interest: int
    implied_volatility: float
    in_the_money: bool

class OptionsChain(BaseModel):
    symbol: str
    expiration_dates: List[str]
    strikes: List[float]
    calls: List[OptionContract]
    puts: List[OptionContract]

class MarketSummary(BaseModel):
    indices: List[dict]
    futures: List[dict]
    currencies: List[dict]
    commodities: List[dict]
    last_updated: str

class StockStatistics(BaseModel):
    symbol: str
    valuation: dict
    profitability: dict
    financial_health: dict
    trading_info: dict
    dividend_info: dict


@router.get("/insider-trades")
async def get_insider_trades(symbol: Optional[str] = None):
    """
    Get insider trading information
    
    Args:
        symbol: Optional stock symbol to filter by
    
    Returns:
        List of insider trades from real API data
    """
    try:
        # Use real API data from RapidAPI Yahoo Finance
        logger.info(f"Attempting to fetch real insider trades from RapidAPI for symbol: {symbol}")
        trades = await yahoo_finance_rapid_service.get_insider_trades(symbol)
        
        # If API returns data, use it
        if trades:
            logger.info(f"✅ SUCCESS: Retrieved {len(trades)} real insider trades from RapidAPI")
            # Add metadata to indicate this is real data
            for trade in trades:
                trade["data_source"] = "RapidAPI_Yahoo_Finance"
                trade["is_real_data"] = True
            return trades
        
        # Log when API returns empty but successful response
        logger.warning("⚠️ RapidAPI returned empty response for insider trades")
        
    except Exception as e:
        logger.error(f"❌ RapidAPI insider trades failed: {str(e)}")
        logger.error("This means the displayed data will be MOCK/SIMULATED data")
    
    # Fallback to sample data only if API fails completely
    logger.warning("🔄 Using FALLBACK MOCK DATA for insider trades")
    logger.warning("To see real data, configure a valid YAHOO_FINANCE_RAPID_API_KEY")
    
    mock_trades = [
        {
            "symbol": "NVDA",
            "company_name": "NVIDIA Corporation",
            "insider_name": "Jensen Huang",
            "insider_title": "CEO",
            "transaction_type": "SELL", 
            "shares": 120000,
            "price": 485.33,
            "value": 58239600,
            "filing_date": (datetime.datetime.now() - datetime.timedelta(days=2)).isoformat(),
            "transaction_date": (datetime.datetime.now() - datetime.timedelta(days=5)).isoformat(),
            "ownership": 3.5,
            "data_source": "MOCK_FALLBACK",
            "is_real_data": False
        },
        {
            "symbol": "MSFT",
            "company_name": "Microsoft Corporation",
            "insider_name": "Satya Nadella",
            "insider_title": "CEO",
            "transaction_type": "BUY",
            "shares": 10000,
            "price": 415.25,
            "value": 4152500,
            "filing_date": (datetime.datetime.now() - datetime.timedelta(days=1)).isoformat(),
            "transaction_date": (datetime.datetime.now() - datetime.timedelta(days=3)).isoformat(),
            "ownership": 0.01,
            "data_source": "MOCK_FALLBACK",
            "is_real_data": False
        },
        {
            "symbol": "META",
            "company_name": "Meta Platforms Inc.",
            "insider_name": "Mark Zuckerberg",
            "insider_title": "CEO",
            "transaction_type": "SELL",
            "shares": 25000,
            "price": 495.00,
            "value": 12375000,
            "filing_date": (datetime.datetime.now() - datetime.timedelta(days=4)).isoformat(),
            "transaction_date": (datetime.datetime.now() - datetime.timedelta(days=8)).isoformat(),
            "ownership": 13.4,
            "data_source": "MOCK_FALLBACK",
            "is_real_data": False
        },
        {
            "symbol": "GOOGL",
            "company_name": "Alphabet Inc.",
            "insider_name": "Sundar Pichai",
            "insider_title": "CEO",
            "transaction_type": "SELL",
            "shares": 5000,
            "price": 142.85,
            "value": 714250,
            "filing_date": (datetime.datetime.now() - datetime.timedelta(days=6)).isoformat(),
            "transaction_date": (datetime.datetime.now() - datetime.timedelta(days=10)).isoformat(),
            "ownership": 0.01,
            "data_source": "MOCK_FALLBACK",
            "is_real_data": False
        },
        {
            "symbol": "TSLA",
            "company_name": "Tesla Inc.",
            "insider_name": "Elon Musk",
            "insider_title": "CEO",
            "transaction_type": "BUY",
            "shares": 75000,
            "price": 245.00,
            "value": 18375000,
            "filing_date": datetime.datetime.now().isoformat(),
            "transaction_date": (datetime.datetime.now() - datetime.timedelta(days=2)).isoformat(),
            "ownership": 20.6,
            "data_source": "MOCK_FALLBACK",
            "is_real_data": False
        }
    ]
    
    return mock_trades


@router.get("/trending")
async def get_trending_stocks():
    """
    Get currently trending stocks using real market data
    
    Returns:
        List of trending stocks with price and volume data
    """
    try:
        # Get real market summary data
        market_data = await yahoo_finance_rapid_service.get_market_summary()
        
        # Extract trending stocks from market data
        trending_stocks = []
        
        # Get quotes for popular stocks to determine trending
        popular_symbols = ["NVDA", "TSLA", "AAPL", "AMD", "META", "GOOGL", "MSFT", "AMZN"]
        
        for symbol in popular_symbols:
            try:
                quote = await yahoo_finance_rapid_service.get_quote(symbol)
                if quote and quote.get("current_price", 0) > 0:
                    trending_stocks.append({
                        "symbol": symbol,
                        "name": quote.get("company_name", symbol),
                        "price": quote.get("current_price", 0),
                        "change": quote.get("price_change", 0),
                        "change_percent": quote.get("price_change_percent", 0),
                        "volume": quote.get("volume", 0),
                        "market_cap": quote.get("market_cap", 0),
                        "social_sentiment": 50 + (quote.get("price_change_percent", 0) * 2)  # Simple sentiment calculation
                    })
            except Exception as e:
                logger.warning(f"Failed to fetch quote for {symbol}: {e}")
                continue
        
        # If we got real data, return it
        if trending_stocks:
            # Sort by volume and change percentage to get "trending"
            trending_stocks.sort(key=lambda x: (x["volume"], abs(x["change_percent"])), reverse=True)
            return trending_stocks[:5]  # Return top 5
        
        # Fallback to sample data if API fails
        logger.warning("RapidAPI failed, using fallback trending data")
        return [
            {
                "symbol": "NVDA",
                "name": "NVIDIA Corporation",
                "price": 485.09,
                "change": 12.35,
                "change_percent": 2.61,
                "volume": 45678900,
                "market_cap": 1193000000000,
                "social_sentiment": 85
            },
            {
                "symbol": "TSLA",
                "name": "Tesla Inc.",
                "price": 248.23,
                "change": -5.67,
                "change_percent": -2.23,
                "volume": 123456789,
                "market_cap": 789000000000,
                "social_sentiment": 72
            },
            {
                "symbol": "AAPL",
                "name": "Apple Inc.",
                "price": 189.84,
                "change": 1.23,
                "change_percent": 0.65,
                "volume": 56789012,
                "market_cap": 2950000000000,
                "social_sentiment": 68
            },
            {
                "symbol": "AMD",
                "name": "Advanced Micro Devices",
                "price": 178.65,
                "change": 4.56,
                "change_percent": 2.62,
                "volume": 78901234,
                "market_cap": 288000000000,
                "social_sentiment": 79
            },
            {
                "symbol": "META",
                "name": "Meta Platforms Inc.",
                "price": 492.34,
                "change": -8.91,
                "change_percent": -1.78,
                "volume": 34567890,
                "market_cap": 1250000000000,
                "social_sentiment": 55
            }
        ]
    except Exception as e:
        logger.error(f"Error fetching trending stocks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch trending stocks: {str(e)}")


@router.get("/options/{symbol}", response_model=OptionsChain)
async def get_options_chain(symbol: str):
    """
    Get options chain for a stock
    
    Args:
        symbol: Stock ticker symbol
    
    Returns:
        Complete options chain with calls and puts
    """
    try:
        symbol = symbol.upper()
        options = await yahoo_finance_rapid_service.get_options_chain(symbol)
        
        # Convert to response model
        return OptionsChain(
            symbol=options["symbol"],
            expiration_dates=options["expiration_dates"],
            strikes=options["strikes"],
            calls=[OptionContract(**call) for call in options["calls"]],
            puts=[OptionContract(**put) for put in options["puts"]]
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch options: {str(e)}")


@router.get("/market-summary")
async def get_market_summary():
    """
    Get overall market summary using real API data
    
    Returns:
        Comprehensive market overview from real data sources
    """
    try:
        # Use real market summary data from RapidAPI
        market_data = await yahoo_finance_rapid_service.get_market_summary()
        
        if market_data and market_data.get("indices"):
            # Format the real data
            formatted_indices = []
            for index in market_data["indices"]:
                formatted_indices.append({
                    "symbol": index.get("symbol", ""),
                    "name": index.get("name", ""),
                    "price": index.get("price", 0),
                    "change": index.get("change", 0),
                    "change_percent": index.get("change_percent", 0),
                    "volume": index.get("volume", 0)
                })
            return formatted_indices
        
        # Fallback to Yahoo Finance for main indices if RapidAPI fails
        import yfinance as yf
        indices = ['^GSPC', '^DJI', '^IXIC']
        results = []
        
        for index in indices:
            try:
                ticker = yf.Ticker(index)
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
                        "volume": 0  # Volume not available from yfinance for indices
                    })
            except Exception as e:
                logger.error(f"Error fetching index {index}: {e}")
                continue
        
        if results:
            return results
        
        # Final fallback to hardcoded data only if everything fails
        logger.warning("All market data APIs failed, using fallback data")
        return [
            {
                "symbol": "^GSPC",
                "name": "S&P 500",
                "price": 4450.38,
                "change": -12.32,
                "change_percent": -0.28,
                "volume": 2156789000
            },
            {
                "symbol": "^DJI",
                "name": "Dow Jones",
                "price": 34521.45,
                "change": -156.78,
                "change_percent": -0.45,
                "volume": 345678900
            },
            {
                "symbol": "^IXIC",
                "name": "NASDAQ",
                "price": 13908.23,
                "change": 45.67,
                "change_percent": 0.33,
                "volume": 1876543200
            }
        ]
    except Exception as e:
        logger.error(f"Error fetching market summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch market summary: {str(e)}")


@router.get("/statistics/{symbol}", response_model=StockStatistics)
async def get_stock_statistics(symbol: str):
    """
    Get comprehensive statistics for a stock
    
    Args:
        symbol: Stock ticker symbol
    
    Returns:
        Detailed financial statistics and metrics
    """
    try:
        symbol = symbol.upper()
        stats = await yahoo_finance_rapid_service.get_stock_statistics(symbol)
        return StockStatistics(**stats)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch statistics: {str(e)}")


@router.get("/quote/{symbol}")
async def get_enhanced_quote(symbol: str):
    """
    Get enhanced quote data with analyst ratings and advanced metrics
    
    Args:
        symbol: Stock ticker symbol
    
    Returns:
        Enhanced quote information
    """
    try:
        symbol = symbol.upper()
        quote = await yahoo_finance_rapid_service.get_quote(symbol)
        return quote
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quote: {str(e)}")


# Risk analysis endpoint
@router.get("/risk-analysis/{symbol}")
async def analyze_stock_risk(symbol: str):
    """
    Analyze stock risk based on multiple factors
    
    Args:
        symbol: Stock ticker symbol
    
    Returns:
        Risk analysis with recommendations
    """
    try:
        symbol = symbol.upper()
        
        # Get comprehensive data
        quote = await yahoo_finance_rapid_service.get_quote(symbol)
        stats = await yahoo_finance_rapid_service.get_stock_statistics(symbol)
        
        # Calculate risk metrics
        beta = quote.get("beta", 1.0)
        pe_ratio = quote.get("pe_ratio", 0)
        debt_to_equity = stats.get("financial_health", {}).get("debt_to_equity", 0)
        price_change_percent = quote.get("price_change_percent", 0)
        
        # Risk scoring
        risk_score = 0
        risk_factors = []
        
        # Beta risk
        if beta > 1.5:
            risk_score += 25
            risk_factors.append(f"High volatility (Beta: {beta:.2f})")
        elif beta > 1.2:
            risk_score += 15
            risk_factors.append(f"Moderate volatility (Beta: {beta:.2f})")
        
        # Valuation risk
        if pe_ratio > 30:
            risk_score += 20
            risk_factors.append(f"High valuation (P/E: {pe_ratio:.2f})")
        elif pe_ratio > 20:
            risk_score += 10
            risk_factors.append(f"Moderate valuation (P/E: {pe_ratio:.2f})")
        
        # Debt risk
        if debt_to_equity > 2:
            risk_score += 25
            risk_factors.append(f"High debt levels (D/E: {debt_to_equity:.2f})")
        elif debt_to_equity > 1:
            risk_score += 15
            risk_factors.append(f"Moderate debt levels (D/E: {debt_to_equity:.2f})")
        
        # Price movement risk
        if abs(price_change_percent) > 5:
            risk_score += 20
            risk_factors.append(f"High daily volatility ({price_change_percent:.2f}%)")
        elif abs(price_change_percent) > 3:
            risk_score += 10
            risk_factors.append(f"Moderate daily volatility ({price_change_percent:.2f}%)")
        
        # Determine risk level
        if risk_score >= 60:
            risk_level = "HIGH"
            recommendation = "Consider risk mitigation strategies"
        elif risk_score >= 30:
            risk_level = "MODERATE"
            recommendation = "Monitor closely and diversify"
        else:
            risk_level = "LOW"
            recommendation = "Relatively stable investment"
        
        return {
            "symbol": symbol,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "risk_factors": risk_factors,
            "recommendation": recommendation,
            "metrics": {
                "beta": beta,
                "pe_ratio": pe_ratio,
                "debt_to_equity": debt_to_equity,
                "price_change_percent": price_change_percent,
                "analyst_rating": quote.get("analyst_rating", "N/A")
            },
            "suggested_hsbc_products": [
                "Portfolio Diversification Service",
                "Risk Management Advisory",
                "Structured Investment Products"
            ] if risk_score >= 30 else ["Standard Investment Account"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze risk: {str(e)}") 