"""
News monitoring service using NewsAPI
"""
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set
from newsapi import NewsApiClient
from newsapi.newsapi_exception import NewsAPIException
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
        
        if self.api_key:
            self.newsapi = NewsApiClient(api_key=self.api_key)
        else:
            logger.warning("NEWS_API_KEY not configured. News monitoring disabled.")
    
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
            logger.warning("News API not configured")
            return []
        
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
            
        except NewsAPIException as e:
            logger.error(f"NewsAPI error: {e}")
            return []
        except Exception as e:
            logger.error(f"Error searching news: {e}")
            return []
    
    async def get_market_news(self, category: str = "business") -> List[NewsArticle]:
        """Get top business/market news"""
        if not self.newsapi:
            return []
        
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


# Global instance
news_monitor = NewsMonitor() 