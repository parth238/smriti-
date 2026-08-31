# INDIVIDUAL EXECUTION MANUAL: ANANYA

## 1 IDENTITY
**Name:** Ananya
**Team:** TEAM 3 (Offline, Content & Design System)
**Role:** Offline Sync & Resilience Engineer
**Backup role:** Backend Sync API Co-Owner

## 2 PROJECT CONTEXT
**What Smriti is:** An offline-first digital therapeutic and caregiver dashboard for elderly dementia patients in North-East India.
**MVP Scope:** 4 rule-based games, offline sync, reminders, and Assamese language support.
**Your responsibility:** You make the app work without the internet. You will implement the Dexie/IndexedDB local storage, the background Service Worker (Workbox), the optimistic UI updates, and the `client_generated_id` idempotency logic to safely batch-sync data when connection is restored.

## 3 COMPUTER SETUP
**OS:** Windows/macOS/Linux.
**Git:** Install Git CLI.
**Node:** Install Node.js v20 LTS. `node --version` to verify.
**Package manager:** Install `npm` or `pnpm`.
**IDE:** Cursor or Antigravity.
**Failure Fix:** If Service Worker caching fails locally, ensure you are testing over `localhost` or HTTPS, as Service Workers are restricted on HTTP.

## 4 GITHUB SETUP
**GitHub account:** Required.
**Repository access:** Ensure write access to `https://github.com/Rehan-2024/smriti-`.
**Identity:**
```bash
git config --global user.name "Ananya"
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
None required explicitly for Dexie, but you share the frontend env variables with Anirudh.

## 7 EXTERNAL SERVICES
**GitHub:** Required for CI/CD.

## 8 SUPABASE (DETAILED GUIDE)
**SUPABASE IS NOT MY RESPONSIBILITY.**
You do not manage, create, or administrate the database infrastructure.
You map the backend API contracts (provided by Harshit) into your local Dexie Schema. You must NEVER modify the backend Postgres schema. Your `sync_outbox` pushes JSON to Harshit's FastAPI endpoint.

## 9 OWNED FOLDERS
`apps/elderly-app/src/db/`
`apps/elderly-app/public/`

## 10 RESTRICTED FOLDERS
`apps/caregiver-dashboard/`

## 11 TASK ROADMAP
As of 2026-08-30. Anirudh started Dexie, outbox, and `vite-plugin-pwa` so offline play could persist. Do not rewrite that start. Extend it. See NEXT_PLAN Phase 1.

| TASK ID | TASK NAME | DEPENDENCY | STATUS |
|---------|-----------|------------|--------|
| T3-OS-001 | Initialize Dexie & IndexedDB Schema | T0-INF-001 | PARTIAL (sessions, outbox, reminders cache, paired) |
| T3-OS-002 | Optimistic writes & outbox | T3-OS-001 | PARTIAL (`game_session` only) |
| T3-OS-003 | Workbox & service worker | T3-OS-001 | PARTIAL (`vite-plugin-pwa`; polish yours) |
| T3-OS-004 | Background sync engine | T3-OS-003 | NOT_STARTED (`online` event flush only) |
| T3-OS-005 | i18n pipeline ownership | T1-FE-001 | PARTIAL (`en.json` / `as.json` exist; pipeline still yours) |

## 12 BRANCH SETUP
```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b feature/T3-OS-001-dexie-schema
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
**Service Worker loops:** Use "Update on reload" in Chrome DevTools or unregister the SW manually.
**Merge conflict:** Pull main into feature branch, resolve manually in IDE.
**Decision required:** Halt and ask team.

## 15 AI PROMPTS
```text
NAME: Ananya
TEAM: TEAM 3
START MY WORK
```

## 16 TESTING
Chrome DevTools -> Application -> Service Workers (Offline mode). Verify Dexie tables populate when offline.

## 17 COMMIT
`feat(sync): implement Dexie outbox schema`

## 18 PR
Title: `feat: Dexie Schema (T3-OS-001)`
Reviewer: Srujna

## 19 HANDOFF
Once the Service Worker is caching assets, notify Anirudh so he can verify the games load entirely offline.

## 20 RECOVERY
Accidental commit to main? `git reset --hard HEAD~1`, checkout branch, cherry-pick.

## 21 DEFINITION OF DONE
App boots with no network. Games write to Dexie. Connection restore flushes Dexie to backend without generating duplicate rows.

## 22 OFFLINE FAQ (READ FIRST)
**Canonical Dexie vs localStorage answers:** [`docs/05-project-management/ANANYA_OFFLINE_FAQ.md`](../05-project-management/ANANYA_OFFLINE_FAQ.md)  
Reminders belong in Dexie only — not `localStorage`. Auth tokens in web storage are intentional.

## 23 FIRST TASK

**Foundation (2026-08-31):** Dexie schema, outbox, Workbox precache of game PNGs (Anirudh wired). See `CONTRIBUTION_LEDGER.md`.

**Now:** Background Sync tag or document online-flush MVP. Local reminder notifications on elderly PWA. Harden reconnect pull for reminders + memory items. E2E offline → online test.
