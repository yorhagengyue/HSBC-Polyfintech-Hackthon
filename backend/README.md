# Financial Alarm Clock - Backend Service

## 🚀 Quick Start

```cmd
# 1. Enter backend directory
cd backend

# 2. Start server
start.bat
```

## 📋 Feature Status

- ✅ **HSBC Banking API**: Mock mode (3 test accounts)
- ✅ **Stock Monitoring**: Yahoo Finance real-time data  
- ✅ **AI Analysis**: Google Gemini intelligent analysis
- ✅ **Alert System**: WebSocket real-time push
- ✅ **Database**: SQLite local storage

## 🔗 Important Links

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/v1/banking/health
- **WebSocket**: ws://localhost:8000/api/v1/ws

## 🏦 Mock Banking Data

Mock mode includes 3 test accounts:
- SGD Current Account: $15,750.50
- SGD Savings Account: $28,500.00  
- USD Business Account: $12,750.75

## ⚙️ Environment Configuration

Configuration file: `example.env` → Copy to `.env`
- HSBC_MOCK_MODE=true (enabled by default)
- GEMINI_API_KEY=configured
- Other settings optimized 