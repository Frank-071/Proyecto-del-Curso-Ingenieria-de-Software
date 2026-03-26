from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


import os

def get_env_file():
    env = os.environ.get("ENVIRONMENT", None)
    if env == "production":
        return ".env.production"
    elif env == "development":
        return ".env.development"
    else:
        return ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=get_env_file(),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    APP_NAME: str = "PPI Backend API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    DATABASE_URL: Optional[str] = None
    DATABASE_HOST: str
    DATABASE_PORT: int = 3306
    DATABASE_NAME: str
    DATABASE_USER: str
    DATABASE_PASSWORD: str
    DATABASE_CHARSET: str = "utf8mb4"
    DATABASE_COLLATION: str = "utf8mb4_unicode_ci"
    DATABASE_SSL_MODE: str = "REQUIRED"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE: int = 3600
    DATABASE_POOL_PRE_PING: bool = True
    DATABASE_ECHO: bool = False
    
    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    REDIS_MAX_CONNECTIONS: int = 20
    REDIS_SOCKET_CONNECT_TIMEOUT: int = 2
    REDIS_SOCKET_TIMEOUT: int = 5
    REDIS_RETRY_ON_TIMEOUT: bool = True
    REDIS_SOCKET_KEEPALIVE: bool = True
    REDIS_HEALTH_CHECK_INTERVAL: int = 30
    
    # Redis Cache TTL (Time To Live in seconds)
    CACHE_TTL_EVENTO_LIST: int = 300  # 5 minutos para listado de eventos
    CACHE_TTL_EVENTO_DETAIL: int = 120  # 2 minutos para detalle de evento
    CACHE_TTL_USER_PROFILE: int = 1800  # 30 minutos para perfil de usuario
    CACHE_TTL_CLIENTE_ENTRADAS: int = 120  # 2 minutos para listado de entradas por cliente
    
    # JWT Configuration
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Token Configuration (for registration and password reset)
    REGISTRATION_TOKEN_EXPIRE_MINUTES: int = 15
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 15
    
    # Email Configuration
    FROM_EMAIL: str
    SMTP_USER: str
    SMTP_HOST: str
    SMTP_PORT: int = 587
    SMTP_PASS: str
    
    # Gmail SMTP Configuration (fallback)
    GMAIL_SMTP_HOST: str = "smtp.gmail.com"
    GMAIL_SMTP_PORT: int = 587
    GMAIL_SMTP_USER: str = ""
    GMAIL_SMTP_PASS: str = ""
    
    # URL Configuration
    BACKEND_URL: str
    FRONTEND_URL: str
    CORS_ORIGINS: str

    # Geocoding / Maps configuration
    # Rate limiting window (seconds) and max requests in that window for geocoder calls
    GEOCODER_RATE_WINDOW: int = 1
    GEOCODER_RATE_MAX: int = 1
    # Retries and backoff for provider requests
    GEOCODER_MAX_RETRIES: int = 3
    GEOCODER_BACKOFF_BASE: float = 0.5
    # Cache TTL for geocoding results (seconds)
    GEOCODER_CACHE_TTL: int = 7 * 24 * 3600
    
    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"mysql+mysqldb://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}?charset={self.DATABASE_CHARSET}"
    
    def get_async_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL.replace("mysql+mysqldb://", "mysql+aiomysql://")
        return f"mysql+aiomysql://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}?charset={self.DATABASE_CHARSET}"
    
    def get_cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
settings = Settings()