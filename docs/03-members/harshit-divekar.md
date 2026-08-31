# INDIVIDUAL EXECUTION MANUAL: HARSHIT DIVEKAR

## 1 IDENTITY
**Name:** Harshit Divekar
**Team:** TEAM 1 (Core Platform)
**Role:** Backend & Infrastructure Lead
**Backup role:** Database Administrator

## 2 PROJECT CONTEXT
**What Smriti is:** An offline-first digital therapeutic and caregiver dashboard for elderly dementia patients in North-East India.
**MVP Scope:** 4 rule-based games, offline sync, reminders, and Assamese language support.
**Your responsibility:** The absolute foundation of the project. You own the Supabase PostgreSQL database, the FastAPI backend, JWT authentication, and the deployment infrastructure.

## 3 COMPUTER SETUP
**OS:** Windows/macOS/Linux.
**Git:** Install Git CLI.
**Python:** Install Python 3.11+. `python --version` to verify.
**Package manager:** Install `uv`. `curl -LsSf https://astral.sh/uv/install.sh | sh`.
**Docker:** Install Docker Desktop for local Postgres testing.
**IDE:** Cursor or Antigravity.
**Failure Fix:** If `uv` fails to build psycopg2, ensure C++ build tools / libpq-dev are installed.

## 4 GITHUB SETUP
**GitHub account:** Required.
**Repository access:** Ensure write access to `https://github.com/Rehan-2024/smriti-`.
**Identity:**
```bash
git config --global user.name "Harshit Divekar"
git config --global user.email "[YOUR_EMAIL]"
```
**Auth:** `gh auth login`
**Clone:** `git clone https://github.com/Rehan-2024/smriti-`

## 5 REPOSITORY SETUP
```bash
cd smriti-
git remote -v
git fetch
git branch -a
git checkout main
# Setup Python Backend Environment
cd apps/backend
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
pytest tests/
```

## 6 ENVIRONMENT VARIABLES
**DATABASE_URL:** Connection string for Postgres. (SECRET, BACKEND, LOCAL/PROD). Owner: You.
**JWT_SECRET_KEY:** Random 32-byte string. (SECRET, BACKEND, LOCAL/PROD). Owner: You.
**SUPABASE_URL:** URL of Supabase project. (NON-SECRET, BACKEND/FRONTEND, LOCAL/PROD). Owner: You.

## 7 EXTERNAL SERVICES
**Supabase:** You own this. You create it. Backend and Frontend need access.
**Render/Railway:** You own this. You create it. Deploy the FastAPI app here.

## 8 SUPABASE (DETAILED GUIDE)
As the Infrastructure Lead, you own the Database.
**Creation:** Create a Supabase org. Create a project named `smriti-mvp`. Select the `Mumbai` region (critical for NER latency).
**Password:** Generate a strong DB password. STORE IT IN A PASSWORD MANAGER. NEVER put it in Git.
**Config:** Extract the Postgres Connection String (`DATABASE_URL`). Provide it to your local `.env`.
**Migrations:** We use Alembic. `alembic init alembic`. Configure `alembic.ini` to read `DATABASE_URL` from env.
**Idempotency:** You must ensure the `game_sessions` table has a `client_generated_id` UUID column with a `UNIQUE` constraint to handle offline retry duplicates safely.
**Storage:** Create a bucket named `reminiscence`. Make it private. Provide signed URL logic in FastAPI.
**Secrets:** You provide the anon key to the frontend teams. You KEEP the service_role key secret.

## 9 OWNED FOLDERS
`apps/backend/`
`packages/db-schema/`
`.github/workflows/`

## 10 RESTRICTED FOLDERS
`apps/elderly-app/`
`apps/caregiver-dashboard/`

## 11 TASK ROADMAP
As of 2026-08-30 on `feature/sih-2026`. Anirudh covered T0/T1 backend so the demo could boot. You still own `apps/backend/`. Review first, then ship the missing domain APIs. See `docs/05-project-management/NEXT_PLAN.md`.

| TASK ID | TASK NAME | DEPENDENCY | STATUS |
|---------|-----------|------------|--------|
| T0-INF-001 | Scaffold Monorepo Structure | None | DONE (Anirudh covering; you review) |
| T0-INF-002 | Hosted Supabase / production Postgres | T0-INF-001 | NOT_STARTED (local Docker only) |
| T1-BE-002 | Database Schema & Alembic | T0-INF-001 | DONE (Anirudh covering; you review) |
| T1-BE-003 | JWT Auth APIs | T1-BE-002 | DONE (Anirudh covering; you review) |
| T1-BE-004 | RBAC pass on remaining routes | T1-BE-003 | PARTIAL (`verify_user_access` on games/analytics) |
| T1-BE-005 | Game Session API | T1-BE-003 | DONE (Anirudh covering; you review) |
| T1-BE-007 | Reminders API | T1-BE-003 | NOT_STARTED (your next product API) |
| T1-BE-008 | Memory upload API | T1-BE-003 | NOT_STARTED |

## 12 BRANCH SETUP
```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b feature/T0-INF-001-scaffold
git branch --show-current
git status
```

## 13 CHECKPOINTS
- CP-01 Environment verified
- CP-03 Repository inspected
- CP-06 Implementation complete
- CP-07 Tests added
- CP-08 Tests passing
- CP-12 Git diff reviewed
- CP-15 PR created
- CP-18 Merged

## 14 FAILURE HANDLING
**Migration fails:** Run `alembic downgrade -1`, fix models, generate new revision.
**Merge conflict:** Pull main into feature branch, resolve manually in IDE.
**Decision required:** Halt and ask team.

## 15 AI PROMPTS
```text
NAME: Harshit Divekar
TEAM: TEAM 1
START MY WORK
```

## 16 TESTING
`pytest apps/backend/app/tests/`

## 17 COMMIT
`feat(backend): implement JWT auth endpoints`

## 18 PR
Title: `feat: Backend scaffolding (T0-INF-001)`
Reviewer: Anirudh

## 19 HANDOFF
Provide the `SUPABASE_URL` and `ANON_KEY` to Parth and Anirudh securely.

## 20 RECOVERY
Accidental commit to main? `git reset --hard HEAD~1`, checkout branch, cherry-pick.

## 21 DEFINITION OF DONE
CI passes, Alembic head is clean, endpoints return 200/401 correctly.

## 22 FIRST TASK

**Foundation exists (Anirudh, 2026-08-31):** Reminders, memories, sync batch, RBAC helpers, pytest. See `PROJECT_STATUS_AND_PLAN.md` §2.

**Now:** T0-INF-002 hosted Postgres. RBAC integration tests. Production deploy. See master doc §9.
