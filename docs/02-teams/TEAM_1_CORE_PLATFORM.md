# TEAM 1 — CORE PLATFORM EXECUTION MANUAL

## 1. TEAM MISSION
Build the robust backend foundation (PostgreSQL + FastAPI + Auth), establish the API contracts, and scaffold the Elderly PWA interface so that all other teams can integrate their features.

## 2. MEMBERS
- Harshit Divekar (Lead)
- Anirudh P.S Yadav

## 3. ROLES
- **Harshit:** Backend architecture, Database, FastAPI Auth, API routes, Infrastructure.
- **Anirudh:** Elderly UI Developer, Games, Routing.

## 4. OWNERSHIP
- **PostgreSQL Database:** Team 1 (Harshit)
- **FastAPI Core & Auth:** Team 1 (Harshit)
- **Elderly React App Shell:** Team 1 (Anirudh)

## 5. FOLDER OWNERSHIP
- `apps/backend/app/models/`
- `apps/backend/app/api/`
- `apps/backend/app/core/`
- `apps/elderly-app/`
- `packages/shared-types/`

## 6. FILE OWNERSHIP
- `alembic.ini`
- `apps/backend/main.py`
- `apps/elderly-app/src/main.tsx`

## 7. INFRASTRUCTURE OWNERSHIP
- **Supabase Database:** Harshit
- **FastAPI API Deployment:** Harshit
- **Elderly Vercel Hosting:** Anirudh

## 8. DEPENDENCIES
- Team 1 depends on Team 3 for Design Tokens to style the Elderly App.
- Team 1 depends on Team 2 for the Adaptive Difficulty Engine python function.

## 9. SETUP REQUIREMENTS
- **Node.js (v20):** For running the Elderly React App.
- **Python (3.11):** For running the FastAPI backend.
- **uv:** For Python package management.
- **Supabase Local:** Docker setup for running Postgres locally.

## 10. TASK ROADMAP
- Scaffold Monorepo Structure
- Database Schema & Alembic
- JWT Auth APIs & Security Deps
- Core Backend CRUD APIs
- Elderly App Scaffold & Routing
- Elderly App Auth & Home UI
- 4 Core Games UI & Logic
- Online Game Session API Wiring
- Reminder Sync & Alerts Job

## 11. TASK IDS
- `T0-INF-001`, `T1-BE-002`, `T1-BE-003`, `T1-BE-004`, `T1-FE-001`, `T1-FE-002`, `T1-FE-003`, `T1-FE-004`, `T1-BE-005`

## 12. IMPLEMENTATION ORDER
1. Monorepo Scaffold (T0-INF-001)
2. Database Schema (T1-BE-002)
3. API Auth (T1-BE-003)
4. Elderly Scaffold (T1-FE-001)
5. Elderly Auth (T1-FE-002)
6. Game UI (T1-FE-003) & Session API (T1-FE-004)

## 13. CHECKPOINTS
Every task requires CP-01 (Environment Verification) through CP-18 (Merged). See specific member manual for exact checkpoint tracking.

## 14. TESTING
- `pytest` for all FastAPI routes and DB models.
- `vitest` for React game logic.

## 15. GIT WORKFLOW
- Sync `main` daily.
- Branches must isolate frontend vs backend concerns where possible to simplify PR review.

## 16. BRANCH WORKFLOW
```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b feature/<task-id>-<short-description>
```

## 17. PR WORKFLOW
- Harshit reviews Anirudh's PWA routing.
- Anirudh reviews Harshit's API payloads to ensure they are consumable.
- Tag Team 2/3 if an API contract changes.

## 18. HANDOFFS
Provide Postman collections or cURL scripts for newly created API endpoints to Team 2 and Team 3.

## 19. BLOCKERS
If Team 3 is delayed on tokens, use standard unstyled HTML elements until tokens are available.

## 20. DEFINITION OF DONE
DB migrations execute cleanly. API returns 200 OK. Frontend correctly handles 401/403 auth errors.

## 21. AI PROMPTS
```text
NAME: [Harshit/Anirudh]
TEAM: TEAM 1
START MY WORK
```

## 22. FINAL TEAM CHECKLIST
- [ ] Database Schema deployed and Alembic migrations clean.
- [ ] JWT Auth implemented and tested.
- [ ] Elderly PWA Scaffold running.
- [ ] 4 Core Games playable online.
