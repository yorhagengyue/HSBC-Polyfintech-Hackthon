"""
HSBC Product Mapping Service
Maps topics/contexts to relevant HSBC products
"""
from typing import Dict, List, Optional
import random

class ProductMappingService:
    """Service for mapping topics to HSBC products"""
    
    def __init__(self):
        self.product_catalog = {
            # Crypto/High-risk topics
            "crypto": [
                {
                    "id": "hsbc_crypto_custody",
                    "name": "HSBC Digital Asset Custody",
                    "description": "Secure institutional-grade custody for digital assets",
                    "benefit": "protect your crypto holdings with bank-level security"
                },
                {
                    "id": "hsbc_risk_management",
                    "name": "HSBC Risk Management Solutions",
                    "description": "Advanced risk analytics and hedging strategies",
                    "benefit": "hedge your volatile asset exposure"
                }
            ],
            
            # Stock market topics
            "stocks": [
                {
                    "id": "hsbc_investdirect",
                    "name": "HSBC InvestDirect",
                    "description": "Online trading platform with real-time market data",
                    "benefit": "execute trades with competitive fees and advanced tools"
                },
                {
                    "id": "hsbc_equity_research",
                    "name": "HSBC Global Equity Research",
                    "description": "In-depth research reports and market analysis",
                    "benefit": "make informed decisions with institutional-grade research"
                }
            ],
            
            # Wealth management
            "wealth": [
                {
                    "id": "hsbc_premier_wealth",
                    "name": "HSBC Premier Wealth Management",
                    "description": "Personalized wealth planning and portfolio management",
                    "benefit": "optimize your portfolio with dedicated wealth advisors"
                },
                {
                    "id": "hsbc_private_banking",
                    "name": "HSBC Private Banking",
                    "description": "Exclusive banking services for high-net-worth individuals",
                    "benefit": "access bespoke investment opportunities"
                }
            ],
            
            # Risk/Insurance
            "risk": [
                {
                    "id": "hsbc_life_insurance",
                    "name": "HSBC Life Insurance",
                    "description": "Comprehensive life and critical illness coverage",
                    "benefit": "protect your family's financial future"
                },
                {
                    "id": "hsbc_investment_protection",
                    "name": "HSBC Investment Protection",
                    "description": "Capital protection strategies for volatile markets",
                    "benefit": "safeguard your investments during market downturns"
                }
            ],
            
            # Sustainable/ESG
            "esg": [
                {
                    "id": "hsbc_sustainable_funds",
                    "name": "HSBC Sustainable Investment Funds",
                    "description": "ESG-focused investment portfolios",
                    "benefit": "align your investments with sustainable values"
                },
                {
                    "id": "hsbc_green_bonds",
                    "name": "HSBC Green Bonds",
                    "description": "Fixed income products funding environmental projects",
                    "benefit": "earn stable returns while supporting green initiatives"
                }
            ],
            
            # General/Default
            "general": [
                {
                    "id": "hsbc_premier_account",
                    "name": "HSBC Premier Account",
                    "description": "Premium banking with investment privileges",
                    "benefit": "enjoy preferential rates and dedicated support"
                },
                {
                    "id": "hsbc_global_money",
                    "name": "HSBC Global Money Account",
                    "description": "Multi-currency account for international investors",
                    "benefit": "manage multiple currencies seamlessly"
                }
            ]
        }
        
        # Topic keywords mapping
        self.topic_keywords = {
            "crypto": ["crypto", "bitcoin", "ethereum", "digital asset", "blockchain", "defi"],
            "stocks": ["stock", "equity", "shares", "trading", "market", "portfolio"],
            "wealth": ["wealth", "portfolio", "investment", "asset allocation", "diversification"],
            "risk": ["risk", "insurance", "protection", "hedge", "volatility", "safety"],
            "esg": ["sustainable", "esg", "green", "climate", "environmental", "social"],
        }
    
    def get_relevant_product(self, topic: str, context: Optional[str] = None) -> Dict[str, str]:
        """Get the most relevant HSBC product for a given topic"""
        # Determine category from topic and context
        category = self._determine_category(topic, context)
        
        # Get products from the category
        products = self.product_catalog.get(category, self.product_catalog["general"])
        
        # Select the most relevant product (can be enhanced with ML later)
        selected = products[0] if products else self.product_catalog["general"][0]
        
        return {
            "id": selected["id"],
            "name": selected["name"],
            "description": selected["description"],
            "benefit": selected["benefit"],
            "category": category
        }
    
    def _determine_category(self, topic: str, context: Optional[str] = None) -> str:
        """Determine product category based on topic and context"""
        combined_text = f"{topic} {context or ''}".lower()
        
        # Check each category's keywords
        scores = {}
        for category, keywords in self.topic_keywords.items():
            score = sum(1 for keyword in keywords if keyword in combined_text)
            if score > 0:
                scores[category] = score
        
        # Return category with highest score, or general if no matches
        if scores:
            return max(scores, key=scores.get)
        return "general"
    
    def get_products_by_risk_level(self, risk_level: str) -> List[Dict[str, str]]:
        """Get products suitable for a specific risk level"""
        risk_mapping = {
            "low": ["risk", "general"],
            "medium": ["wealth", "stocks", "general"],
            "high": ["crypto", "stocks", "wealth"]
        }
        
        categories = risk_mapping.get(risk_level.lower(), ["general"])
        products = []
        
        for category in categories:
            if category in self.product_catalog:
                products.extend(self.product_catalog[category])
        
        return products[:3]  # Return top 3 products

# Global instance
product_mapper = ProductMappingService() 