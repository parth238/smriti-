# 06 — Folder Structure

Monorepo on GitHub. One repo, three deployable apps, shared types where useful.

```
smriti/
├── apps/
│   ├── elderly-app/                 # React + Vite + TS PWA (Anirudh)
│   │   ├── public/
│   │   │   ├── manifest.json        # PWA manifest
│   │   │   └── icons/
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── serviceWorker.ts     # Workbox registration
│   │   │   ├── db/                  # Dexie (IndexedDB) setup
│   │   │   │   ├── dexie.ts
│   │   │   │   └── syncOutbox.ts
│   │   │   ├── games/
│   │   │   │   ├── MemoryMatch/
│   │   │   │   ├── AttentionReaction/
│   │   │   │   ├── Sequencing/
│   │   │   │   └── PictureNaming/
│   │   │   ├── screens/
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── GameSelect.tsx
│   │   │   │   ├── Reminders.tsx
│   │   │   │   ├── Reminiscence.tsx
│   │   │   │   └── Login.tsx
│   │   │   ├── components/          # shared dumb components (Button, Card, etc.)
│   │   │   ├── hooks/
│   │   │   │   ├── useOfflineSync.ts
│   │   │   │   └── useAdaptiveDifficulty.ts
│   │   │   ├── i18n/                 # translation JSON per language
│   │   │   │   ├── en.json
│   │   │   │   └── as.json
│   │   │   ├── api/                  # typed API client (shared contract with backend)
│   │   │   └── styles/
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── caregiver-dashboard/         # React + Vite + TS (Parth)
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── pages/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── PatientOverview.tsx
│   │   │   │   ├── Analytics.tsx
│   │   │   │   ├── Reminders.tsx
│   │   │   │   ├── Memories.tsx
│   │   │   │   └── Alerts.tsx
│   │   │   ├── components/
│   │   │   │   └── charts/           # Recharts wrappers
│   │   │   ├── api/
│   │   │   └── styles/
│   │   └── package.json
│   │
│   └── backend/                     # FastAPI (Harshit, Ananya)
│       ├── app/
│       │   ├── main.py
│       │   ├── core/
│       │   │   ├── config.py         # see doc 12
│       │   │   ├── security.py       # JWT, password hashing
│       │   │   └── deps.py           # shared FastAPI dependencies
│       │   ├── models/               # SQLAlchemy models (mirrors doc 04)
│       │   │   ├── user.py
│       │   │   ├── caregiver.py
│       │   │   ├── game.py
│       │   │   ├── game_session.py
│       │   │   ├── reminder.py
│       │   │   ├── memory_item.py
│       │   │   ├── performance_metric.py
│       │   │   └── alert.py
│       │   ├── schemas/              # Pydantic request/response schemas
│       │   ├── api/
│       │   │   ├── v1/
│       │   │   │   ├── auth.py
│       │   │   │   ├── users.py
│       │   │   │   ├── games.py
│       │   │   │   ├── reminders.py
│       │   │   │   ├── memories.py
│       │   │   │   ├── sync.py
│       │   │   │   ├── analytics.py
│       │   │   │   └── alerts.py
│       │   │   └── router.py
│       │   ├── services/
│       │   │   ├── adaptive_difficulty.py   # rule-based staircase (Mohd Rehan)
│       │   │   ├── analytics_engine.py      # trend/baseline computation (Mohd Rehan)
│       │   │   └── notification_service.py
│       │   ├── db/
│       │   │   ├── session.py
│       │   │   └── migrations/       # Alembic
│       │   └── tests/
│       ├── requirements.txt
│       └── alembic.ini
│
├── packages/
│   ├── shared-types/                 # TS types shared between elderly-app & dashboard (API contracts)
│   └── content-packs/                # Localized cultural content (JSON + media refs)
│       ├── assamese/
│       │   ├── strings.json
│       │   └── cultural-media.json
│       └── english/
│
├── docs/                             # ← THIS bible (all 14 docs)
│   ├── 00-problem-statement-and-context.md
│   ├── 01-architecture.md
│   ├── ... (02–14)
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # lint + test on PR
│       └── deploy.yml                # deploy on merge to main
│
├── docker-compose.yml                # local dev: postgres + backend
├── .env.example
└── README.md
```

## Ownership Mapping (who touches what)

| Folder | Owner(s) |
|---|---|
| `apps/elderly-app/` | Anirudh (lead), Srujna (design/content), Ananya (offline/sync/i18n) |
| `apps/caregiver-dashboard/` | Parth (lead), Srujna (design) |
| `apps/backend/` | Harshit (lead), Ananya (sync, reminders), Mohd Rehan (services/) |
| `packages/content-packs/` | Srujna, Ananya |
| `docs/` | All — Harshit maintains as source of truth, everyone updates their section |
| `.github/workflows/` | Harshit, Ananya |

## Branch Naming Convention
`feature/<area>-<short-desc>` e.g. `feature/elderly-memory-game`, `fix/backend-sync-conflict`, `docs/update-api-spec`.
