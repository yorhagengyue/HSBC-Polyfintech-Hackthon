@echo off
echo ==========================================
echo  🚨 Financial Alarm Clock 
echo  PolyFintech100 Hackathon 2025
echo ==========================================
echo.

echo 🎯 Choose startup mode:
echo   [1] Start backend server (recommended first)
echo   [2] Start frontend interface
echo   [3] Start full application (backend + frontend)
echo   [0] Exit
echo.

set /p choice="Please choose (0-3): "

if "%choice%"=="1" goto START_BACKEND
if "%choice%"=="2" goto START_FRONTEND  
if "%choice%"=="3" goto START_BOTH
if "%choice%"=="0" goto END
goto CHOICE

:START_BACKEND
echo.
echo 🚀 Starting backend server...
echo ==========================================
cd backend
call start.bat
goto END

:START_FRONTEND
echo.
echo 🎨 Starting frontend interface...
echo ==========================================
cd frontend
echo 📋 Make sure backend server is running (run: npm run dev)
npm run dev
goto END

:START_BOTH
echo.
echo 🚀 Starting full application...
echo ==========================================
echo Starting backend server...
start /min cmd /c "cd backend && start.bat"
echo Waiting for backend startup...
timeout /t 3 /nobreak >nul
echo Starting frontend interface...
cd frontend
npm run dev
goto END

:END
echo.
echo 👋 Financial Alarm Clock started!
echo 📍 Backend: http://localhost:8000
echo 📍 Frontend: http://localhost:5173
echo 📍 API Docs: http://localhost:8000/docs
pause 