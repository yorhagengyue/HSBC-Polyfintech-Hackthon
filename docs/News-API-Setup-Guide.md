# News API Setup Guide

## Overview
The Financial Alarm Clock includes a comprehensive news monitoring system that tracks market news and company-specific updates. This guide will help you set up and use the News API integration.

## Features
- 📰 Real-time market news monitoring
- 🔍 Smart search with relevance scoring
- 🏷️ Company-specific keyword tracking
- ⚡ 15-minute caching for performance
- 🎯 High-impact news detection

## Setup Instructions

### 1. Get a News API Key
1. Visit [newsapi.org](https://newsapi.org/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Free tier includes 100 requests/day

### 2. Configure the API Key
Add your API key to the `.env` file:
```bash
NEWS_API_KEY=your_actual_api_key_here
```

### 3. Install Dependencies
The required package is already in requirements.txt:
```bash
cd backend
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

## API Endpoints

### Get Market News
```bash
GET /api/v1/news/market?category=business
```

### Search News
```bash
GET /api/v1/news/search?query=Apple&page_size=20
```

### Get Symbol News
```bash
GET /api/v1/news/symbol/AAPL
```

### Monitor Symbol
```bash
POST /api/v1/news/monitor/AAPL
Body: {
  "keywords": ["Apple", "iPhone", "Tim Cook"]  # Optional
}
```

### Get News Alerts
```bash
GET /api/v1/news/alerts
```

## Frontend Integration

The `MarketNews` component is already integrated into the Dashboard and provides:
- Automatic news refresh every 5 minutes
- Search functionality
- Article preview with modal details
- Symbol tags and relevance indicators
- Graceful fallback to mock data

## Mock Data Mode

When no API key is configured, the system automatically uses mock data:
- Realistic sample articles
- No interruption to development
- Same UI/UX experience

## Company Keyword Mapping

The system automatically maps companies to relevant keywords:
```python
"AAPL": ["Apple", "iPhone", "Tim Cook", "iOS"]
"TSLA": ["Tesla", "Elon Musk", "EV", "electric vehicle"]
"MSFT": ["Microsoft", "Windows", "Azure", "Satya Nadella"]
# ... and more
```

## Relevance Scoring

Articles are scored (0-1) based on:
- Title keyword matches (50% weight)
- Description matches (30% weight)
- Related keywords (10% weight)
- Recency boost (10% weight for <1hr old)

## Testing

Run the test scripts to verify functionality:
```bash
# Test the service
python test_news_api.py

# Test the endpoints
python test_news_endpoint.py
```

## Troubleshooting

### "No module named 'newsapi'" Error
Make sure you're in the virtual environment:
```bash
cd backend
venv\Scripts\activate
pip install newsapi-python==0.2.7
```

### No Articles Returned
1. Check if NEWS_API_KEY is configured
2. Verify API key is valid
3. Check API rate limits (100/day for free tier)

### Connection Errors
1. Ensure backend server is running
2. Check CORS settings if accessing from frontend
3. Verify port 8000 is not blocked

## Best Practices

1. **Cache Usage**: The 15-minute cache reduces API calls
2. **Keyword Selection**: Use specific keywords for better results
3. **Rate Limiting**: Monitor your API usage to stay within limits
4. **Error Handling**: The system gracefully falls back to mock data

## Future Enhancements

- Sentiment analysis integration
- Multi-language support
- RSS feed integration
- Custom news sources
- Advanced filtering options 