@echo off
echo ======================================
echo Financial Alarm Clock - AI Enhanced
echo ======================================
echo.

REM Set your Gemini API key here
set GEMINI_API_KEY=YOUR_API_KEY_HERE

REM Check if API key is set
if "%GEMINI_API_KEY%"=="YOUR_API_KEY_HERE" (
    echo ERROR: Please edit this file and set your actual GEMINI_API_KEY
    echo.
    echo 1. Get your API key from: https://aistudio.google.com/app/apikey
    echo 2. Edit this file and replace YOUR_API_KEY_HERE with your actual key
    echo 3. Save and run again
    echo.
    pause
    exit /b 1
)

echo Starting server with Gemini AI enabled...
echo API Key: %GEMINI_API_KEY:~0,20%...
echo.

REM Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

REM Start the server
python start_server_fixed.py

pause 