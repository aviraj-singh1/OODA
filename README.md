# OODA — Observe → Orient → Decide → Act

> The competitive intelligence engine that doesn't just watch. It fights back.

OODA is a **real-time competitive intelligence and counter-strategy engine** built for hackathon demo. It detects competitor moves, calculates market entropy, runs multiple AI agents that debate the impact, generates a final strategy verdict, and creates deployable Counter-Strike response packages — all from your phone.

## 🎯 What It Does

```
Competitor signal detected
  → Market Entropy Score calculated
    → AI Agents analyze (Marketing, Product, Sales)
      → Strategy AI gives final verdict
        → Counter-Strike package generated (5 assets)
          → User reviews and deploys (simulated)
```

### Demo Scenario

At 2:17 AM, competitor **RivalFlow** drops pricing from **₹999/month** to **₹749/month**.

OODA detects this as a HIGH severity pricing signal:
- **Market Entropy Score** jumps to **73/100**
- **Marketing AI** (Watcher), **Product AI** (Archaeologist), and **Sales AI** (Hunter) analyze the signal
- **Strategy AI** (General) gives final verdict: **THREAT** with **~87% confidence**
- Counter-Strike Engine generates 5 assets:
  1. **Retention Email** — Calm, value-focused email for renewal customers
  2. **Sales Battlecard** — Objection handling with talking points and "do not say" list
  3. **Social Response** — LinkedIn/X post with value positioning
  4. **Internal Alert** — Team notification with per-team action items
  5. **Comparison Report** — Competitive analysis with sections for leadership

User clicks **"Deploy Counter-Strike"** → deployment simulated safely.

---

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite 8 + Tailwind CSS v4 |
| **Backend** | Python 3 + FastAPI + SQLAlchemy + SQLite |
| **AI Agents** | Deterministic (no LLM key needed for demo) |
| **Design** | Dark military war-room aesthetic, mobile-first |

---

## 🚀 Quick Start

### 1. Backend

```bash
# From project root (OODA/)
cd backend
pip install -r requirements.txt
cd ..
uvicorn backend.main:app --reload
```

> **Important:** Run `uvicorn` from the project root (`OODA/`), not from inside `backend/`.

Backend runs at: `http://localhost:8000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

### 3. Demo Flow

1. Open `http://localhost:5173`
2. Click **"Seed Demo"** to populate database with RivalFlow competitor data
3. Click **"Trigger Price Drop"** to simulate the live pricing signal
4. View **Dashboard** — entropy gauge, signal feed, status
5. Go to **Signals** tab — see all detected signals
6. Go to **Entropy** tab — breakdown of market entropy components
7. Go to **Agents** tab → Click **"Run Agent Analysis"** → See 3 agent verdicts
8. Click **"Run Debate"** → Strategy AI gives final THREAT verdict
9. Go to **Counter-Strike** tab → Click **"Build Counter-Strike"** → See 5 generated assets
10. Click **"Deploy Counter-Strike"** → Deployment simulated with action log

---

## 📁 Project Structure

```
OODA/
├── backend/
│   ├── main.py                        # FastAPI application entry point
│   ├── config.py                      # Environment & settings
│   ├── requirements.txt               # Python dependencies
│   │
│   ├── database/                      # Phase 1: Data layer
│   │   ├── models.py                  # 6 SQLAlchemy tables
│   │   ├── crud.py                    # All database operations
│   │   └── seed_demo.py               # RivalFlow demo data seeder
│   │
│   ├── api/                           # Phase 1: API layer
│   │   ├── schemas.py                 # Pydantic response schemas
│   │   └── routes/
│   │       ├── demo.py                # Seed & trigger endpoints
│   │       ├── signals.py             # Signal CRUD + classification
│   │       ├── competitors.py         # Competitor + genome endpoints
│   │       ├── entropy.py             # Entropy score endpoints
│   │       ├── agents.py              # Agent run + verdict endpoints
│   │       ├── debate.py              # Debate engine endpoints
│   │       └── counter_strike.py      # Counter-Strike build + deploy
│   │
│   ├── intelligence/                  # Phase 2: Analysis engines
│   │   ├── entropy_calculator.py      # Market Entropy Score (0-100)
│   │   ├── signal_classifier.py       # Signal taxonomy & severity
│   │   └── competitor_genome.py       # Competitor profiling
│   │
│   ├── agents/                        # Phase 3: AI agent system
│   │   ├── base_agent.py              # BaseAgent abstract class
│   │   ├── marketing_agent.py         # Watcher — positioning & perception
│   │   ├── product_agent.py           # Archaeologist — product strength
│   │   ├── sales_agent.py             # Hunter — revenue & pipeline risk
│   │   ├── strategy_agent.py          # General — strategic synthesis
│   │   ├── agent_runner.py            # Orchestrator for running agents
│   │   └── prompts.py                 # Lens descriptions & templates
│   │
│   ├── debate/                        # Phase 4: Debate engine
│   │   ├── debate_engine.py           # Full debate pipeline orchestrator
│   │   ├── strategy_resolver.py       # Strategy AI resolution logic
│   │   └── reputation_engine.py       # Agent reputation tracking
│   │
│   ├── counter_strike/                # Phase 5: Counter-Strike engine
│   │   ├── package_builder.py         # Main orchestrator
│   │   ├── email_generator.py         # Retention email generator
│   │   ├── battlecard_generator.py    # Sales battlecard generator
│   │   ├── social_generator.py        # Social response generator
│   │   ├── internal_alert_generator.py # Internal team alert generator
│   │   └── export_generator.py        # Comparison report generator
│   │
│   └── ingestion/                     # Signal normalization (placeholder)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Root component with routing
│   │   ├── main.jsx                   # Entry point
│   │   ├── index.css                  # OODA design system (dark theme)
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx          # Main dashboard with entropy gauge
│   │   │   ├── Signals.jsx            # Signal feed page
│   │   │   ├── EntropyPage.jsx        # Entropy breakdown page
│   │   │   ├── Debate.jsx             # Agent debate & strategy verdict
│   │   │   ├── CounterStrike.jsx      # Counter-Strike build & deploy
│   │   │   └── Rivals.jsx             # Competitor genome page
│   │   │
│   │   ├── components/
│   │   │   ├── BottomNav.jsx          # Mobile bottom navigation
│   │   │   ├── SignalFeed.jsx         # Signal list component
│   │   │   ├── EntropyGauge.jsx       # Circular entropy gauge
│   │   │   ├── EntropyBreakdown.jsx   # Entropy component bars
│   │   │   ├── EntropyTimeline.jsx    # Entropy history timeline
│   │   │   ├── AgentDebateView.jsx    # Agent verdict cards
│   │   │   ├── CompetitorGenomeCard.jsx # Competitor profile card
│   │   │   ├── CounterStrikePanel.jsx # Dashboard CS summary panel
│   │   │   ├── AssetCard.jsx          # Asset card component
│   │   │   └── StatusBadge.jsx        # Status badge component
│   │   │
│   │   └── services/
│   │       └── api.js                 # Centralized API client (axios)
│   │
│   ├── index.html
│   └── package.json
│
├── .env.example                       # Environment variable template
├── .gitignore
└── ooda.db                            # SQLite database (auto-created)
```

