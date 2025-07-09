"""
News monitoring service using NewsAPI
"""
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set
# NewsAPI imports moved to __init__ method to handle missing dependency gracefully
import logging
from dataclasses import dataclass
from collections import defaultdict

from ..core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class NewsArticle:
    """News article data structure"""
    title: str
    description: str
    source: str
    url: str
    published_at: datetime
    sentiment: Optional[str] = None
    relevance_score: float = 0.0
    symbols: List[str] = None

    def to_dict(self) -> Dict:
        return {
            "title": self.title,
            "description": self.description,
            "source": self.source,
            "url": self.url,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "sentiment": self.sentiment,
            "relevance_score": self.relevance_score,
            "symbols": self.symbols or []
        }


class NewsMonitor:
    """Monitor news for financial market events"""
    
    def __init__(self):
        self.api_key = settings.NEWS_API_KEY
        self.newsapi = None
        self.cache = {}  # Cache for recent news
        self.cache_duration = timedelta(minutes=15)  # Cache for 15 minutes
        self.monitored_symbols: Set[str] = set()
        self.keyword_alerts: Dict[str, List[str]] = defaultdict(list)  # keyword -> symbols mapping
        
        # Check if we have a real API key (not demo/placeholder values)
        if (self.api_key and 
            self.api_key not in ["demo_mock_mode", "your_news_api_key_here", "", None]):
            try:
                # Try to import and initialize NewsApiClient
                from newsapi import NewsApiClient
                self.newsapi = NewsApiClient(api_key=self.api_key)
                logger.info(f"📰 News service initialized with real API key: {self.api_key[:10]}...")
                
                # Test the API with a simple call
                try:
                    test_response = self.newsapi.get_top_headlines(category='business', page_size=1)
                    if test_response.get('status') == 'ok':
                        logger.info("📰 News API test call successful")
                    else:
                        logger.error(f"📰 News API test failed: {test_response}")
                        self.newsapi = None
                except Exception as test_e:
                    logger.error(f"📰 News API test call failed: {test_e}")
                    self.newsapi = None
                    
            except ImportError as e:
                logger.error(f"📰 Failed to import newsapi library: {e}")
                logger.info("📰 Install with: pip install newsapi-python")
                self.newsapi = None
            except Exception as e:
                logger.error(f"📰 Failed to initialize News API: {e}")
                logger.info("📰 Falling back to mock mode")
                self.newsapi = None
        else:
            logger.info(f"📰 News service running in mock mode - API key: '{self.api_key}'")
    
    def add_symbol_monitoring(self, symbol: str, keywords: Optional[List[str]] = None):
        """Add a symbol to monitor for news"""
        self.monitored_symbols.add(symbol.upper())
        
        # Default keywords if none provided
        if not keywords:
            keywords = [symbol, f"${symbol}"]
            
            # Add company-specific keywords
            company_keywords = {
                "AAPL": ["Apple", "iPhone", "Tim Cook", "iOS"],
                "TSLA": ["Tesla", "Elon Musk", "EV", "electric vehicle"],
                "MSFT": ["Microsoft", "Windows", "Azure", "Satya Nadella"],
                "GOOGL": ["Google", "Alphabet", "Android", "Sundar Pichai"],
                "AMZN": ["Amazon", "AWS", "Jeff Bezos", "Andy Jassy"],
                "META": ["Meta", "Facebook", "Instagram", "Mark Zuckerberg"],
                "NVDA": ["Nvidia", "GPU", "AI chips", "Jensen Huang"],
                "BTC": ["Bitcoin", "cryptocurrency", "crypto", "blockchain"],
                "ETH": ["Ethereum", "crypto", "DeFi", "smart contracts"]
            }
            
            if symbol.upper() in company_keywords:
                keywords.extend(company_keywords[symbol.upper()])
        
        # Store keyword-symbol mapping
        for keyword in keywords:
            self.keyword_alerts[keyword.lower()].append(symbol.upper())
            
        logger.info(f"Added news monitoring for {symbol} with keywords: {keywords}")
    
    def remove_symbol_monitoring(self, symbol: str):
        """Remove a symbol from monitoring"""
        symbol = symbol.upper()
        self.monitored_symbols.discard(symbol)
        
        # Remove from keyword mappings
        for keyword, symbols in list(self.keyword_alerts.items()):
            if symbol in symbols:
                symbols.remove(symbol)
                if not symbols:
                    del self.keyword_alerts[keyword]
                    
        logger.info(f"Removed news monitoring for {symbol}")
    
    async def search_news(
        self, 
        query: str, 
        language: str = "en",
        sort_by: str = "relevancy",
        page_size: int = 20,
        from_date: Optional[datetime] = None
    ) -> List[NewsArticle]:
        """Search for news articles"""
        if not self.newsapi:
            # Return filtered mock news data based on query
            mock_news = self._get_mock_market_news()
            # Simple search filter - check if query is in title or description
            filtered_news = []
            query_lower = query.lower()
            for article in mock_news:
                if (query_lower in article.title.lower() or 
                    query_lower in article.description.lower() or
                    any(query_lower in symbol.lower() for symbol in article.symbols)):
                    filtered_news.append(article)
            
            return filtered_news[:page_size]
        
        # Check cache first
        cache_key = f"{query}_{language}_{sort_by}_{page_size}"
        if cache_key in self.cache:
            cached_time, cached_articles = self.cache[cache_key]
            if datetime.now() - cached_time < self.cache_duration:
                logger.debug(f"Returning cached news for query: {query}")
                return cached_articles
        
        try:
            # Default to last 24 hours if no date specified
            if not from_date:
                from_date = datetime.now() - timedelta(days=1)
            
            # Search news
            response = self.newsapi.get_everything(
                q=query,
                language=language,
                sort_by=sort_by,
                page_size=page_size,
                from_param=from_date.strftime('%Y-%m-%d')
            )
            
            articles = []
            for article_data in response.get('articles', []):
                # Parse published date
                published_at = None
                if article_data.get('publishedAt'):
                    try:
                        published_at = datetime.fromisoformat(
                            article_data['publishedAt'].replace('Z', '+00:00')
                        )
                    except:
                        pass
                
                article = NewsArticle(
                    title=article_data.get('title', ''),
                    description=article_data.get('description', ''),
                    source=article_data.get('source', {}).get('name', 'Unknown'),
                    url=article_data.get('url', ''),
                    published_at=published_at,
                    symbols=self._extract_symbols(article_data)
                )
                
                # Calculate relevance score based on keyword matches
                article.relevance_score = self._calculate_relevance(article, query)
                articles.append(article)
            
            # Sort by relevance score
            articles.sort(key=lambda x: x.relevance_score, reverse=True)
            
            # Update cache
            self.cache[cache_key] = (datetime.now(), articles)
            
            return articles
            
        except Exception as e:
            if "NewsAPIException" in str(type(e)):
                logger.error(f"NewsAPI error: {e}")
            else:
                logger.error(f"Error searching news: {e}")
            return []
    
    async def get_market_news(self, category: str = "business") -> List[NewsArticle]:
        """Get top business/market news"""
        if not self.newsapi:
            logger.warning(f"📰 No real API configured (API key: {self.api_key[:10] + '...' if self.api_key and len(self.api_key) > 10 else self.api_key})")
            # Return mock news data for demo purposes
            return self._get_mock_market_news()
        
        cache_key = f"headlines_{category}"
        if cache_key in self.cache:
            cached_time, cached_articles = self.cache[cache_key]
            if datetime.now() - cached_time < self.cache_duration:
                return cached_articles
        
        try:
            response = self.newsapi.get_top_headlines(
                category=category,
                language='en',
                page_size=30
            )
            
            articles = []
            for article_data in response.get('articles', []):
                published_at = None
                if article_data.get('publishedAt'):
                    try:
                        published_at = datetime.fromisoformat(
                            article_data['publishedAt'].replace('Z', '+00:00')
                        )
                    except:
                        pass
                
                article = NewsArticle(
                    title=article_data.get('title', ''),
                    description=article_data.get('description', ''),
                    source=article_data.get('source', {}).get('name', 'Unknown'),
                    url=article_data.get('url', ''),
                    published_at=published_at,
                    symbols=self._extract_symbols(article_data)
                )
                articles.append(article)
            
            # Update cache
            self.cache[cache_key] = (datetime.now(), articles)
            
            return articles
            
        except Exception as e:
            logger.error(f"Error fetching market news: {e}")
            return []
    
    async def get_symbol_news(self, symbol: str) -> List[NewsArticle]:
        """Get news for a specific symbol"""
        # Build query based on symbol and its keywords
        keywords = [symbol]
        for keyword, symbols in self.keyword_alerts.items():
            if symbol.upper() in symbols:
                keywords.append(keyword)
        
        query = " OR ".join(f'"{k}"' for k in keywords[:5])  # Limit to 5 keywords
        return await self.search_news(query)
    
    async def monitor_news_alerts(self) -> List[Dict]:
        """Check for news alerts based on monitored symbols"""
        alerts = []
        
        if not self.monitored_symbols:
            return alerts
        
        # Search for news on each monitored symbol
        for symbol in self.monitored_symbols:
            articles = await self.get_symbol_news(symbol)
            
            # Check for high-relevance articles (potential market movers)
            for article in articles[:5]:  # Top 5 most relevant
                if article.relevance_score > 0.7:  # High relevance threshold
                    alert = {
                        "type": "major_news",
                        "severity": "high" if article.relevance_score > 0.85 else "medium",
                        "title": f"Breaking: {symbol} - {article.title[:50]}...",
                        "message": article.description[:200] if article.description else article.title,
                        "timestamp": article.published_at.isoformat() if article.published_at else datetime.now().isoformat(),
                        "source": article.source,
                        "url": article.url,
                        "symbol": symbol,
                        "metadata": {
                            "relevance_score": article.relevance_score,
                            "full_title": article.title
                        }
                    }
                    alerts.append(alert)
        
        return alerts
    
    def _extract_symbols(self, article_data: Dict) -> List[str]:
        """Extract stock symbols mentioned in the article"""
        symbols = []
        text = f"{article_data.get('title', '')} {article_data.get('description', '')}"
        
        # Look for stock symbols (e.g., $AAPL, AAPL)
        import re
        # Updated pattern to match stock symbols
        pattern = r'\$[A-Z]{1,5}\b|(?:^|\s)([A-Z]{2,5})(?:\s|$|[,.])'
        matches = re.findall(pattern, text)
        
        # Common stock symbols to recognize
        common_symbols = {
            'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'NVDA', 
            'BRK', 'V', 'JNJ', 'WMT', 'JPM', 'PG', 'MA', 'UNH', 'HD', 'DIS',
            'BAC', 'XOM', 'ABBV', 'CVX', 'PFE', 'CSCO', 'TMO', 'COST', 'PEP',
            'AVGO', 'KO', 'MRK', 'LLY', 'ACN', 'NKE', 'ADBE', 'NFLX', 'ABT',
            'AMD', 'INTC', 'WFC', 'CRM', 'ORCL', 'MDT', 'UPS', 'TXN', 'MS',
            'BA', 'BMY', 'RTX', 'NOW', 'QCOM', 'CVS', 'GS', 'HON', 'SCHW',
            'SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO',  # Popular ETFs
            'GM', 'F', 'UBER', 'LYFT', 'ABNB', 'COIN', 'HOOD', 'PLTR', 'SOFI'
        }
        
        # Also check for company names and map to symbols
        company_mappings = {
            'apple': 'AAPL', 'microsoft': 'MSFT', 'google': 'GOOGL', 'alphabet': 'GOOGL',
            'amazon': 'AMZN', 'meta': 'META', 'facebook': 'META', 'tesla': 'TSLA',
            'nvidia': 'NVDA', 'berkshire': 'BRK', 'visa': 'V', 'johnson': 'JNJ',
            'walmart': 'WMT', 'jpmorgan': 'JPM', 'jp morgan': 'JPM', 'disney': 'DIS',
            'netflix': 'NFLX', 'adobe': 'ADBE', 'salesforce': 'CRM', 'oracle': 'ORCL',
            'intel': 'INTC', 'amd': 'AMD', 'ford': 'F', 'general motors': 'GM',
            'gm': 'GM', 'uber': 'UBER', 'coinbase': 'COIN', 'robinhood': 'HOOD',
            'figma': 'FIGM', 'santander': 'SAN', 'costco': 'COST', 'lululemon': 'LULU',
            'constellation': 'STZ', 'blackrock': 'BLK'
        }
        
        # Extract symbols from regex matches
        for match in matches:
            if isinstance(match, tuple):
                symbol = match[0] if match[0] else None
            else:
                symbol = match.replace('$', '').strip()
            
            if symbol and len(symbol) >= 2 and len(symbol) <= 5 and symbol.isalpha():
                if symbol in common_symbols:
                    symbols.append(symbol)
        
        # Check for company names in text
        text_lower = text.lower()
        for company_name, symbol in company_mappings.items():
            if company_name in text_lower:
                symbols.append(symbol)
        
        # Return unique symbols
        return list(set(symbols))
    
    def _calculate_relevance(self, article: NewsArticle, query: str) -> float:
        """Calculate relevance score for an article"""
        score = 0.0
        query_lower = query.lower()
        
        # Check title (highest weight)
        if query_lower in article.title.lower():
            score += 0.5
        
        # Check description
        if article.description and query_lower in article.description.lower():
            score += 0.3
        
        # Check for related keywords
        for keyword in self.keyword_alerts:
            if keyword in article.title.lower() or (article.description and keyword in article.description.lower()):
                score += 0.1
        
        # Boost for recent articles
        if article.published_at:
            hours_old = (datetime.now() - article.published_at.replace(tzinfo=None)).total_seconds() / 3600
            if hours_old < 1:
                score += 0.2
            elif hours_old < 6:
                score += 0.1
        
        return min(score, 1.0)  # Cap at 1.0

    def _get_mock_market_news(self) -> List[NewsArticle]:
        """Generate mock market news for demo purposes"""
        from datetime import datetime, timedelta
        import random
        
        # Mock news articles with financial/market themes
        mock_articles = [
            {
                "title": "Fed Signals Potential Interest Rate Cuts Amid Economic Uncertainty",
                "description": "Federal Reserve officials hint at possible monetary policy adjustments as inflation shows signs of cooling while employment remains robust.",
                "source": "Reuters",
                "url": "https://www.reuters.com/business/finance/",
                "symbols": ["SPY", "QQQ", "DIA"]
            },
            {
                "title": "Tech Stocks Rally as AI Investments Drive Market Optimism",
                "description": "Major technology companies report strong earnings driven by artificial intelligence investments, pushing the NASDAQ to new highs.",
                "source": "Bloomberg",
                "url": "https://www.bloomberg.com/technology",
                "symbols": ["AAPL", "MSFT", "GOOGL", "NVDA"]
            },
            {
                "title": "Oil Prices Surge Following OPEC+ Production Cut Announcement",
                "description": "Energy markets react positively to OPEC+ decision to maintain production cuts, driving crude oil futures higher.",
                "source": "Financial Times",
                "url": "https://www.ft.com/commodities",
                "symbols": ["XOM", "CVX", "COP"]
            },
            {
                "title": "Banking Sector Shows Resilience Despite Credit Concerns",
                "description": "Major banks report better-than-expected quarterly results, with loan growth offsetting credit quality worries.",
                "source": "Wall Street Journal",
                "url": "https://www.wsj.com/finance",
                "symbols": ["JPM", "BAC", "WFC", "C"]
            },
            {
                "title": "Electric Vehicle Sales Accelerate in Global Markets",
                "description": "EV manufacturers report record deliveries as government incentives and improving infrastructure boost adoption rates.",
                "source": "CNBC",
                "url": "https://www.cnbc.com/electric-vehicles/",
                "symbols": ["TSLA", "GM", "F", "RIVN"]
            },
            {
                "title": "Cryptocurrency Market Gains Momentum with Institutional Adoption",
                "description": "Digital assets see increased institutional investment as regulatory clarity improves and ETF approvals expand.",
                "source": "CoinDesk",
                "url": "https://www.coindesk.com/markets/",
                "symbols": ["COIN", "MSTR", "RIOT"]
            },
            {
                "title": "Healthcare Stocks Outperform on Breakthrough Drug Approvals",
                "description": "Pharmaceutical companies report positive clinical trial results, driving healthcare sector gains amid aging population trends.",
                "source": "MarketWatch",
                "url": "https://www.marketwatch.com/investing/index/djuspr",
                "symbols": ["JNJ", "PFE", "ABBV", "MRK"]
            },
            {
                "title": "Consumer Spending Remains Strong Despite Inflation Concerns",
                "description": "Retail sales data shows continued consumer resilience as spending patterns shift toward experiences and services.",
                "source": "Yahoo Finance",
                "url": "https://finance.yahoo.com/topic/retail/",
                "symbols": ["WMT", "AMZN", "TGT", "COST"]
            },
            {
                "title": "Semiconductor Shortage Eases as Supply Chain Normalizes",
                "description": "Chip manufacturers report improved production capacity, signaling relief for automotive and electronics industries.",
                "source": "The Information",
                "url": "https://www.theinformation.com/semiconductors",
                "symbols": ["INTC", "AMD", "QCOM", "AVGO"]
            },
            {
                "title": "Real Estate Market Shows Signs of Stabilization",
                "description": "Housing data indicates slowing price growth and increased inventory levels as mortgage rates remain elevated.",
                "source": "National Association of Realtors",
                "url": "https://www.nar.realtor/research-and-statistics",
                "symbols": ["D", "O", "PLD", "EXR"]
            }
        ]
        
        articles = []
        now = datetime.now()
        
        # Generate articles with random recent timestamps
        for i, article_data in enumerate(mock_articles[:8]):  # Use first 8 articles
            # Generate random timestamp within last 24 hours
            hours_ago = random.randint(1, 24)
            published_at = now - timedelta(hours=hours_ago)
            
            article = NewsArticle(
                title=article_data["title"],
                description=article_data["description"],
                source=article_data["source"],
                url=article_data["url"],
                published_at=published_at,
                sentiment=random.choice(["positive", "neutral", "negative"]),
                relevance_score=random.uniform(0.7, 0.95),
                symbols=article_data["symbols"]
            )
            articles.append(article)
        
        # Sort by published date (newest first)
        articles.sort(key=lambda x: x.published_at, reverse=True)
        
        return articles


# Global instance
news_monitor = NewsMonitor() 