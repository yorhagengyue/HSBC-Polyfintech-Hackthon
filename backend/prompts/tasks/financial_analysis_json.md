# Financial Analysis JSON Task

## Context
- User Query: {{query}}
- Risk Profile: {{risk_profile}}
- Session Context: {{session_context}}
- HSBC Product: {{hsbc_product}}

## Required Analysis

Analyze the query and provide a structured financial response.

Return ONLY valid JSON in this exact format:
```json
{
  "insight": "Brief market insight in 1-2 sentences",
  "recommendations": [
    {
      "action": "Specific action to take",
      "reason": "Why this action is recommended",
      "timeline": "When to execute (e.g., immediately, within 7 days)"
    }
  ],
  "hsbc_product": {
    "name": "{{hsbc_product.name}}",
    "benefit": "{{hsbc_product.benefit}}",
    "relevance": "How this product helps with the current query"
  },
  "next_step": "One clear actionable next step",
  "risk_level": "{{risk_profile}}",
  "allocations": {
    "crypto": {{crypto_allocation}},
    "stocks": {{stock_allocation}},
    "bonds": {{bond_allocation}}
  },
  "sources": [
    "[source: {{data_source}}]"
  ]
}
```

Important:
- Keep insight under 50 words
- Provide 2-3 specific recommendations
- Allocations must match the user's risk profile
- Include data sources for all metrics 