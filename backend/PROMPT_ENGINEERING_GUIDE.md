# Prompt Engineering Guide

## Overview

This guide documents the prompt engineering system implemented for the Financial Alarm Clock AI system. The system provides consistent, reliable, and professionally formatted AI responses through template-based prompt management.

## Architecture

### 1. System Configuration (`prompts/system.fin.yaml`)
Central configuration file defining:
- AI role and behavior
- Core principles
- Risk allocation tiers
- Output formats
- Compliance disclaimers
- HSBC product catalog
- Response constraints

### 2. Task Templates (`prompts/tasks/*.md`)
Specific templates for different AI tasks:
- `risk_score.md` - Portfolio risk assessment
- `alert_explain.md` - Alert explanation
- `market_analysis.md` - Market analysis
- `portfolio_recommendation.md` - Portfolio recommendations

### 3. Prompt Service (`app/services/prompt_service.py`)
Core service managing:
- Template loading and caching
- Variable substitution
- JSON response validation
- Risk profile context
- HSBC product selection
- Compliance disclaimer management

### 4. Enhanced Gemini Provider
Integration with prompt service for:
- System prompt loading
- Template-based generation
- JSON response mode
- Strict/creative mode switching
- Automatic retries for JSON

## Usage

### Basic Template Usage

```python
from app.services.prompt_service import prompt_service

# Load and render a template
prompt = prompt_service.build_prompt("risk_score", 
    portfolio_json={"AAPL": 50000, "GOOGL": 30000},
    user_risk_profile="moderate"
)
```

### API Endpoints

#### 1. Template Analysis
```bash
POST /api/v1/ai/template/analyze
{
    "template_name": "risk_score",
    "context": {
        "portfolio_json": {...},
        "user_risk_profile": "moderate"
    }
}
```

#### 2. Risk Score Calculation
```bash
POST /api/v1/ai/template/risk-score
{
    "portfolio": {...},
    "user_risk_profile": "conservative"
}
```

#### 3. Alert Explanation
```bash
POST /api/v1/ai/template/explain-alert
{
    "alert": {
        "title": "AAPL dropped 5%",
        "severity": "high",
        ...
    },
    "user_risk_profile": "moderate",
    "portfolio_exposure": 15.5
}
```

#### 4. List Templates
```bash
GET /api/v1/ai/template/templates
```

#### 5. Get Template Info
```bash
GET /api/v1/ai/template/template/{template_name}
```

## Creating New Templates

### Template Structure
```markdown
# Task Name

## Input Context
{{variable1}}
{{variable2}}

## Required Analysis
Structured prompt with clear sections...

### Output Format
Define expected output structure...

*{{disclaimer}}*
```

### Variable Naming Convention
- Use descriptive names: `user_risk_profile`, not `risk`
- Use underscore for multi-word: `portfolio_value`
- Use dot notation for nested: `event.title`

### Example: New Template
```markdown
# Stock Analysis Task

## Stock Information
- Symbol: {{symbol}}
- Current Price: ${{current_price}}
- User Holdings: {{user_shares}} shares

## Analysis Required
Provide technical and fundamental analysis...

Return JSON:
{
    "recommendation": "buy|hold|sell",
    "confidence": 0-100,
    "reasons": ["reason1", "reason2"],
    "hsbc_solution": "specific product"
}
```

## Configuration Options

### Environment Variables
```env
# Prompt mode control
PROMPT_STRICT=true  # Stable, consistent responses
PROMPT_STRICT=false # Creative, varied responses
```

### Risk Profiles
- **Conservative**: 1-2% volatile assets
- **Moderate**: 3-5% volatile assets
- **Aggressive**: 5-10% volatile assets

### Temperature Settings
- **Strict Mode**: temperature=0.2, top_p=0.8
- **Creative Mode**: temperature=0.5, top_p=0.95

## Testing Templates

### 1. Test JSON Generation
```bash
POST /api/v1/ai/template/test-json
```

### 2. Get Current Configuration
```bash
GET /api/v1/ai/template/config
```

### 3. Test Specific Template
```python
# In Python
from app.services.gemini_provider import GeminiProvider

gemini = GeminiProvider()
result = await gemini.analyze_with_template("risk_score", {
    "portfolio_json": {...},
    "user_risk_profile": "moderate"
})
```

## Best Practices

### 1. Template Design
- Keep templates focused on single tasks
- Use clear section headers
- Define expected output format explicitly
- Include relevant disclaimers

### 2. Variable Usage
- Provide all required variables
- Use sensible defaults where appropriate
- Validate input data before rendering

### 3. JSON Responses
- Always specify exact schema in template
- Use "Return ONLY valid JSON" instruction
- Include example structure in prompt

### 4. Error Handling
- Template not found → 404 error
- Missing variables → Keep placeholders
- JSON parse error → Retry with clearer instruction

## Monitoring & Debugging

### Check Template Loading
```python
from app.services.prompt_service import prompt_service

# List cached templates
print(prompt_service._template_cache.keys())

# Check system config
print(prompt_service.system_config)
```

### Debug Variable Substitution
```python
# Test rendering with sample data
rendered = prompt_service.render_template("alert_explain", {
    "event": {"title": "Test Alert"},
    "user_risk_profile": "moderate"
})
print(rendered)
```

### Verify JSON Validation
```python
# Test JSON parsing
response = '{"risk_score": 75, "label": "High"}'
parsed = prompt_service.validate_json_response(response)
print(parsed)
```

## Extending the System

### 1. Add New Template Category
1. Create template file in `prompts/tasks/`
2. Add description in `_get_template_description()`
3. Create specific API endpoint if needed

### 2. Add New System Principle
1. Edit `prompts/system.fin.yaml`
2. Add to `principles` list
3. Restart service to reload

### 3. Add New HSBC Product
1. Edit `prompts/system.fin.yaml`
2. Add to appropriate category in `hsbc_products`
3. Products auto-available in recommendations

### 4. Custom Generation Config
```python
# In GeminiProvider
self.generation_config = {
    "temperature": 0.3,
    "top_p": 0.9,
    "max_output_tokens": 2000,
    "response_mime_type": "application/json"  # For JSON
}
```

## Performance Tips

1. **Template Caching**: Templates cached on first load
2. **Parallel Requests**: Use async for multiple analyses
3. **JSON Mode**: Faster than parsing text responses
4. **Batch Context**: Pass multiple items in single context

## Troubleshooting

### Issue: Inconsistent Responses
- Check `PROMPT_STRICT=true` in environment
- Verify system prompt loaded correctly
- Ensure risk profile context included

### Issue: JSON Parse Errors
- Check template specifies JSON format
- Use `test-json` endpoint to verify
- Enable retry logic in provider

### Issue: Missing HSBC Products
- Verify products defined in system.fin.yaml
- Check category mapping
- Ensure prompt service initialized

### Issue: Template Not Found
- Check file exists with .md extension
- Verify path `prompts/tasks/{name}.md`
- Clear template cache if needed

## Future Enhancements

1. **Multi-language Support**: Add language field to templates
2. **Template Versioning**: Track template changes
3. **A/B Testing**: Compare template effectiveness
4. **Analytics**: Track template usage and success
5. **Template Builder UI**: Visual template creation
6. **Dynamic Variables**: Compute variables at runtime

## Conclusion

This prompt engineering system ensures:
- ✅ Consistent AI responses
- ✅ Easy template management
- ✅ Professional output formatting
- ✅ Compliance with regulations
- ✅ Seamless HSBC integration
- ✅ Flexible configuration

For questions or improvements, refer to the codebase or contact the development team. 