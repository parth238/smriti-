# INDIVIDUAL EXECUTION MANUAL: ANIRUDH P.S YADAV

## 1 IDENTITY
**Name:** Anirudh P.S Yadav
**Team:** TEAM 1 (Core Platform)
**Role:** Elderly UI Developer
**Backup role:** React Components Lead

## 2 PROJECT CONTEXT
**What Smriti is:** An offline-first digital therapeutic and caregiver dashboard for elderly dementia patients in North-East India.
**MVP Scope:** 4 rule-based games, offline sync, reminders, and Assamese language support.
**Your responsibility:** You are building the actual patient-facing application. The UI must be incredibly accessible, highly responsive, and capable of rendering the cognitive games.

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
git config --global user.name "Anirudh P.S Yadav"
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
cd apps/elderly-app
npm install
npm run dev
```

## 6 ENVIRONMENT VARIABLES
**VITE_API_BASE_URL:** URL of the FastAPI backend. (NON-SECRET, FRONTEND, LOCAL/PROD). Owner: Harshit provides the production URL.

## 7 EXTERNAL SERVICES
**Vercel:** You own the deployment of `apps/elderly-app/`.
**GitHub:** Required for CI/CD.

## 8 SUPABASE (DETAILED GUIDE)
**SUPABASE IS NOT MY RESPONSIBILITY.**
You do not manage, create, or administrate the database.
You require the `VITE_API_BASE_URL` from Harshit to connect to the FastAPI backend, which handles database reads/writes for you. You must NEVER modify the backend database schema.

## 9 OWNED FOLDERS
`apps/elderly-app/`
`packages/ui/` (Shared with Srujna)

## 10 RESTRICTED FOLDERS
`apps/backend/`
`apps/caregiver-dashboard/`

## 11 TASK ROADMAP
As of 2026-08-30. You also covered other teams' folders for the SIH demo. That covering is documented in TEAM_STATUS. Your own next work is elderly polish. Stop covering unless a Phase 1 blocker has no owner.

| TASK ID | TASK NAME | DEPENDENCY | STATUS |
|---------|-----------|------------|--------|
| T1-FE-001 | Scaffold Vite PWA App | T0-INF-001 | DONE (5173, splash, Workbox plugin) |
| T1-FE-002 | Elderly App Auth & Home UI | T1-BE-003, T1-FE-001 | DONE (honest unpaired PIN) |
| T1-FE-003 | 4 Core Games UI & Logic | T1-FE-001 | PARTIAL (Match + Attention deep; Sequencing/Naming persist, less craft) |
| T1-FE-004 | Game hub | T1-FE-001 | DONE |
| T1-FE-005 | Attention game | T1-FE-001 | DONE |

## 12 BRANCH SETUP
```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b feature/T1-FE-001-scaffold
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
**Vite build fails:** Check for missing TypeScript interfaces in `packages/shared-types`.
**Merge conflict:** Pull main into feature branch, resolve manually in IDE.
**Decision required:** Halt and ask team.

## 15 AI PROMPTS
```text
NAME: Anirudh P.S Yadav
TEAM: TEAM 1
START MY WORK
```

## 16 TESTING
`npm run test` (Vitest for component logic).

## 17 COMMIT
`feat(elderly): implement memory matching game UI`

## 18 PR
Title: `feat: Elderly App Scaffold (T1-FE-001)`
Reviewer: Harshit

## 19 HANDOFF
Provide the deployed Vercel URL to the rest of the team. Notify Ananya when the shell is ready for the Service Worker.

## 20 RECOVERY
Accidental commit to main? `git reset --hard HEAD~1`, checkout branch, cherry-pick.

## 21 DEFINITION OF DONE
Vite builds without TS errors. All touch targets are >= 48px. App shell renders successfully.

## 22 FIRST TASK
**Now:** Phase 1 elderly polish. Sequencing and Naming visual craft. Keep i18n complete. Protect the judge path (splash → PIN → one game → caregiver chart). PWA install prompt is Phase 2. Voice/STT is Phase 2 (Web Speech) / Phase 3 (Bhashini). Run KT sessions so owners can take their folders.
