"""
OODA Configuration Module
Loads environment variables and provides app-wide settings.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (parent of backend/) first, then CWD
_project_root = Path(__file__).resolve().parent.parent
load_dotenv(_project_root / ".env")  # PROJECT_ROOT/.env (primary)
load_dotenv()  # CWD .env (fallback for backward compat)


class Settings:
    APP_NAME: str = "OODA"
    APP_VERSION: str = "0.7.0"
    APP_DESCRIPTION: str = "Observe → Orient → Decide → Act — Real-Time Competitive Intelligence Engine"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ooda.db")

    # ── Data Mode ─────────────────────────────────────────────────────────
    # "demo"   = seeded data only
    # "live"   = real API integrations only
    # "hybrid" = try real APIs first, fallback to seeded/demo data
    DATA_MODE: str = os.getenv("DATA_MODE", "hybrid")

    # ── LLM Provider Selection ────────────────────────────────────────────
    # "openrouter" = try OpenRouter first, then demo fallback
    # "ollama"     = try Ollama first, then demo fallback
    # "auto"       = try OpenRouter if key exists → Ollama → fallback
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openrouter").lower()

    # ── Open-Source / Local LLM ───────────────────────────────────────────
    OPEN_SOURCE_LLM_PROVIDER: str = os.getenv("OPEN_SOURCE_LLM_PROVIDER", "ollama")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b")

    # ── Cloud LLM (OpenRouter) ────────────────────────────────────────────
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://openrouter.ai/api/v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "deepseek/deepseek-chat")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat")
    OPENROUTER_SITE_URL: str = os.getenv("OPENROUTER_SITE_URL", "http://localhost:5173")
    OPENROUTER_APP_NAME: str = os.getenv("OPENROUTER_APP_NAME", "OODA")

    # ── External API Keys ─────────────────────────────────────────────────
    NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "")
    SERPAPI_KEY: str = os.getenv("SERPAPI_KEY", "")
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")


settings = Settings()
