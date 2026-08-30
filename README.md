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
