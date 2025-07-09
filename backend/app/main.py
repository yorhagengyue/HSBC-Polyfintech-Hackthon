import os
import sys
from pathlib import Path

# Add the backend directory to Python path if not already there
backend_dir = Path(__file__).parent.parent.absolute()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import asyncio
import json
from typing import List
from datetime import datetime

from app.api import health, monitoring, stocks, advanced_stocks, news, preferences, watchlist, banking, ai_chat, crypto, ai_template, cost_monitoring
from app.core.config import settings
from app.core.database import close_db
from app.core.init_db import init_database

# Import session service
from app.services.session_service import session_service

# Initialize database
init_database()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Financial Alarm Clock API starting up...")
    print("🔄 Initializing database...")
    await init_database()
    print("🏦 HSBC API client configured")
    print(f"📋 Client ID: {settings.HSBC_CLIENT_ID}")
    print(f"🔑 KID: {settings.HSBC_KID}")
    print(f"🏢 Organization: {settings.HSBC_ORGANIZATION_ID}")
    yield
    # Shutdown
    print("👋 Financial Alarm Clock API shutting down...")
    await close_db()

app = FastAPI(
    title="Financial Alarm Clock API",
    description="AI-powered financial risk monitoring and alerting system with HSBC Banking integration",
    version="0.2.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1/health", tags=["health"])
app.include_router(monitoring.router, prefix="/api/v1/monitoring", tags=["monitoring"])
app.include_router(stocks.router, prefix="/api/v1/stocks", tags=["stocks"])
app.include_router(advanced_stocks.router, prefix="/api/v1/advanced", tags=["advanced"])
app.include_router(news.router, prefix="/api/v1/news", tags=["news"])
app.include_router(preferences.router, prefix="/api/v1/preferences", tags=["preferences"])
app.include_router(watchlist.router, prefix="/api/v1/watchlist", tags=["watchlist"])
app.include_router(banking.router, prefix="/api/v1/banking", tags=["banking"])
app.include_router(ai_chat.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(crypto.router, prefix="/api/v1/crypto", tags=["crypto"])
app.include_router(ai_template.router, prefix="/api/v1/ai/template", tags=["ai_template"])
app.include_router(cost_monitoring.router, prefix="/api/v1/cost", tags=["cost"])

# WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                # Connection might be closed
                pass

manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    # Initialize session service
    await session_service.connect()
    print("Session service initialized")
    
    # Initialize Yahoo Finance service with fallback
    from app.services.yahoo_finance import yahoo_finance_service
    yahoo_finance_service.initialize()
    print("Yahoo Finance service with fallback initialized")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    # Disconnect session service
    await session_service.disconnect()
    print("Session service disconnected")
    
    # Save Yahoo Finance cache
    from app.services.yahoo_finance import yahoo_finance_service
    yahoo_finance_service.cleanup()
    print("Yahoo Finance cache saved")

@app.get("/")
async def root():
    return {
        "message": "Welcome to Financial Alarm Clock API with HSBC Banking Integration",
        "version": "0.2.0",
        "features": [
            "Real-time stock monitoring",
            "AI-powered market analysis", 
            "Smart alerts and notifications",
            "HSBC Open Banking integration",
            "Banking data synchronization",
            "Transaction analysis"
        ],
        "docs": "/docs",
        "hsbc_integration": {
            "status": "configured",
            "client_id": settings.HSBC_CLIENT_ID,
            "organization": settings.HSBC_ORGANIZATION_ID,
            "sandbox_url": settings.HSBC_BASE_URL
        }
    }

@app.websocket("/api/v1/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "message": "WebSocket connection established",
            "timestamp": datetime.now().isoformat(),
            "features": ["stock_alerts", "banking_notifications", "ai_insights"]
        })
        
        while True:
            try:
                # Wait for messages with a timeout for heartbeat
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                
                # Handle ping/pong for keepalive
                if data == "ping":
                    await websocket.send_text("pong")
                else:
                    # Echo back or handle commands
                    await manager.send_personal_message(f"Echo: {data}", websocket)
            except asyncio.TimeoutError:
                # Send heartbeat
                try:
                    await websocket.send_json({
                        "type": "heartbeat",
                        "timestamp": datetime.now().isoformat()
                    })
                except:
                    break
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Test endpoint to send events
@app.post("/api/v1/test-event")
async def send_test_event(event_type: str = "price_drop", severity: str = "high"):
    """Send a test event to all connected WebSocket clients"""
    test_event = {
        "type": event_type,
        "severity": severity,
        "title": "AAPL dropped 5.2%" if event_type == "price_drop" else "Banking Alert",
        "message": "Apple stock fell below your threshold" if event_type == "price_drop" else "Large transaction detected",
        "timestamp": datetime.now().isoformat(),
        "details": {
            "symbol": "AAPL" if event_type == "price_drop" else None,
            "change_percent": -5.2 if event_type == "price_drop" else None,
            "current_price": 175.23 if event_type == "price_drop" else None,
            "account_id": "account_123" if event_type != "price_drop" else None,
            "transaction_amount": 5000.00 if event_type != "price_drop" else None
        },
        "impact": {
            "score": 75 if severity == "high" else 50 if severity == "medium" else 25
        }
    }
    
    await manager.broadcast(test_event)
    return {"message": "Test event sent", "event": test_event}

if __name__ == "__main__":
    # Ensure we're in the correct directory
    os.chdir(backend_dir)
    print(f"🔧 Starting from directory: {backend_dir}")
    print(f"🐍 Python path includes: {backend_dir}")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(backend_dir)]
    ) 