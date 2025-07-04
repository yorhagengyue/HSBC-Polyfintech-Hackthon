# Fix GEMINI_API_KEY Not Loading Issue

## Quick Fix Steps

### 1. Check .env File Format
Make sure your `.env` file has the correct format:
```
GEMINI_API_KEY=AIzaSy...your-actual-key-here
```

**Important:**
- NO spaces around the `=` sign
- NO quotes around the API key
- The key should start with `AIza`
- Make sure there's no trailing whitespace

### 2. Test Your API Key
Edit `test_gemini_direct.py` and replace the placeholder:
```python
TEST_API_KEY = "YOUR_ACTUAL_API_KEY_HERE"  # Replace this!
```

Then run:
```bash
python test_gemini_direct.py
```

### 3. Force Set Environment Variable
If the .env file isn't loading, you can set it manually:

**Windows PowerShell:**
```powershell
$env:GEMINI_API_KEY="your-actual-api-key-here"
python start_server_fixed.py
```

**Windows CMD:**
```cmd
set GEMINI_API_KEY=your-actual-api-key-here
python start_server_fixed.py
```

### 4. Update Configuration
In `app/core/config.py`, temporarily hardcode your API key for testing:
```python
# Temporary fix - remove after testing!
GEMINI_API_KEY: Optional[str] = "your-actual-api-key-here"
```

### 5. Verify Environment Loading
Run the test script:
```bash
python test_env_loading.py
```

You should see your API key loaded. If not, check:
- The .env file is in the backend directory
- No syntax errors in .env file
- File encoding is UTF-8

## Common Issues

1. **Wrong Directory**: Make sure .env is in `/backend/` not root
2. **File Encoding**: Save .env as UTF-8 without BOM
3. **Line Endings**: Use LF not CRLF (can cause issues)
4. **Hidden Characters**: Check for invisible characters in .env

## Still Not Working?

1. Get a new API key from: https://aistudio.google.com/app/apikey
2. Make sure the API is enabled in your Google Cloud Console
3. Check if your API key has the correct permissions

## Test the AI Chat

Once fixed, test in the frontend:
1. Start the backend server
2. Open the frontend
3. Click the chat button (bottom right)
4. Type "Hello" and see if you get a response

The response should show:
- Provider: gemini
- Model: gemini-2.0-flash-exp
- Token usage and cost estimate 