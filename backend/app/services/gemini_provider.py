"""
Google Gemini Provider Implementation for AI Studio
Based on ai.md document design using AI Studio API Key
Enhanced with prompt template service
"""
import os
import json
from typing import Optional, Dict, Any, List
import google.generativeai as genai
import httpx
from datetime import datetime
import asyncio
from .prompt_service import prompt_service

class GeminiProvider:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        
        genai.configure(api_key=self.api_key)
        
        # Get system prompt from configuration
        system_prompt = prompt_service.get_system_prompt()
        
        # Check if strict mode is enabled
        self.strict_mode = os.getenv("PROMPT_STRICT", "true").lower() == "true"
        
        # Set generation config based on mode
        self.generation_config = {
            "temperature": prompt_service.system_config['response_constraints']['temperature_strict'] if self.strict_mode else prompt_service.system_config['response_constraints']['temperature_creative'],
            "top_p": prompt_service.system_config['response_constraints']['top_p_strict'] if self.strict_mode else prompt_service.system_config['response_constraints']['top_p_creative'],
            "max_output_tokens": prompt_service.system_config['response_constraints']['max_tokens'],
        }
        
        # Try Gemini 2.0 Flash first, fallback to 1.5 Pro
        try:
            self.model = genai.GenerativeModel(
                'gemini-2.0-flash-exp',
                generation_config=self.generation_config,
                system_instruction=system_prompt
            )
            self.model_name = 'Gemini 2.0 Flash (Experimental)'
        except:
            try:
                self.model = genai.GenerativeModel(
                    'gemini-1.5-pro',
                    generation_config=self.generation_config,
                    system_instruction=system_prompt
                )
                self.model_name = 'Gemini 1.5 Pro'
            except:
                self.model = genai.GenerativeModel(
                    'gemini-pro',
                    generation_config=self.generation_config,
                    system_instruction=system_prompt
                )
                self.model_name = 'Gemini Pro'
        
        # Legacy prompts for backward compatibility
        self.simple_prompt = system_prompt + "\n\nFor simple queries, keep responses to 2-3 paragraphs with bullet points for key insights."
        self.deep_prompt = system_prompt + "\n\nFor deep analysis, provide comprehensive research with detailed technical analysis, calculations, and specific recommendations."

    async def analyze_with_template(self, template_name: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze using a specific prompt template"""
        try:
            # Render the template with context
            prompt = prompt_service.render_template(template_name, context)
            
            # Check if this template expects JSON response
            expects_json = "Return ONLY valid JSON" in prompt or "```json" in prompt
            
            if expects_json:
                # Use JSON response mode
                response_data = await self.generate_json_response(prompt)
                return {
                    "response": response_data,
                    "model": self.model_name,
                    "mode": "json",
                    "template": template_name,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            else:
                # Regular text response
                response = self.model.generate_content(prompt)
                return {
                    "response": response.text,
                    "model": self.model_name,
                    "mode": "text",
                    "template": template_name,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
                
        except Exception as e:
            return {
                "response": f"Error using template {template_name}: {str(e)}",
                "error": True,
                "model": self.model_name,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }

    async def generate_json_response(self, prompt: str, retry_count: int = 2) -> Dict[str, Any]:
        """Generate a JSON response with validation and retry logic"""
        for attempt in range(retry_count):
            try:
                # Try with JSON response mime type if supported
                try:
                    json_model = genai.GenerativeModel(
                        self.model.model_name,
                        generation_config={
                            **self.generation_config,
                            "response_mime_type": "application/json"
                        },
                        system_instruction=prompt_service.get_system_prompt()
                    )
                    response = json_model.generate_content(prompt)
                    return json.loads(response.text)
                except:
                    # Fallback to regular generation with JSON instruction
                    enhanced_prompt = prompt + "\n\nIMPORTANT: Output ONLY valid JSON, no markdown formatting or additional text."
                    response = self.model.generate_content(enhanced_prompt)
                    
                    # Try to parse JSON from response
                    parsed = prompt_service.validate_json_response(response.text)
                    return parsed
                    
            except json.JSONDecodeError as e:
                if attempt < retry_count - 1:
                    # Retry with more explicit instruction
                    prompt = f"Previous response was not valid JSON. Error: {str(e)}\n\n{prompt}\n\nPlease output ONLY valid JSON."
                    continue
                else:
                    raise ValueError(f"Failed to get valid JSON response after {retry_count} attempts")
            except Exception as e:
                raise

    async def analyze_with_sources(self, query: str, mode: str = "simple") -> Dict[str, Any]:
        """Enhanced analyze method with source citations"""
        # Add current date to prompt
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        if mode == "deep":
            prompt = self.deep_prompt.replace("{current_date}", current_date)
        else:
            prompt = self.simple_prompt
            
        # Include instruction to cite sources
        full_prompt = f"{prompt}\n\nUser Query: {query}\n\nRemember to cite sources using [source: name] format."
        
        response = self.model.generate_content(full_prompt)
        
        return {
            "response": response.text,
            "model": self.model_name,
            "mode": mode,
            "timestamp": current_date
        }

    async def analyze(self, message: str, conversation_history: List[Dict] = None, analysis_mode: str = "simple", context: Dict = None) -> str:
        """Analyze message with optional context and conversation history"""
        try:
            # Check if we need to ask for risk profile
            needs_risk_profile = self._check_needs_risk_profile(message, conversation_history)
            
            # Get user risk profile from context if available
            user_risk_profile = "medium"  # default
            if context and isinstance(context, dict):
                user_risk_profile = context.get('user_risk_profile', 'medium')
            
            # Get risk profile context
            risk_context = prompt_service.get_risk_profile_context(user_risk_profile)
            
            # Build conversation context
            conversation_text = ""
            if conversation_history:
                for msg in conversation_history[-6:]:  # Last 6 messages for context
                    if msg.get("user"):
                        conversation_text += f"User: {msg['user']}\n"
                    if msg.get("assistant"):
                        conversation_text += f"Assistant: {msg['assistant']}\n"
            
            # Build the full prompt
            prompt_parts = []
            
            # Add system context
            prompt_parts.append(f"User Risk Profile: {user_risk_profile}")
            prompt_parts.append(f"Volatile Asset Allocation: {risk_context['volatile_asset_allocation']}")
            prompt_parts.append(f"Investment Focus: {risk_context['risk_focus']}")
            
            if conversation_text:
                prompt_parts.append("\n---Previous Conversation---\n")
                prompt_parts.append(conversation_text)
            
            # Add risk profile check
            if needs_risk_profile:
                prompt_parts.append("\nIMPORTANT: The user hasn't specified their risk profile. Ask about it before providing specific allocation recommendations.\n")
            
            # Add context if provided
            if context:
                if context.get("news_articles"):
                    articles_text = "\n---News Context---\n"
                    for article in context["news_articles"]:
                        articles_text += f"Title: {article.get('title', 'N/A')}\n"
                        articles_text += f"Source: {article.get('source', 'N/A')}\n"
                        articles_text += f"Date: {article.get('published_at', 'N/A')}\n"
                        articles_text += f"Description: {article.get('description', 'N/A')}\n"
                        articles_text += f"Tags: {', '.join(article.get('tags', []))}\n\n"
                    prompt_parts.append(articles_text)
            
            prompt_parts.append(f"\n---Current Query---\nUser: {message}\n\nProvide a {analysis_mode} analysis:")
            
            full_prompt = "\n".join(prompt_parts)
            
            # Generate response
            response = self.model.generate_content(full_prompt)
            response_text = response.text
            
            # Ensure HSBC product is mentioned
            if "HSBC" not in response_text:
                hsbc_product = prompt_service.get_hsbc_product()
                response_text += f"\n\nConsider {hsbc_product} for professional wealth management support."
            
            # Ensure disclaimer is present
            if "*Disclaimer:" not in response_text and "*disclaimer:" not in response_text.lower():
                disclaimer = prompt_service.get_compliance_disclaimer("default" if "crypto" not in message.lower() else "crypto")
                response_text += f"\n\n*{disclaimer}*"
            
            return response_text
            
        except Exception as e:
            return f"I apologize, but I encountered an error while processing your request: {str(e)}. Please try again or rephrase your question."
    
    def _check_needs_risk_profile(self, message: str, history: List[Dict]) -> bool:
        """Check if we need to ask for user's risk profile"""
        # Keywords that indicate investment advice is being sought
        investment_keywords = [
            "should i invest", "how much", "allocation", "portfolio", 
            "percentage", "risk", "crypto", "stocks", "bonds"
        ]
        
        message_lower = message.lower()
        needs_advice = any(keyword in message_lower for keyword in investment_keywords)
        
        if not needs_advice:
            return False
            
        # Check if risk profile was already mentioned in history
        if history:
            history_text = " ".join([
                msg.get("user", "") + " " + msg.get("assistant", "")
                for msg in history
            ]).lower()
            
            risk_mentioned = any(term in history_text for term in [
                "risk profile", "risk tolerance", "conservative", "moderate", 
                "aggressive", "low risk", "medium risk", "high risk"
            ])
            
            if risk_mentioned:
                return False
                
        return True
    
    async def fetch_url_content(self, url: str) -> str:
        """Fetch and extract content from URL for deep analysis"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10.0)
                if response.status_code == 200:
                    # Simple extraction - in production, use proper HTML parsing
                    text = response.text
                    # Remove HTML tags (basic approach)
                    import re
                    text = re.sub('<[^<]+?>', '', text)
                    # Limit to first 3000 chars to avoid token limits
                    return text[:3000]
        except:
            pass
        return ""
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Get provider information"""
        return {
            "provider": "Google Gemini",
            "model": self.model_name,
            "features": [
                "Market Analysis",
                "Risk Assessment", 
                "Portfolio Optimization",
                "HSBC Product Recommendations",
                "Technical Analysis",
                "Alert Explanations",
                "Template-based Prompts",
                "JSON Response Mode"
            ],
            "modes": {
                "simple": "Quick insights in 2-3 paragraphs",
                "deep": "Comprehensive analysis with detailed research",
                "json": "Structured JSON responses",
                "template": "Template-based prompt generation"
            },
            "configuration": {
                "strict_mode": self.strict_mode,
                "temperature": self.generation_config.get('temperature'),
                "top_p": self.generation_config.get('top_p'),
                "max_tokens": self.generation_config.get('max_output_tokens')
            }
        } 