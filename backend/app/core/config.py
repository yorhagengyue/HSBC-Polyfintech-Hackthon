from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Financial Alarm Clock"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    
    # Database
    DATABASE_URL: str = "mysql+aiomysql://root:526811@localhost:3306/hsbc"
    
    # HSBC API - Using registered credentials from memory
    HSBC_CLIENT_ID: str = "xM3vskttJUtUE5MxJmwZyTc2AZG8I7y4"
    HSBC_KID: str = "1f4cb99f-cb5b-47d7-a352-fad3eefbc9a5"
    HSBC_ORG_ID: str = "temasek_po_11529"
    HSBC_API_BASE_URL: str = "https://sandbox.hsbc.com/open-banking/v1"
    HSBC_BRAND: str = "HSBC Malta Personal"
    
    # HSBC Certificates - Relative paths from backend directory
    HSBC_TRANSPORT_CERT_PATH: str = "../certs/transport_certificate.pem"
    HSBC_TRANSPORT_KEY_PATH: str = "../certs/transport_private.key"
    HSBC_SIGNING_CERT_PATH: str = "../certs/signing_certificate.pem"
    HSBC_SIGNING_KEY_PATH: str = "../certs/signing_private.key"
    
    # HSBC OAuth
    HSBC_CLIENT_URL: str = "https://localhost:3000"
    HSBC_REDIRECT_URL: str = "https://tpms-website.onrender.com/"
    
    # Token cache settings
    HSBC_ACCESS_TOKEN_CACHE_MINUTES: int = 60
    HSBC_TOKEN_REFRESH_BUFFER_MINUTES: int = 2
    
    # Yahoo Finance
    YAHOO_FINANCE_INTERVAL: str = "1m"  # 1 minute intervals for real-time monitoring
    YAHOO_FINANCE_RAPID_API_KEY: str = "487d9be446msh808a69223d373cbp12cf58jsn24e062ece0ce"
    
    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "mistral:7b"
    
    # News API
    NEWS_API_KEY: Optional[str] = None
    
    # Alert thresholds
    PRICE_DROP_THRESHOLD: float = 0.05  # 5% drop triggers alert
    VOLATILITY_THRESHOLD: float = 0.03  # 3% volatility threshold
    
    # Redis/Cache settings
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 900  # 15 minutes default cache
    
    # Security settings
    JWT_ALGORITHM: str = "RS256"
    JWT_EXPIRATION_MINUTES: int = 30
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_TO_FILE: bool = True
    LOG_FILE_PATH: str = "logs/financial_alarm_clock.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings() 