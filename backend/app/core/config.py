from pydantic_settings import BaseSettings
from typing import Optional, List
from pathlib import Path
from dotenv import load_dotenv

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Financial Alarm Clock"
    
    # Database Configuration
    DATABASE_URL: str = "sqlite+aiosqlite:///./financial_alarm_clock.db"
    
    # Stock & Market Data
    YAHOO_API_KEY: str = ""
    RAPID_API_KEY: str = ""
    
    # News API
    NEWS_API_KEY: str = ""
    
    # AI Configuration
    GEMINI_API_KEY: str = ""
    
    # HSBC Mock Mode - Enable mock mode for development testing
    HSBC_MOCK_MODE: bool = True  # Default enable mock mode
    
    # HSBC API Configuration
    HSBC_BASE_URL: str = "https://sandbox.hsbc.com"
    HSBC_CLIENT_ID: str = "xM3vskttJUtUE5MxJmwZyTc2AZG8I7y4"
    HSBC_KID: str = "1f4cb99f-cb5b-47d7-a352-fad3eefbc9a5"
    HSBC_ORGANIZATION_ID: str = "temasek_po_11529"
    HSBC_REDIRECT_URI: str = "https://tpms-website.onrender.com/"
    
    # Certificate paths - will be resolved to absolute paths
    HSBC_TRANSPORT_CERT_PATH: str = "../certs/transport_cert.pem"
    HSBC_TRANSPORT_KEY_PATH: str = "../certs/transport_key.pem"
    HSBC_SIGNING_CERT_PATH: str = "../certs/signing_cert.pem"
    HSBC_SIGNING_KEY_PATH: str = "../certs/signing_key.pem"
    
    # JWT Configuration
    JWT_ALGORITHM: str = "RS256"
    JWT_EXPIRATION_HOURS: int = 1
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://localhost:3000",
        "https://localhost:5173"
    ]
    
    # OpenAPI Configuration
    OPENAPI_TITLE: str = "Financial Alarm Clock API"
    OPENAPI_VERSION: str = "1.0.0"
    OPENAPI_DESCRIPTION: str = "AI-powered financial monitoring system"
    
    # Debugging
    DEBUG: bool = True
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    
    # WebSocket Configuration
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds
    WS_MAX_CONNECTIONS: int = 100
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # Cache Configuration
    CACHE_TTL: int = 300  # seconds
    
    # Environment-specific configurations
    ENVIRONMENT: str = "development"
    
    # Health Check Configuration
    HEALTH_CHECK_TIMEOUT: int = 10
    
    # HSBC API timeout settings
    HSBC_API_TIMEOUT: int = 30
    
    # Retry settings
    MAX_RETRIES: int = 3
    RETRY_DELAY: int = 1
    
    # AI Model Configuration
    AI_MODEL_TEMPERATURE: float = 0.7
    AI_MAX_TOKENS: int = 1000
    
    # Financial Data Configuration
    STOCK_UPDATE_INTERVAL: int = 60  # seconds
    ALERT_CHECK_INTERVAL: int = 30  # seconds
    
    # Data persistence settings
    DATA_BACKUP_INTERVAL: int = 3600  # seconds
    MAX_BACKUP_FILES: int = 24
    
    # Monitoring Configuration
    METRICS_ENABLED: bool = True
    METRICS_PORT: int = 8080
    
    # Notification settings
    NOTIFICATION_ENABLED: bool = True
    EMAIL_NOTIFICATIONS: bool = False
    PUSH_NOTIFICATIONS: bool = True
    
    # Feature flags
    FEATURE_REAL_TIME_ALERTS: bool = True
    FEATURE_AI_ANALYSIS: bool = True
    FEATURE_PORTFOLIO_TRACKING: bool = True

# Load environment variables
def load_environment():
    """Load configuration from environment file"""
    # Ensure loading .env file from backend directory
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
    
    # Parse certificate file absolute paths
    base_path = Path(__file__).parent.parent  # backend directory
    
    # Get project root directory (assuming backend/app/core/config.py structure)
    project_root = base_path.parent
    
    # Parse certificate paths
    settings.HSBC_TRANSPORT_CERT_PATH = str(project_root / settings.HSBC_TRANSPORT_CERT_PATH)
    settings.HSBC_TRANSPORT_KEY_PATH = str(project_root / settings.HSBC_TRANSPORT_KEY_PATH)
    settings.HSBC_SIGNING_CERT_PATH = str(project_root / settings.HSBC_SIGNING_CERT_PATH)
    settings.HSBC_SIGNING_KEY_PATH = str(project_root / settings.HSBC_SIGNING_KEY_PATH)

settings = Settings() 

# Load environment variables and resolve paths
load_environment() 