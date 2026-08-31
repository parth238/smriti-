# Smriti

## Quick Start
To begin development on the Smriti project (SIH26003), follow the AI-Agent Boot Protocol.

Pinned toolchain (do not drift): Node 20, Python 3.11. See `docs/05-project-management/TOOLING_VERSIONS.md`.

```bash
docker compose up -d postgres
cd apps/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Elderly app (T1-FE-001+): `cd apps/elderly-app && npm ci && npm run dev` on port 5173.

Caregiver dashboard (T2-FE-001): `cd apps/caregiver-dashboard && npm ci && npm run dev` on port 5174.

## Deploy (MVP)

### Local full stack

```bash
docker compose up -d
# API: http://localhost:8000/docs
# Elderly: cd apps/elderly-app && VITE_API_URL=http://localhost:8000/api/v1 npm run dev
# Caregiver: cd apps/caregiver-dashboard && VITE_API_URL=http://localhost:8000/api/v1 npm run dev
```

### Environment variables

| App | Variable | Example |
|---|---|---|
| Backend | `DATABASE_URL` | `postgresql://smriti:smriti_dev@localhost:5432/smriti_dev` |
| Backend | `JWT_SECRET_KEY` | 32+ random bytes |
| Backend | `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:5174` |
| Backend | `UPLOAD_DIR` | `uploads` (local) or mounted volume in Docker |
| Elderly / Caregiver | `VITE_API_URL` | `http://localhost:8000/api/v1` |

Copy `apps/backend/.env.example` to `.env` before first run.

### Hosted Postgres (Supabase / Neon)

1. Create a project and copy the connection string into `DATABASE_URL`.
2. Run `alembic upgrade head` from `apps/backend`.
3. Point Render/Railway/Fly API deploy at the same env vars.
4. Set `ALLOWED_ORIGINS` to your Vercel URLs.

### Vercel frontends

- Elderly PWA: root `apps/elderly-app`, set `VITE_API_URL` to production API.
- Caregiver dashboard: root `apps/caregiver-dashboard`, same `VITE_API_URL`.
- `vercel.json` in each app enables SPA routing.

### CI

GitHub Actions (`.github/workflows/ci.yml`) runs backend pytest + frontend `tsc` + build on PRs to `main`.

Who does what next: `docs/05-project-management/NEXT_PLAN.md`. Status: `docs/05-project-management/TEAM_STATUS.md`.

## Repository Structure
```
/
├── apps/               # Source code for Backend, Dashboard, Elderly App
├── packages/           # Shared packages, DB schemas, UI components, Content
├── docs/               # Official Engineering and Process Documentation
├── .github/            # GitHub actions and templates
├── tests/              # E2E and cross-service testing
└── scripts/            # Build and utility scripts
```

## Documentation
The official documentation is rigorously structured to separate architecture specifications from execution workflow.
- **01. Source of Truth** → `docs/00-source-of-truth/`
- **02. Execution** → `docs/01-execution/`
- **03. Teams** → `docs/02-teams/`
- **04. Members** → `docs/03-members/`
- **05. GitHub** → `docs/04-github-and-workflow/`
- **06. Project Management** → `docs/05-project-management/`
- **07. Reference** → `docs/06-reference/`

## AI Agent Workflow
**START HERE FOR AI-ASSISTED DEVELOPMENT:**
Read `docs/01-execution/AI_AGENT_BOOT_PROTOCOL.md` to understand the standard initialization process for Antigravity or Cursor.

The workflow is deterministic:
1. Clone the repository.
2. Open Antigravity.
3. Supply your `NAME` and `TEAM` to trigger the Boot Protocol.
4. The AI will cross-reference the Master Execution matrix and your specific Member file to identify your next actionable checkpoint.

## Team Structure
- **Team 1 (Core Platform):** Harshit & Anirudh
- **Team 2 (Intelligence & Dashboard):** Parth & Mohd Rehan
- **Team 3 (Offline, Content & Design System):** Ananya & Srujna

## Development Workflow
All changes must be mapped to a documented MVP task and tracked in `docs/01-execution/DEVELOPMENT_CHECKLIST.md`. Work happens on `feature/` branches and is merged via PR after review.

## Where To Start
Jump to [docs/README.md](docs/README.md) for the complete index of all architectural and process documents.