---

## 🔌 API Endpoints

### Demo
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/demo/seed` | Seed database with RivalFlow demo data |
| `POST` | `/api/demo/trigger-price-drop` | Simulate live pricing signal |

### Signals
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/signals` | List all signals |
| `GET` | `/api/signals/latest` | Get most recent signal |
| `GET` | `/api/signals/{id}` | Get signal by ID |
| `GET` | `/api/signals/{id}/classify` | Classify a signal |

### Entropy
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/entropy/current` | Current Market Entropy Score |
| `GET` | `/api/entropy/components` | Entropy breakdown by factor |
| `GET` | `/api/entropy/history` | Entropy score history |

### Competitors
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/competitors` | List all competitors |
| `GET` | `/api/competitors/{id}` | Get competitor by ID |
| `GET` | `/api/competitors/genomes` | All competitor genomes |
| `GET` | `/api/competitors/{id}/genome` | Single competitor genome |

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/agents/run/{signal_id}` | Run all 3 agents on a signal |
| `GET` | `/api/agents/verdicts/{signal_id}` | Get verdicts for a signal |
| `GET` | `/api/agents/latest` | Latest agent verdicts |
| `GET` | `/api/agents/reputation` | Agent reputation scores |

### Debate
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/debate/run/{signal_id}` | Run full debate pipeline |
| `GET` | `/api/debate/latest` | Latest debate result |
| `GET` | `/api/debate/{id}` | Get debate by ID |
| `GET` | `/api/debate/by-signal/{signal_id}` | Get debate for a signal |

### Counter-Strike
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/counter-strike/build/{signal_id}` | Build package (5 assets) |
| `GET` | `/api/counter-strike/latest` | Latest Counter-Strike package |
| `GET` | `/api/counter-strike/{id}` | Get package by ID |
| `POST` | `/api/counter-strike/{id}/deploy` | Simulate deployment |

> Use `?force=true` on build endpoint to regenerate an existing package.

---

## 🏗️ Development Phases

- [x] **Phase 0** — Project foundation (FastAPI + React + Vite + routing + design system)
- [x] **Phase 1** — Database models, CRUD, seed data, 7 route files, Pydantic schemas
- [x] **Phase 2** — Market Entropy Engine, signal classifier, competitor genome
- [x] **Phase 3** — Agent system (Marketing AI, Product AI, Sales AI, agent runner)
- [x] **Phase 4** — Debate engine, Strategy AI resolver, reputation engine
- [x] **Phase 5** — Counter-Strike engine (5 generators + package builder + deploy simulation)
- [ ] **Phase 6** — UI polish and responsive refinement
- [ ] **Phase 7** — Demo flow polish and OfficeKit integration

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `competitors` | Tracked competitor companies |
| `signals` | Detected competitive signals |
| `agent_verdicts` | Individual AI agent analysis results |
| `debates` | Strategy AI final verdicts |
| `counter_strike_packages` | Generated response packages with 5 asset types |
| `agent_reputation` | Agent accuracy tracking |

---

## 🎨 Design System

OODA uses a **dark military war-room aesthetic** with:
- Dark backgrounds (`#0a0e17`, `#111827`)
- Cyan accent (`#00d4ff`) for primary actions
- Threat red (`#ff3b3b`) for high-severity indicators
- Stable green (`#00e676`) for positive states
- Agent colors: Purple (Marketing), Blue (Product), Amber (Sales), Cyan (Strategy)
- Animated scan line, pulse effects, and fade-in transitions
- Mobile-first layout with bottom navigation

---

## ⚠️ Hackathon Notes

- All AI agents use **deterministic outputs** — no LLM API key required
- Email sending, social posting, and CRM integration are **simulated**
- Deploy button is **simulation only** — no real actions taken
- Database is SQLite (file-based, auto-created on startup)
- All data can be reset with the "Seed Demo" button

---

## License

MIT
