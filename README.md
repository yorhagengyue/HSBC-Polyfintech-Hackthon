# 🚨 Financial Alarm Clock

> AI-powered financial risk monitoring and alerting system for smarter investment decisions

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)](https://reactjs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776ab.svg)](https://www.python.org)

## 🏆 PolyFintech100 Hackathon 2025 Project

**Team**: Financial Alarm Clock Team  
**Event**: Intelligent Banking by HSBC (Temasek Polytechnic)  
**Status**: In Active Development

## 🎯 What is Financial Alarm Clock?

Financial Alarm Clock is an intelligent system that monitors financial markets 24/7 and alerts you when significant events occur. Using AI to analyze market movements and news, it provides plain-language explanations and recommends relevant HSBC banking products to help manage financial risks.

### Key Features

- 📈 **Real-time Market Monitoring** - Track stock prices with Yahoo Finance
- 🤖 **AI-Powered Analysis** - Local LLM (Mistral-7B) explains market events
- 🔔 **Smart Alerts** - Get notified when prices drop or volatility spikes
- 🏦 **HSBC Integration** - Personalized banking product recommendations
- 📰 **News Monitoring** - Track financial news that affects your portfolio

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-team/financial-alarm-clock.git
cd financial-alarm-clock

# Start the backend
cd backend
python -m venv venv
venv\Scripts\Activate.ps1  # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

# Start the frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📚 Documentation

- [Developer Guide](./DEVELOPER_GUIDE.md) - Detailed development milestones and technical documentation
- [HSBC API Integration Guide](./docs/HSBC-API-Integration-Guide.md) - HSBC API setup and configuration
- [API Documentation](http://localhost:8000/docs) - Interactive API docs (when running)

## 🏗️ Architecture Overview

```
Frontend (React) → Backend (FastAPI) → External APIs
                           ↓
                      Local LLM (Ollama)
```

## 🛠️ Tech Stack

- **Backend**: FastAPI, Python 3.11, SQLAlchemy, Pydantic
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **AI/ML**: Ollama, Mistral-7B, LangChain
- **APIs**: Yahoo Finance, News API, HSBC Open Banking
- **Database**: SQLite (dev), PostgreSQL (prod)

## 📈 Current Progress

- ✅ **Milestone 1**: Project Setup (COMPLETED)
- 🔄 **Milestone 2**: Core Data Integration (IN PROGRESS)
- ⏳ **Milestone 3**: AI Integration
- ⏳ **Milestone 4**: Alert System
- ⏳ **Milestone 5**: HSBC Integration
- ⏳ **Milestone 6**: Frontend Development
- ⏳ **Milestone 7**: Testing & Optimization
- ⏳ **Milestone 8**: Deployment & Demo

## 🤝 Contributing

Please read our [Developer Guide](./DEVELOPER_GUIDE.md) for details on our development process and coding standards.

## 📞 Contact

For questions about this project, please refer to:
- Technical documentation in `/docs`
- API documentation at `/docs` endpoint
- HSBC Developer Portal for API-specific queries

## 📄 License

This project is developed for the PolyFintech100 Hackathon 2025.

---

**Made with ❤️ for the PolyFintech100 Hackathon 2025** 