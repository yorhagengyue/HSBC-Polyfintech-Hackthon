@echo off
echo 🚀 Starting Financial Alarm Clock API...
echo 📁 Setting up environment...

REM Change to the backend directory
cd /d "%~dp0"

REM Set Python path to include current directory
set PYTHONPATH=%CD%;%PYTHONPATH%

echo 🔧 Current directory: %CD%
echo 🐍 Python path configured
echo.

REM Start the server directly with main.py
echo 📡 Starting FastAPI server on http://localhost:8000
python app/main.py

pause 