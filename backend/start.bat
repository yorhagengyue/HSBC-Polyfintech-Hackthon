@echo off
echo ==========================================
echo  Financial Alarm Clock - Start Server
echo ==========================================
echo.

echo 🏦 HSBC Banking API: Mock mode (includes complete test data)
echo 📊 Stock monitoring: Yahoo Finance real-time data
echo 🤖 AI analysis: Google Gemini intelligent analysis
echo.

echo 🚀 Starting server...
echo.
echo 📍 Backend API: http://localhost:8000
echo 📍 API Docs: http://localhost:8000/docs  
echo 📍 Banking API: http://localhost:8000/api/v1/banking/health
echo.

REM Start FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 