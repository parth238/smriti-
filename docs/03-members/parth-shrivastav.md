# INDIVIDUAL EXECUTION MANUAL: PARTH SHRIVASTAV

## 1 IDENTITY
**Name:** Parth Shrivastav
**Team:** TEAM 2 (Intelligence & Dashboard)
**Role:** Caregiver Dashboard Developer
**Backup role:** Frontend Analytics Integrator

## 2 PROJECT CONTEXT
**What Smriti is:** An offline-first digital therapeutic and caregiver dashboard for elderly dementia patients in North-East India.
**MVP Scope:** 4 rule-based games, offline sync, reminders, and Assamese language support.
**Your responsibility:** You build the command center for the caregivers. You will scaffold the Caregiver React SPA, integrate the authentication, and render the analytics data computed by Rehan into reassuring, easy-to-read charts using Recharts.

## 3 COMPUTER SETUP
**OS:** Windows/macOS/Linux.
**Git:** Install Git CLI.
**Node:** Install Node.js v20 LTS. `node --version` to verify.
**Package manager:** Install `npm` or `pnpm`.
**IDE:** Cursor or Antigravity.
**Failure Fix:** If Vite fails to start, delete `node_modules` and run `npm install` again.

## 4 GITHUB SETUP
**GitHub account:** Required.
**Repository access:** Ensure write access to `https://github.com/Rehan-2024/smriti-`.
**Identity:**
```bash
git config --global user.name "Parth Shrivastav"
git config --global user.email "[YOUR_EMAIL]"
```
**Auth:** `gh auth login`
**Clone:** `git clone https://github.com/Rehan-2024/smriti-`

## 5 REPOSITORY SETUP
```bash
cd smriti-
git remote -v
git fetch
git checkout main
# Setup Frontend Environment
cd apps/caregiver-dashboard
npm install
npm run dev
```

## 6 ENVIRONMENT VARIABLES
**VITE_API_BASE_URL:** URL of the FastAPI backend. (NON-SECRET, FRONTEND, LOCAL/PROD). Owner: Harshit provides the production URL.

## 7 EXTERNAL SERVICES
**Vercel:** You own the deployment of `apps/caregiver-dashboard/`.
**GitHub:** Required for CI/CD.

## 8 SUPABASE (DETAILED GUIDE)
**SUPABASE IS NOT MY RESPONSIBILITY.**
You do not manage, create, or administrate the database.
You require the `VITE_API_BASE_URL` from Harshit to connect to the FastAPI backend, which handles database reads/writes for you. You must NEVER modify the backend database schema.

## 9 OWNED FOLDERS
`apps/caregiver-dashboard/`

## 10 RESTRICTED FOLDERS
`apps/backend/`
`apps/elderly-app/`

## 11 TASK ROADMAP
As of 2026-08-30. Anirudh scaffolded `apps/caregiver-dashboard/` for the demo. The dashboard is yours. Take it over. Do not throw away the labeled live/demo split. See NEXT_PLAN Phase 1.

| TASK ID | TASK NAME | DEPENDENCY | STATUS |
|---------|-----------|------------|--------|
| T2-FE-001 | Scaffold Caregiver Dashboard | T0-INF-001 | DONE (Anirudh covering; you take over 5174) |
| T2-FE-002 | Caregiver Dashboard Auth UI | T1-BE-003, T2-FE-001 | PARTIAL (API login; labeled demo if API down; no register UI) |
| T2-FE-003 | Patient overview | T2-AI-003, T2-FE-001 | PARTIAL (live + labeled demo; no patient switcher) |
| T2-FE-004 | Analytics charts | T2-AI-003 | PARTIAL (Recharts vs personal baseline; polish yours) |
| T2-FE-005 | Reminder & memory management | T1-BE-007, T1-BE-008 | NOT_STARTED (demo.ts only; blocked on APIs) |
| T2-FE-006 | Alerts feed | T2-FE-005 | NOT_STARTED (demo missed-reminder copy) |

## 12 BRANCH SETUP
```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b feature/T2-FE-001-dashboard-scaffold
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
**Recharts rendering issues:** Verify the API payload matches the expected JSON array structure.
**Merge conflict:** Pull main into feature branch, resolve manually in IDE.
**Decision required:** Halt and ask team.

## 15 AI PROMPTS
```text
NAME: Parth Shrivastav
TEAM: TEAM 2
START MY WORK
```

## 16 TESTING
`npm run test` (Vitest for component logic).

## 17 COMMIT
`feat(dashboard): implement patient overview table`

## 18 PR
Title: `feat: Dashboard Scaffold (T2-FE-001)`
Reviewer: Mohd Rehan

## 19 HANDOFF
Provide the deployed Vercel URL to the rest of the team. Coordinate with Rehan on the analytics JSON payload shapes.

## 20 RECOVERY
Accidental commit to main? `git reset --hard HEAD~1`, checkout branch, cherry-pick.

## 21 DEFINITION OF DONE
Vite builds without TS errors. Dashboard can log in, select a patient, view session history, view analytics charts, and set a reminder.

## 22 FIRST TASK
**Now:** Own `apps/caregiver-dashboard/`. Chart polish and copy with no diagnostic claims. When Harshit lands T1-BE-007/008, replace Reminders/Memories/Alerts demo data with API calls. Schedule KT-DASH with Anirudh.
