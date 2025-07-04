#!/usr/bin/env python3
"""
Fixed server startup script for Financial Alarm Clock API
Handles Python path and module imports correctly
"""

import os
import sys
import uvicorn
from pathlib import Path

def main():
    # Get the backend directory path
    backend_dir = Path(__file__).parent.absolute()
    
    # Add the backend directory to Python path
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    # Change to backend directory
    os.chdir(backend_dir)
    
    print(f"🔧 Starting from directory: {backend_dir}")
    print(f"🐍 Python path includes: {backend_dir}")
    
    # Start the server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(backend_dir)]
    )

if __name__ == "__main__":
    main() 