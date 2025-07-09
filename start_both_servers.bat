@echo off
echo Starting Financial Alarm Clock Servers...
echo.

REM Start backend server
echo Starting Backend Server (Port 8000)...
start "Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start frontend server  
echo Starting Frontend Server (Port 5173)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Servers are starting up...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window (servers will continue running)
pause >nul 