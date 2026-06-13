"""
OODA — Main FastAPI Application
Observe → Orient → Decide → Act
Real-Time Competitive Intelligence & Counter-Strategy Engine
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database.models import init_db

# Route imports
from backend.api.routes.demo import router as demo_router
from backend.api.routes.signals import router as signals_router
from backend.api.routes.competitors import router as competitors_router
from backend.api.routes.entropy import router as entropy_router
from backend.api.routes.agents import router as agents_router
from backend.api.routes.debate import router as debate_router
from backend.api.routes.counter_strike import router as counter_strike_router


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on startup."""
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(demo_router)
app.include_router(signals_router)
app.include_router(competitors_router)
app.include_router(entropy_router)
app.include_router(agents_router)
app.include_router(debate_router)
app.include_router(counter_strike_router)


# ── Health ────────────────────────────────────────────────────────────────────


@app.get("/", tags=["Health"])
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "tagline": "The competitive intelligence engine that does not just watch. It fights back.",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
