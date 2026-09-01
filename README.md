# Smriti

## Final SIH 2026 build — 7/10

Cognitive gaming and memory assistance for elderly dementia/MCI patients in Assam (SIH26003).

**Built by Anirudh P.S Yadav** — teammates polish per [`docs/SMRITI_MASTER.md`](docs/SMRITI_MASTER.md) §11.

[![CI](https://github.com/Rehan-2024/smriti-/actions/workflows/ci.yml/badge.svg)](https://github.com/Rehan-2024/smriti-/actions/workflows/ci.yml)

## Clone (full product on `main`)

All feature work is merged into **`main`** — one branch, latest build.

```bash
git clone https://github.com/AnirudhPratapSinghYadav/SIH2026.git
cd SIH2026
# default branch main = elderly PWA + caregiver dashboard + Story Mode + API
```

## Quick start

Toolchain: **Node 20**, **Python 3.11**.

```bash
docker compose up -d postgres
cd apps/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python ../../scripts/seed_judge_demo.py
uvicorn app.main:app --reload --port 8000
```

```bash
cd apps/elderly-app && npm ci && npm run dev          # :5173
cd apps/caregiver-dashboard && npm ci && npm run dev  # :5174
```

Set `VITE_API_URL=http://localhost:8000/api/v1` in elderly/caregiver `.env`.  
Caregiver only: `VITE_ELDERLY_APP_URL=http://localhost:5173` (Story Mode CTA links).

**Public story (no login):** caregiver app [`/story`](http://localhost:5174/story) — hook, problem, solution, two-app honesty, PDF checklist.

## Judge demo logins

| App | Login |
|-----|-------|
| Caregiver (:5174) | `9876543210` / `SmritiJudge2026` |
| Elderly (:5173) | `9123456789` / PIN `2468` |

## Documentation

**Everything lives in one place:** [`docs/SMRITI_MASTER.md`](docs/SMRITI_MASTER.md)

- Honest /10 product scores
- PDF requirement checklist
- Architecture flowcharts
- Full setup + deploy guide
- All 7 games + known bugs
- Assamese voice reality
- Teammate assignments
- Path to production 10/10

PDF reference: [`docs/SIH-2026-problem-statement.pdf`](docs/SIH-2026-problem-statement.pdf)

## Winning path (2026-08-31)

| Done in code | Teammate P0 |
|--------------|-------------|
| Bhashini TTS proxy + hybrid voice | Add API keys on Render |
| Live caregiver Alerts | Deploy + test |
| Local reminder notifications | Android PWA permission test |
| Offline fonts + photo cache + Background Sync tag | Airplane-mode demo |
| Adaptive level + hints + quit tracking | Hero journey rehearsal |
| **Story Mode** at `/story` (public pitch page) | Set `VITE_ELDERLY_APP_URL` on Vercel |
| Caregiver browser notifications (missed reminders) | Allow notification permission in demo |
| `render.yaml` deploy blueprint | Supabase + Vercel URLs |

Playtest template: [`docs/playtest/PLAYTEST.md`](docs/playtest/PLAYTEST.md)

## Repo layout

```
apps/backend/              FastAPI API :8000
apps/elderly-app/          Elderly PWA :5173
apps/caregiver-dashboard/  Caregiver UI :5174
packages/content-packs/    Assamese/English cultural JSON
docs/SMRITI_MASTER.md      Single master doc
scripts/seed_judge_demo.py Judge demo data
```

## CI

GitHub Actions runs backend pytest + frontend vitest/tsc/build on PRs to `main`.
