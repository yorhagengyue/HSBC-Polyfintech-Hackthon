"""
Crypto Data Service for fetching real-time cryptocurrency data with citations
"""
import os
import httpx
from typing import Dict, List, Optional
from datetime import datetime
import asyncio

class CryptoDataService:
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"
        self.headers = {
            "accept": "application/json",
            "User-Agent": "Financial-Alarm-Clock/1.0"
        }
        
    async def get_crypto_prices(self, symbols: List[str] = ["bitcoin", "ethereum"]) -> Dict:
        """Fetch current crypto prices with source citation"""
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "ids": ",".join(symbols),
                    "vs_currencies": "usd",
                    "include_24hr_change": "true",
                    "include_market_cap": "true"
                }
                
                response = await client.get(
                    f"{self.base_url}/simple/price",
                    params=params,
                    headers=self.headers,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Format with citations
                    formatted_data = {}
                    for coin, metrics in data.items():
                        formatted_data[coin] = {
                            "price": metrics.get("usd", 0),
                            "change_24h": metrics.get("usd_24h_change", 0),
                            "market_cap": metrics.get("usd_market_cap", 0),
                            "source": "CoinGecko",
                            "timestamp": datetime.now().isoformat()
                        }
                    
                    return formatted_data
                    
        except Exception as e:
            return {
                "error": f"Failed to fetch crypto prices: {str(e)}",
                "source": "CoinGecko",
                "timestamp": datetime.now().isoformat()
            }
    
    async def get_fear_greed_index(self) -> Dict:
        """Fetch crypto fear and greed index"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.alternative.me/fng/",
                    headers=self.headers,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("data"):
                        latest = data["data"][0]
                        return {
                            "value": int(latest.get("value", 0)),
                            "classification": latest.get("value_classification", ""),
                            "timestamp": latest.get("timestamp", ""),
                            "source": "Alternative.me Fear & Greed Index",
                            "updated": datetime.now().isoformat()
                        }
                        
        except Exception as e:
            return {
                "error": f"Failed to fetch fear/greed index: {str(e)}",
                "source": "Alternative.me",
                "timestamp": datetime.now().isoformat()
            }
    
    async def get_trending_cryptos(self) -> Dict:
        """Get trending cryptocurrencies"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/search/trending",
                    headers=self.headers,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    trending = []
                    
                    for coin in data.get("coins", [])[:5]:  # Top 5
                        item = coin.get("item", {})
                        trending.append({
                            "symbol": item.get("symbol", ""),
                            "name": item.get("name", ""),
                            "market_cap_rank": item.get("market_cap_rank", 0),
                            "price_btc": item.get("price_btc", 0)
                        })
                    
                    return {
                        "trending": trending,
                        "source": "CoinGecko Trending",
                        "timestamp": datetime.now().isoformat()
                    }
                    
        except Exception as e:
            return {
                "error": f"Failed to fetch trending cryptos: {str(e)}",
                "source": "CoinGecko",
                "timestamp": datetime.now().isoformat()
            }
    
    async def get_market_overview(self) -> Dict:
        """Get comprehensive crypto market overview with all citations"""
        try:
            # Fetch all data concurrently
            prices_task = self.get_crypto_prices(["bitcoin", "ethereum", "binancecoin", "cardano", "solana"])
            fear_greed_task = self.get_fear_greed_index()
            trending_task = self.get_trending_cryptos()
            
            prices, fear_greed, trending = await asyncio.gather(
                prices_task, fear_greed_task, trending_task
            )
            
            return {
                "prices": prices,
                "fear_greed_index": fear_greed,
                "trending": trending,
                "summary": {
                    "total_sources": 3,
                    "last_updated": datetime.now().isoformat(),
                    "data_providers": ["CoinGecko", "Alternative.me"]
                }
            }
            
        except Exception as e:
            return {
                "error": f"Failed to fetch market overview: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

# Singleton instance
crypto_service = CryptoDataService() 