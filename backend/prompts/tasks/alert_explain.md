# Alert Explanation Task

## Alert Details
- **Title**: {{event.title}}
- **Time**: {{event.time}}
- **Severity**: {{event.severity}}
- **Symbol**: {{event.symbol}}
- **Message**: {{event.message}}

## User Context
- **Risk Profile**: {{user_risk_profile}}
- **Portfolio Exposure**: {{portfolio_exposure}}%

## Required Analysis

Provide a structured explanation following this format:

### What Happened
{{event_summary}} - Explain in simple terms what triggered this alert.

### Market Impact
• **Immediate**: How this affects the market/asset right now
• **Short-term** (1-7 days): Expected near-term implications
• **Long-term** (1+ month): Potential lasting effects

### Your Portfolio Impact
Given your {{portfolio_exposure}}% exposure to {{event.symbol}}:
- Potential loss/gain: {{impact_calculation}}
- Risk level change: {{risk_assessment}}

### Recommended Actions
Based on your {{user_risk_profile}} risk profile:
1. {{action_1}}
2. {{action_2}}
3. {{action_3}}

### HSBC Solution
{{hsbc_product}} can help you {{benefit}} during this market event.

*{{relevant_disclaimer}}*

Keep total response under 220 words. Be specific with numbers and timeframes. 