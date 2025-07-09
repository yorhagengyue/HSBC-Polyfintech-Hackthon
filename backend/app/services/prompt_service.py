"""
Prompt Template Service
Handles loading and rendering of prompt templates with variable substitution
"""
import os
import re
import yaml
import json
from pathlib import Path
from typing import Dict, Any, Optional
from string import Template
import logging

logger = logging.getLogger(__name__)

class PromptService:
    """Service for managing and rendering prompt templates"""
    
    def __init__(self, prompts_dir: str = "prompts"):
        self.prompts_dir = Path(prompts_dir)
        self.system_config = self._load_system_config()
        self._template_cache = {}
        
    def _load_system_config(self) -> Dict[str, Any]:
        """Load system-level prompt configuration"""
        system_file = self.prompts_dir / "system.fin.yaml"
        
        if not system_file.exists():
            logger.warning(f"System config not found at {system_file}")
            return self._get_default_system_config()
            
        try:
            with open(system_file, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load system config: {e}")
            return self._get_default_system_config()
    
    def _get_default_system_config(self) -> Dict[str, Any]:
        """Fallback system configuration"""
        return {
            "role": "Professional AI Financial Advisor",
            "principles": [
                "Be concise and professional",
                "Provide actionable insights",
                "Include relevant disclaimers"
            ],
            "risk_allocation_tiers": {
                "conservative": {"volatile_assets": "1-2%"},
                "moderate": {"volatile_assets": "3-5%"},
                "aggressive": {"volatile_assets": "5-10%"}
            }
        }
    
    def get_system_prompt(self) -> str:
        """Get the formatted system prompt"""
        config = self.system_config
        
        # Build system prompt from configuration
        prompt_parts = [
            f"You are a {config['role']}.",
            "\nCore Principles:"
        ]
        
        for principle in config.get('principles', []):
            prompt_parts.append(f"- {principle}")
            
        # Add risk allocation guidelines
        prompt_parts.append("\nRisk Allocation Guidelines:")
        for risk_level, details in config.get('risk_allocation_tiers', {}).items():
            prompt_parts.append(
                f"- {risk_level.capitalize()}: {details.get('volatile_assets', 'N/A')} volatile assets"
                f" - Focus: {details.get('focus', 'balanced approach')}"
            )
            
        # Add compliance section
        prompt_parts.append("\nAlways end responses with appropriate disclaimers.")
        prompt_parts.append("Think step-by-step but only show the final answer.")
        
        return "\n".join(prompt_parts)
    
    def load_task_template(self, template_name: str) -> str:
        """Load a task-specific template"""
        # Check cache first
        if template_name in self._template_cache:
            return self._template_cache[template_name]
            
        template_path = self.prompts_dir / "tasks" / template_name
        
        if not template_path.exists():
            # Try with .md extension if not provided
            if not template_name.endswith('.md'):
                template_path = self.prompts_dir / "tasks" / f"{template_name}.md"
                
        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_name}")
            
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template_content = f.read()
                self._template_cache[template_name] = template_content
                return template_content
        except Exception as e:
            logger.error(f"Failed to load template {template_name}: {e}")
            raise
    
    def render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """Render a template with the given context"""
        template_content = self.load_task_template(template_name)
        
        # Simple template rendering using regex
        # Supports {{variable}} syntax
        def replace_variable(match):
            var_path = match.group(1).strip()
            
            # Handle nested variables like event.title
            parts = var_path.split('.')
            value = context
            
            for part in parts:
                if isinstance(value, dict) and part in value:
                    value = value[part]
                else:
                    # Variable not found, keep placeholder
                    return match.group(0)
                    
            # Convert to string
            if isinstance(value, (dict, list)):
                return json.dumps(value, ensure_ascii=False)
            return str(value)
        
        # Replace all {{variable}} patterns
        rendered = re.sub(r'\{\{([^}]+)\}\}', replace_variable, template_content)
        
        return rendered
    
    def build_prompt(self, template_name: str, **kwargs) -> str:
        """Convenience method to render a template with keyword arguments"""
        return self.render_template(template_name, kwargs)
    
    def get_risk_profile_context(self, risk_profile: str) -> Dict[str, Any]:
        """Get context data for a specific risk profile"""
        tiers = self.system_config.get('risk_allocation_tiers', {})
        profile_data = tiers.get(risk_profile.lower(), tiers.get('moderate', {}))
        
        return {
            'user_risk_profile': risk_profile,
            'volatile_asset_allocation': profile_data.get('volatile_assets', '3-5%'),
            'risk_focus': profile_data.get('focus', 'balanced approach')
        }
    
    def get_hsbc_product(self, category: str = None) -> str:
        """Get a relevant HSBC product recommendation"""
        products = self.system_config.get('hsbc_products', {})
        
        if category and category in products:
            product_list = products[category]
        else:
            # Get a product from any category
            all_products = []
            for cat_products in products.values():
                if isinstance(cat_products, list):
                    all_products.extend(cat_products)
            product_list = all_products
            
        if product_list:
            # In production, this could be more intelligent
            # For now, return the first product
            return product_list[0]
        
        return "HSBC Wealth Management Services"
    
    def get_compliance_disclaimer(self, context_type: str = "default") -> str:
        """Get appropriate compliance disclaimer"""
        disclaimers = self.system_config.get('compliance_disclaimers', {})
        return disclaimers.get(context_type, disclaimers.get('default', 
            'This is general information only. Please consult a financial advisor.'))
    
    def validate_json_response(self, response: str, expected_schema: Dict[str, Any] = None) -> Dict[str, Any]:
        """Validate and parse JSON response from LLM"""
        try:
            # Try to extract JSON from the response
            # Look for JSON blocks in markdown
            json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Try to parse the entire response as JSON
                json_str = response
                
            parsed = json.loads(json_str)
            
            # Basic schema validation if provided
            if expected_schema:
                for key, expected_type in expected_schema.items():
                    if key not in parsed:
                        raise ValueError(f"Missing required field: {key}")
                    # Type checking could be added here
                    
            return parsed
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.debug(f"Response was: {response}")
            raise ValueError(f"Invalid JSON response: {str(e)}")
        except Exception as e:
            logger.error(f"Validation error: {e}")
            raise

# Global instance
prompt_service = PromptService() 