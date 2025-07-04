# API Configuration Guide - Real Data Sources

This guide explains how to configure real API data sources to replace mock/simulated data in the Financial Alarm Clock application.

## 🎯 Overview

The application uses several external APIs to fetch real financial data:

1. **Yahoo Finance (Free)** - Stock prices, historical data, market indices
2. **Yahoo Finance RapidAPI (Premium)** - Enhanced features, insider trades, options
3. **News API** - Market news and financial articles
4. **HSBC API** - Banking data integration

## 📊 Already Implemented (Using Real Data)

### ✅ Yahoo Finance (Free) - `yfinance` Library
**Status**: Fully implemented and working
**Data Sources**:
- Stock prices and quotes
- Historical price data
- Market indices (S&P 500, Dow Jones, NASDAQ)
- Stock search functionality
- Real-time price monitoring

**Configuration**: No API key required
```python
# Already working in:
# - backend/app/services/yahoo_finance.py
# - backend/app/api/stocks.py
```

### ✅ HSBC Banking API
**Status**: Implemented with proper error handling
**Data Sources**:
- Account information
- Account balances
- Transaction history
- Banking summaries

**Configuration**: 
```bash
# In backend/.env
HSBC_CLIENT_ID=xM3vskttJUtUE5MxJmwZyTc2AZG8I7y4
HSBC_KID=1f4cb99f-cb5b-47d7-a352-fad3eefbc9a5
HSBC_ORG_ID=temasek_po_11529
HSBC_API_BASE_URL=https://api.hsbc.com.sg/psd2/v1
```

## 🔧 Enhanced Real Data Sources

### 1. Yahoo Finance RapidAPI (Premium Features)

**Status**: Implemented but requires API key
**Features**:
- ✅ Insider trading data (real API calls)
- ✅ Enhanced market summaries
- ✅ Trending stocks analysis
- ✅ Advanced stock statistics

