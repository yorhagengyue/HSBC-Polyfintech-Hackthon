"""
Cost Tracking Service
Tracks LLM usage and costs for monitoring
"""
import csv
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path
import aiofiles
import asyncio

logger = logging.getLogger(__name__)

class CostTrackingService:
    """Service for tracking LLM usage and costs"""
    
    def __init__(self, log_dir: str = "logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        self.usage_file = self.log_dir / "llm_usage.csv"
        self.daily_summary_file = self.log_dir / "llm_daily_summary.json"
        self._write_lock = asyncio.Lock()
        
        # Initialize CSV file with headers if it doesn't exist
        self._initialize_csv()
    
    def _initialize_csv(self):
        """Initialize CSV file with headers"""
        if not self.usage_file.exists():
            with open(self.usage_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'timestamp', 'user_id', 'session_id', 'provider', 'model',
                    'input_tokens', 'output_tokens', 'total_tokens', 'cost_usd',
                    'response_time_ms', 'success', 'error_type'
                ])
    
    async def log_usage(
        self,
        user_id: Optional[str],
        session_id: str,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        cost_usd: float,
        response_time_ms: int,
        success: bool = True,
        error_type: Optional[str] = None,
        usage_metadata: Optional[Dict[str, Any]] = None
    ):
        """Log LLM usage to CSV file"""
        async with self._write_lock:
            try:
                # If we have actual usage metadata from provider, use it
                if usage_metadata:
                    if 'promptTokenCount' in usage_metadata:
                        input_tokens = usage_metadata['promptTokenCount']
                    if 'candidatesTokenCount' in usage_metadata:
                        output_tokens = usage_metadata['candidatesTokenCount']
                    if 'totalTokenCount' in usage_metadata:
                        total_tokens = usage_metadata['totalTokenCount']
                    else:
                        total_tokens = input_tokens + output_tokens
                else:
                    total_tokens = input_tokens + output_tokens
                
                # Write to CSV
                async with aiofiles.open(self.usage_file, 'a', newline='') as f:
                    row = [
                        datetime.utcnow().isoformat(),
                        user_id or 'anonymous',
                        session_id,
                        provider,
                        model,
                        input_tokens,
                        output_tokens,
                        total_tokens,
                        f"{cost_usd:.6f}",
                        response_time_ms,
                        success,
                        error_type or ''
                    ]
                    await f.write(','.join(str(x) for x in row) + '\n')
                
                # Update daily summary
                await self._update_daily_summary(provider, model, total_tokens, cost_usd)
                
            except Exception as e:
                logger.error(f"Failed to log usage: {e}")
    
    async def _update_daily_summary(self, provider: str, model: str, tokens: int, cost: float):
        """Update daily summary statistics"""
        today = datetime.utcnow().date().isoformat()
        
        try:
            # Read existing summary
            summary = {}
            if self.daily_summary_file.exists():
                async with aiofiles.open(self.daily_summary_file, 'r') as f:
                    content = await f.read()
                    summary = json.loads(content) if content else {}
            
            # Update summary
            if today not in summary:
                summary[today] = {}
            
            provider_key = f"{provider}:{model}"
            if provider_key not in summary[today]:
                summary[today][provider_key] = {
                    'calls': 0,
                    'tokens': 0,
                    'cost_usd': 0.0
                }
            
            summary[today][provider_key]['calls'] += 1
            summary[today][provider_key]['tokens'] += tokens
            summary[today][provider_key]['cost_usd'] += cost
            
            # Write updated summary
            async with aiofiles.open(self.daily_summary_file, 'w') as f:
                await f.write(json.dumps(summary, indent=2))
                
        except Exception as e:
            logger.error(f"Failed to update daily summary: {e}")
    
    def calculate_cost(self, provider: str, model: str, input_tokens: int, output_tokens: int) -> float:
        """Calculate cost based on provider pricing"""
        # Pricing as of Jan 2025 (per 1M tokens)
        pricing = {
            "gemini:gemini-2.0-flash-exp": {
                "input": 0.075,   # $0.075 per 1M input tokens
                "output": 0.30    # $0.30 per 1M output tokens
            },
            "gemini:gemini-1.5-pro": {
                "input": 3.50,    # $3.50 per 1M input tokens
                "output": 10.50   # $10.50 per 1M output tokens
            },
            "gemini:gemini-pro": {
                "input": 0.50,    # $0.50 per 1M input tokens
                "output": 1.50    # $1.50 per 1M output tokens
            },
            "ollama:*": {
                "input": 0.0,     # Free for local models
                "output": 0.0
            }
        }
        
        # Get pricing for provider:model
        key = f"{provider}:{model}"
        if key not in pricing:
            # Check for wildcard match
            for pattern, prices in pricing.items():
                if pattern.endswith('*') and key.startswith(pattern[:-1]):
                    key = pattern
                    break
            else:
                # Default pricing if not found
                return 0.001  # $0.001 default
        
        prices = pricing[key]
        input_cost = (input_tokens / 1_000_000) * prices["input"]
        output_cost = (output_tokens / 1_000_000) * prices["output"]
        
        return input_cost + output_cost
    
    async def get_usage_summary(self, days: int = 7) -> Dict[str, Any]:
        """Get usage summary for the last N days"""
        try:
            if not self.daily_summary_file.exists():
                return {"error": "No usage data available"}
            
            async with aiofiles.open(self.daily_summary_file, 'r') as f:
                content = await f.read()
                all_summary = json.loads(content) if content else {}
            
            # Get last N days
            from datetime import timedelta
            end_date = datetime.utcnow().date()
            start_date = end_date - timedelta(days=days-1)
            
            summary = {
                "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
                "total_calls": 0,
                "total_tokens": 0,
                "total_cost_usd": 0.0,
                "by_provider": {},
                "by_day": {}
            }
            
            # Aggregate data
            current_date = start_date
            while current_date <= end_date:
                date_key = current_date.isoformat()
                if date_key in all_summary:
                    summary["by_day"][date_key] = all_summary[date_key]
                    
                    for provider_model, stats in all_summary[date_key].items():
                        summary["total_calls"] += stats["calls"]
                        summary["total_tokens"] += stats["tokens"]
                        summary["total_cost_usd"] += stats["cost_usd"]
                        
                        if provider_model not in summary["by_provider"]:
                            summary["by_provider"][provider_model] = {
                                "calls": 0,
                                "tokens": 0,
                                "cost_usd": 0.0
                            }
                        
                        summary["by_provider"][provider_model]["calls"] += stats["calls"]
                        summary["by_provider"][provider_model]["tokens"] += stats["tokens"]
                        summary["by_provider"][provider_model]["cost_usd"] += stats["cost_usd"]
                
                current_date += timedelta(days=1)
            
            return summary
            
        except Exception as e:
            logger.error(f"Failed to get usage summary: {e}")
            return {"error": str(e)}

# Global instance
cost_tracker = CostTrackingService() 