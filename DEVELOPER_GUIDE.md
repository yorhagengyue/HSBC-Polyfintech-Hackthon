# 🚨 Financial Alarm Clock - Developer Guide

## 📋 Project Overview

**Financial Alarm Clock** is an AI-powered financial risk monitoring and alerting system for the PolyFintech100 Hackathon 2025.

### 🎯 Core Features
1. **Real-time Market Monitoring** - Track stock prices and detect significant drops
2. **AI-powered Analysis** - Use local LLM to explain market events in plain language
3. **Smart Alerts** - Notify users when predefined thresholds are breached
4. **HSBC Product Recommendations** - Suggest relevant banking products for risk mitigation

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Frontend│────▶│  FastAPI Backend│────▶│  External APIs  │
│   (Vite + TS)  │     │    (Python)     │     │  - Yahoo Finance│
└─────────────────┘     └─────────────────┘     │  - News API     │
                               │                 │  - HSBC APIs    │
                               ▼                 └─────────────────┘
                        ┌─────────────────┐
                        │   Local LLM     │
                        │ (Ollama/Mistral)│
                        └─────────────────┘
```

## 🚀 Development Milestones

### ✅ Milestone 1: Project Setup (COMPLETED)
- [x] Project structure creation
- [x] Backend setup (FastAPI + Python 3.11)
- [x] Frontend setup (React + Vite + Tailwind)
- [x] HSBC API registration and certificates
- [x] Development environment configuration

### 📍 Milestone 2: Core Data Integration (CURRENT)
**Target: Week 1**

#### 2.1 Yahoo Finance Integration
- [ ] Create Yahoo Finance service module
- [ ] Implement real-time price fetching
- [ ] Set up price monitoring background task
- [ ] Create price history storage

#### 2.2 News API Integration
- [ ] Register for News API key
- [ ] Create news service module
- [ ] Implement keyword-based news filtering
- [ ] Set up news monitoring task

#### 2.3 Database Setup
- [ ] Design database schema
- [ ] Implement SQLAlchemy models
- [ ] Create database migrations
- [ ] Set up async database operations

### 🤖 Milestone 3: AI Integration
**Target: Week 1-2**

#### 3.1 Ollama Setup
- [ ] Install and configure Ollama locally
- [ ] Download and test Mistral-7B model
- [ ] Create LLM service wrapper
- [ ] Implement prompt templates

#### 3.2 AI Analysis Features
- [ ] Market event explanation
- [ ] Risk assessment generation
- [ ] Recommendation engine
- [ ] Context-aware responses

### 🔔 Milestone 4: Alert System
**Target: Week 2**

#### 4.1 Alert Engine
- [ ] Define alert rules and thresholds
- [ ] Create alert triggering logic
- [ ] Implement alert storage
- [ ] Add alert history tracking

#### 4.2 Real-time Notifications
- [ ] Set up WebSocket connections
- [ ] Implement push notification system
- [ ] Create email notification option
- [ ] Add notification preferences

### 🏦 Milestone 5: HSBC Integration
**Target: Week 2-3**

#### 5.1 API Authentication
- [ ] Implement JWT token generation
- [ ] Set up mTLS connection
- [ ] Create API client wrapper
- [ ] Handle token refresh

#### 5.2 Product Integration
- [ ] Fetch HSBC product catalog
- [ ] Create product matching logic
- [ ] Implement recommendation API
- [ ] Add product details display

### 🎨 Milestone 6: Frontend Development
**Target: Week 3**

#### 6.1 Core UI Components
- [ ] Dashboard layout
- [ ] Market monitoring widget
- [ ] Alert notification center
- [ ] Product recommendation cards

#### 6.2 User Features
- [ ] Watchlist management
- [ ] Alert configuration
- [ ] Historical data visualization
- [ ] Settings and preferences

### 🧪 Milestone 7: Testing & Optimization
**Target: Week 3-4**

#### 7.1 Testing
- [ ] Unit tests for services
- [ ] Integration tests for APIs
- [ ] End-to-end testing
- [ ] Performance testing

#### 7.2 Optimization
- [ ] Query optimization
- [ ] Caching implementation
- [ ] Error handling improvements
- [ ] Security hardening

### 🚢 Milestone 8: Deployment & Demo
**Target: Week 4**

#### 8.1 Deployment
- [ ] Docker containerization
- [ ] Environment configuration
- [ ] CI/CD pipeline setup
- [ ] Production deployment

#### 8.2 Demo Preparation
- [ ] Demo scenario planning
- [ ] Sample data preparation
- [ ] Presentation materials
- [ ] Video recording

## 📁 Project Structure

```
financial-alarm-clock/
├── backend/
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── tests/              # Backend tests
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Frontend utilities
│   └── tests/              # Frontend tests
└── docs/                   # Documentation
```

## 🛠️ Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/yahoo-finance-integration

# Develop and test locally
# Write tests
# Update documentation

# Commit and push
git add .
git commit -m "feat: add Yahoo Finance integration"
git push origin feature/yahoo-finance-integration
```

### 2. API Development Pattern
```python
# 1. Create service in services/
# 2. Create API endpoint in api/
# 3. Add to main router
# 4. Write tests
# 5. Update API documentation
```

### 3. Frontend Development Pattern
```typescript
// 1. Create component in components/
// 2. Create service in services/
// 3. Add to page
// 4. Style with Tailwind
// 5. Test functionality
```

## 🔧 Key Technologies

### Backend
- **FastAPI**: Modern web framework
- **SQLAlchemy**: ORM for database
- **Pydantic**: Data validation
- **yfinance**: Yahoo Finance data
- **httpx**: Async HTTP client
- **LangChain**: LLM orchestration

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Axios**: HTTP client
- **React Query**: Data fetching
- **Chart.js**: Data visualization

### Infrastructure
- **Docker**: Containerization
- **PostgreSQL**: Production database
- **Redis**: Caching and queues
- **Nginx**: Reverse proxy

## 📝 Coding Standards

### Python (Backend)
- Follow PEP 8
- Use type hints
- Write docstrings
- Keep functions small
- Handle errors gracefully

### TypeScript (Frontend)
- Use strict mode
- Define interfaces
- Avoid `any` type
- Use functional components
- Implement error boundaries

### Git Commits
- Use conventional commits
- Keep commits atomic
- Write clear messages
- Reference issues

## 🎯 Success Criteria

1. **Performance**: Response time < 200ms
2. **Reliability**: 99.9% uptime
3. **Accuracy**: Real-time data with < 1min delay
4. **Usability**: Intuitive UI/UX
5. **Security**: Secure API authentication

## 🚦 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker Desktop
- Git

### Quick Start
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\Activate.ps1  # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Setup
1. Copy `backend/example.env` to `backend/.env`
2. Add your API keys
3. Configure database URL
4. Set up HSBC certificates

## 🤝 Contributing

1. Check the current milestone
2. Pick an unassigned task
3. Create a feature branch
4. Implement with tests
5. Submit pull request

## 📞 Support

- **Technical Issues**: Create GitHub issue
- **API Questions**: Check API documentation
- **Architecture**: Refer to design docs

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: In Active Development 