**Setup**:
1. Get API key from [RapidAPI Yahoo Finance](https://rapidapi.com/apidojo/api/yahoo-finance1/)
2. Update configuration:

```bash
# In backend/.env
YAHOO_FINANCE_RAPID_API_KEY=your_rapidapi_key_here
```

**Current Status**: Using demo key, replace with your own:
```python
# In backend/app/services/yahoo_finance_rapid.py
# Replace this demo key:
api_key = "487d9be446msh808a69223d373cbp12cf58jsn24e062ece0ce"
```

### 2. News API (Real Market News)

**Status**: Implemented but requires API key
**Features**:
- ✅ Real market news from multiple sources
- ✅ Symbol-specific news search
- ✅ News sentiment analysis
- ✅ Real-time news alerts

**Setup**:
1. Get free API key from [News API](https://newsapi.org/)
2. Update configuration:

```bash
# In backend/.env
NEWS_API_KEY=your_news_api_key_here
```

**Implementation**: Fully functional in `backend/app/services/news_monitor.py`

## 🚫 Removed Mock Data

### Components Updated to Use Real Data:

1. **Market News Component** (`frontend/src/components/MarketNews.jsx`)
   - ❌ Removed: Hardcoded mock news articles
   - ✅ Added: Real News API integration with error handling

2. **Mini Chart Component** (`frontend/src/components/MiniChart.jsx`)
   - ❌ Removed: Simulated OHLC data generation
   - ✅ Added: Real Yahoo Finance historical data

3. **Advanced Stocks API** (`backend/app/api/advanced_stocks.py`)
   - ❌ Removed: Hardcoded insider trading data
   - ✅ Added: Real RapidAPI Yahoo Finance calls
   - ❌ Removed: Static trending stocks
   - ✅ Added: Dynamic trending calculation from real quotes

## 🛠️ Complete Setup Instructions

### 1. Backend Configuration

Create or update `backend/.env`:

```bash
# Database
DATABASE_URL=mysql+aiomysql://root:password@localhost:3306/hsbc

# HSBC API (Already configured)
HSBC_CLIENT_ID=xM3vskttJUtUE5MxJmwZyTc2AZG8I7y4
HSBC_KID=1f4cb99f-cb5b-47d7-a352-fad3eefbc9a5
HSBC_ORG_ID=temasek_po_11529
HSBC_API_BASE_URL=https://api.hsbc.com.sg/psd2/v1

# Yahoo Finance RapidAPI (Get your own key)
YAHOO_FINANCE_RAPID_API_KEY=your_rapidapi_key_here

# News API (Get your own key)
NEWS_API_KEY=your_news_api_key_here

# Environment
ENVIRONMENT=development
```

### 2. API Key Setup

#### News API:
1. Visit [newsapi.org](https://newsapi.org/)
2. Sign up for free account
3. Get API key from dashboard
4. Add to `.env` file

#### RapidAPI:
1. Visit [RapidAPI Yahoo Finance](https://rapidapi.com/apidojo/api/yahoo-finance1/)
2. Subscribe to plan (free tier available)
3. Get API key from dashboard
4. Add to `.env` file

### 3. Restart Services

```bash
cd backend
python -m uvicorn app.main:app --reload

cd ../frontend
npm run dev
```

## 📈 Data Flow Architecture

```mermaid
graph TB
    A[Frontend Components] --> B[API Layer]
    B --> C[Yahoo Finance Free]
    B --> D[Yahoo Finance RapidAPI]
    B --> E[News API]
    B --> F[HSBC API]
    
    C --> G[Stock Prices & History]
    D --> H[Insider Trades & Trending]
    E --> I[Market News]
    F --> J[Banking Data]
    
    K[Fallback System] --> L[Cached Data]
    K --> M[Error Messages]
```

## 🚨 Error Handling Strategy

1. **Primary**: Use real API data
2. **Fallback**: Use cached data if available
3. **Final**: Show error messages with configuration instructions
4. **No Mock Data**: Removed all hardcoded mock responses

## ✅ Testing Real Data

### 1. Check API Connectivity
```bash
cd backend
python test_news_api.py
```

### 2. Verify Configuration
```bash
# Check if APIs are working
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/banking/health
```

### 3. Monitor Logs
```bash
# Watch for API errors
tail -f backend/logs/app.log
```

## 🔍 Troubleshooting

### Common Issues:

1. **News not loading**: Check NEWS_API_KEY in `.env`
2. **Insider trades empty**: Verify YAHOO_FINANCE_RAPID_API_KEY
3. **Charts not working**: Check internet connection for Yahoo Finance
4. **Banking errors**: Verify HSBC certificate configuration

### Debug Mode:
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
```

## 📊 Real vs Mock Data Status

| Component | Status | Data Source |
|-----------|--------|-------------|
| Stock Prices | ✅ Real | Yahoo Finance Free |
| Stock History | ✅ Real | Yahoo Finance Free |
| Market Indices | ✅ Real | Yahoo Finance Free |
| Market News | ✅ Real* | News API (requires key) |
| Insider Trades | ✅ Real* | RapidAPI (requires key) |
| Trending Stocks | ✅ Real* | RapidAPI (requires key) |
| Banking Data | ✅ Real | HSBC API |
| Chart Data | ✅ Real | Yahoo Finance Free |

*Requires API key configuration

## 🎯 Next Steps

1. **Get API Keys**: Set up News API and RapidAPI accounts
2. **Configure Environment**: Update `.env` with real keys
3. **Test Integration**: Verify all data sources work
4. **Monitor Usage**: Track API quotas and limits
5. **Production Deploy**: Use production API keys for deployment

## 📚 Additional Resources

- [Yahoo Finance API Documentation](https://rapidapi.com/apidojo/api/yahoo-finance1/)
- [News API Documentation](https://newsapi.org/docs)
- [HSBC Developer Portal](https://developer.hsbc.com/)
- [yfinance Library Docs](https://pypi.org/project/yfinance/) 