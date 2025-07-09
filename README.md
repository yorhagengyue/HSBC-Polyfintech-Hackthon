# 🚨 Financial Alarm Clock

> AI-powered financial risk monitoring and alerting system for smarter investment decisions

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)](https://reactjs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776ab.svg)](https://www.python.org)

## 🏆 PolyFintech100 Hackathon 2025 Project

**Team**: Financial Alarm Clock Team  
**Event**: Intelligent Banking by HSBC (Temasek Polytechnic)  
**Status**: Production Ready ✅

## 🎯 What is Financial Alarm Clock?

Financial Alarm Clock is an intelligent system that monitors financial markets 24/7 and alerts you when significant events occur. Using AI to analyze market movements and news, it provides plain-language explanations and recommends relevant HSBC banking products to help manage financial risks.

### ✅ Core Features

- 🏦 **HSBC Banking Integration** - Complete mock banking system with real API structure
- 📈 **Real-time Market Monitoring** - Track stock prices with Yahoo Finance  
- 🤖 **AI-Powered Analysis** - Google Gemini explains market events
- 🔔 **Smart Alerts** - Get notified when prices drop or volatility spikes
- 📊 **Interactive Dashboard** - React-based modern UI with real-time updates

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend Setup
```cmd
cd backend
pip install -r requirements.txt
start.bat
```

### Frontend Setup
```cmd
cd frontend  
npm install
npm run dev
```

### 🔗 Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Banking API Status**: http://localhost:8000/api/v1/banking/health

## 🏗️ Architecture

```
Frontend (React) → Backend (FastAPI) → External APIs
                           ↓
                   Google Gemini AI
```

## 🛠️ Tech Stack

- **Backend**: FastAPI, Python 3.11, SQLAlchemy
- **Frontend**: React 18, Vite, Tailwind CSS  
- **AI**: Google Gemini 2.0 Flash
- **APIs**: Yahoo Finance, HSBC Banking (Mock)
- **Database**: SQLite

## ✅ Development Status

- ✅ **HSBC Banking Integration** - Mock API with complete functionality
- ✅ **Stock Market Monitoring** - Yahoo Finance real-time data
- ✅ **AI Analysis** - Google Gemini integration
- ✅ **Alert System** - WebSocket real-time notifications
- ✅ **Interactive Dashboard** - Modern React UI
- ✅ **Error Handling** - Production-ready reliability

## 🏦 Banking Features

The HSBC mock API provides:
- **3 Test Accounts**: SGD Current ($15,750.50), SGD Savings ($28,500.00), USD Business ($12,750.75)
- **Transaction History**: 10 sample transactions per account
- **Real-time Balance Updates**: Complete banking functionality simulation
- **API Compatibility**: Full HSBC Open Banking API format

## 📄 License

This project is developed for the PolyFintech100 Hackathon 2025.

---

**Made with ❤️ for the PolyFintech100 Hackathon 2025** 