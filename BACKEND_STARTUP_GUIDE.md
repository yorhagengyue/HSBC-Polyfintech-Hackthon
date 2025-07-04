# Backend Startup Guide

## 🚀 Quick Start

The module import issue has been **FIXED**! The backend server should now start properly.

### Method 1: Windows Batch File (Recommended)
```bash
cd backend
start_server.bat
```

### Method 2: Python Script
```bash
cd backend
python start_server_fixed.py
```

### Method 3: Direct Main File
```bash
cd backend
python app/main.py
```

### Method 4: Uvicorn with Module Path
```bash
cd backend
set PYTHONPATH=%CD%
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 🔧 What Was Fixed

### Original Problem
- `ModuleNotFoundError: No module named 'app'`
- Python couldn't find the app package when running from the backend directory

### Solutions Applied

1. **Updated `app/main.py`** - Added automatic Python path detection:
```python
# Add the backend directory to Python path if not already there
backend_dir = Path(__file__).parent.parent.absolute()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
```

2. **Created `start_server_fixed.py`** - Handles path setup automatically
3. **Updated `start_server.bat`** - Sets PYTHONPATH correctly for Windows
4. **Created `start_server_fixed.bat`** - Alternative Windows batch file

## 🧪 Testing the Server

### Automatic Test
```bash
cd backend
python test_server.py
```

### Manual Test
1. Open browser to: http://localhost:8000
2. Check API docs: http://localhost:8000/docs
3. Test health endpoint: http://localhost:8000/api/v1/health

## 🔍 Expected Output

When the server starts successfully, you should see:
```
🔧 Starting from directory: C:\path\to\backend
🐍 Python path includes: C:\path\to\backend
🚀 Financial Alarm Clock API starting up...
🔄 Initializing database...
🏦 HSBC API client configured
📋 Client ID: xM3vskttJUtUE5MxJmwZyTc2AZG8I7y4
🔑 KID: 1f4cb99f-cb5b-47d7-a352-fad3eefbc9a5
🏢 Organization: temasek_po_11529
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## ⚠️ Troubleshooting

### If you still get module errors:
1. **Check Python version**: `python --version` (should be 3.8+)
2. **Install dependencies**: `pip install -r requirements.txt`
3. **Check virtual environment**: Make sure you're in the right venv
4. **Clear Python cache**: Delete `__pycache__` folders

### If port 8000 is busy:
1. **Check what's using port 8000**: `netstat -an | findstr :8000`
2. **Kill the process**: `taskkill /F /PID <process_id>`
3. **Or use a different port**: Edit the port number in the startup scripts

### Database Issues:
1. **SQLite** (default): Should work automatically
2. **MySQL**: Check `MYSQL_SETUP.md` for configuration
3. **Connection errors**: Check your database settings in `app/core/config.py`

## 📊 Server Status

Once running, the server provides:
- ✅ Stock market data (Yahoo Finance)
- ✅ Banking integration (HSBC API)
- ✅ Real-time WebSocket connections
- ✅ News aggregation
- ✅ AI-powered alerts
- ✅ User preferences management

## 🌐 Frontend Connection

The backend is configured to accept connections from:
- http://localhost:5173 (Vite dev server)
- http://localhost:3000 (React dev server)
- http://127.0.0.1:5173

Make sure your frontend is running on one of these ports.

## 🔗 Useful Endpoints

| Endpoint | Description |
|----------|-------------|
| `/` | Server info and HSBC status |
| `/docs` | Interactive API documentation |
| `/api/v1/health` | Health check |
| `/api/v1/stocks/popular` | Popular stocks |
| `/api/v1/banking/accounts` | Banking accounts |
| `/api/v1/news` | Market news |

## 📝 Logs

Check the console output for:
- Database connection status
- API endpoint registrations
- Error messages
- HSBC client configuration

The server now includes enhanced logging for better debugging. 