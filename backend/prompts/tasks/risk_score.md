# Risk Score Assessment Task

You are given the following portfolio information:
```json
{{portfolio_json}}
```

User's risk profile: {{user_risk_profile}}

Calculate a comprehensive risk score and provide analysis.

Return ONLY valid JSON in this exact format:
```json
{
  "risk_score": <number between 0-100>,
  "risk_label": "<Low|Medium|High>",
  "volatility_exposure": <percentage>,
  "diversification_score": <number between 0-10>,
  "key_risks": [
    "<risk 1>",
    "<risk 2>",
    "<risk 3>"
  ],
  "mitigation_strategy": "<specific advice in 30 words>",
  "hsbc_product_recommendation": "<specific HSBC product that helps manage this risk>"
}
```

Scoring Guidelines:
- 0-30: Low Risk (well-diversified, stable assets)
- 31-70: Medium Risk (moderate volatility, some concentration)
- 71-100: High Risk (high volatility, concentrated positions)

Consider:
- Asset allocation vs user's risk profile
- Market concentration
- Currency exposure
- Liquidity constraints 