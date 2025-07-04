@echo off
echo 🚀 Starting Financial Alarm Clock API...
echo 📁 Setting up Python path...

cd /d "%~dp0"
set PYTHONPATH=%CD%;%PYTHONPATH%

echo 🔧 Current directory: %CD%
echo 🐍 Python path: %PYTHONPATH%

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause 