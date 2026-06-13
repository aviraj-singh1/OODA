# OODA — Observe → Orient → Decide → Act

> The competitive intelligence engine that does not just watch. It fights back.

Real-time competitive intelligence & counter-strategy engine. Detects competitor moves, makes AI agents debate the impact, generates a final strategy verdict, and creates deployable Counter-Strike packages.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS v4
- **Backend**: Python + FastAPI + SQLAlchemy + SQLite
- **AI**: LangGraph + OpenRouter/OpenAI compatible LLM
- **Design**: Dark military war-room aesthetic, mobile-first PWA

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

> Run uvicorn from the project root (`OODA/`), not from inside `backend/`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Demo Flow

1. Open `http://localhost:5173`
2. Click **"Seed Demo"** to populate database
3. Click **"Trigger Price Drop"** to simulate a live signal
4. View signals, entropy score, and agent status on the dashboard

## Project Structure

```
ooda/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py             # Environment & settings
│   ├── database/             # Models, CRUD, seed data
│   ├── api/                  # Routes & Pydantic schemas
│   ├── agents/               # AI agent system (Phase 3)
│   ├── debate/               # Debate engine (Phase 4)
│   ├── counter_strike/       # Response generator (Phase 5)
│   ├── intelligence/         # Entropy & competitor genome
│   └── ingestion/            # Signal normalization
├── frontend/
│   ├── src/
│   │   ├── pages/            # Dashboard, Signals, Debate, etc.
│   │   ├── components/       # Reusable UI components
│   │   └── services/         # API client
│   └── index.html
└── .env.example
```

## Development Phases

- [x] Phase 0 — Project foundation
- [x] Phase 1 — Backend data models & seed APIs
- [x] Phase 2 — Entropy engine
- [ ] Phase 3 — Agent system
- [ ] Phase 4 — Debate engine
- [ ] Phase 5 — Counter-Strike engine
- [ ] Phase 6 — UI polish
- [ ] Phase 7 — Demo polish

## License

MIT
