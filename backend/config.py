"""
OODA Configuration Module
Loads environment variables and provides app-wide settings.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "OODA"
    APP_VERSION: str = "0.1.0"
    APP_DESCRIPTION: str = "Observe → Orient → Decide → Act — Real-Time Competitive Intelligence Engine"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ooda.db")

    # LLM
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://openrouter.ai/api/v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "openai/gpt-4o-mini")

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")


settings = Settings()
