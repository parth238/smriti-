# MASTER DEVELOPMENT CHECKLIST

Definitive MVP task board as of 2026-08-30. **PARTIAL is not DONE.** Covering = Anirudh landed a start in someone else's folder. Phase plan: `NEXT_PLAN.md`.

Status values: `DONE` | `PARTIAL` | `NOT_STARTED`

| Task ID | Owner | Status | Checkpoint | Expected result | Actual result | Notes |
|---------|-------|--------|------------|-----------------|---------------|-------|
| T0-INF-001 | Harshit | DONE | CP-15 | Repo scaffolded | Folders, Docker Postgres, version pin | Anirudh covering. Harshit still owns infra. |
| T0-INF-002 | Harshit | NOT_STARTED | CP-00 | Hosted Postgres/Supabase | Local Docker only | Required before a public demo URL. |
| T0-INF-003 | Harshit | DONE | CP-15 | CI lint/test/build | `.github/workflows/ci.yml` Node 20 / Python 3.11 | Anirudh covering. |
| T1-BE-001 | Harshit | DONE | CP-15 | FastAPI boots | `/health`, `/docs`, CORS | |
| T1-BE-002 | Harshit | DONE | CP-08 | Schema + Alembic | Models + 0001/0002 | Anirudh covering. Review required. |
| T1-BE-003 | Harshit | DONE | CP-08 | JWT caregiver + elderly PIN | Register, login, refresh, rate limit | Anirudh covering. Review required. |
| T1-BE-004 | Harshit | PARTIAL | CP-06 | RBAC on all patient routes | `verify_user_access` on games/analytics | Audit remaining routes. |
| T1-BE-005 | Harshit | DONE | CP-08 | Game session API | POST idempotent, list, next-difficulty | Anirudh covering. |
| T1-BE-006 | Harshit / Ananya | NOT_STARTED | CP-00 | Sync batch API | Outbox posts one session at a time | Decide: batch route vs keep POST as MVP. |
| T1-BE-007 | Harshit | NOT_STARTED | CP-00 | Reminders API | `reminders` table only | Blocks Parth T2-FE-005 and elderly mark-done sync. |
| T1-BE-008 | Harshit | NOT_STARTED | CP-00 | Memory upload API | `memory_items` table only | Blocks family photos. |
| T1-FE-001 | Anirudh | DONE | CP-15 | Vite PWA on 5173 | Splash, routes, PWA plugin | |
| T1-FE-002 | Anirudh | DONE | CP-08 | PIN login + home | Companion sit, honest offline PIN | Caregiver-create-elderly UI is still missing (dashboard). |
| T1-FE-003 | Anirudh | PARTIAL | CP-06 | Four games demo-ready | All four persist. Match + Attention deepened | Sequencing / Naming need visual craft. |
| T1-FE-004 | Anirudh | DONE | CP-06 | Game hub | `/games` select | |
| T1-FE-005 | Anirudh | DONE | CP-06 | Attention game | Hook + bloom/difficulty | |
| T2-AI-001 | Rehan | DONE | CP-15 | Staircase engine | `adaptive_difficulty.py` + tests | Owned. Complete test coverage added. No ML. |
| T2-AI-002 | Rehan | DONE | CP-15 | Personal baseline analytics | Accuracy, reaction, errors, hints, duration vs baseline | Expanded to all metrics. Alerts added. |
| T2-AI-003 | Rehan | DONE | CP-15 | Analytics HTTP | 7d, baseline, trend | Game type filtering and full JSON contract stable. |
| T2-FE-001 | Parth | DONE | CP-06 | Dashboard on 5174 | Sidebar, Inter, Recharts | Anirudh covering for demo. Parth takes over. |
| T2-FE-002 | Parth | PARTIAL | CP-06 | Caregiver login | Hits API; labeled demo if down | No register UI. |
| T2-FE-003 | Parth | PARTIAL | CP-06 | Patient overview | Live + labeled demo fallback | No patient switcher. |
| T2-FE-004 | Parth | PARTIAL | CP-06 | Charts | Recharts vs personal baseline | Polish still Parth's. |
| T2-FE-005 | Parth | NOT_STARTED | CP-00 | Reminder + memory mgmt | Demo lists only | Blocked on T1-BE-007/008. |
| T2-FE-006 | Parth | NOT_STARTED | CP-00 | Alerts feed | Demo missed-reminder notice | Not live. |
| T3-OS-001 | Ananya | PARTIAL | CP-06 | Dexie schema | sessions, outbox, reminders cache, paired | Extend. Do not rewrite. |
| T3-OS-002 | Ananya | PARTIAL | CP-06 | Outbox writes | `game_session` only | Reminders/memories not in outbox. |
| T3-OS-003 | Ananya | PARTIAL | CP-06 | Workbox SW | `vite-plugin-pwa` | Polish + install prompt is Phase 2. |
| T3-OS-004 | Ananya | NOT_STARTED | CP-00 | Background sync engine | `online` event flush only | |
| T3-OS-005 | Ananya | PARTIAL | CP-06 | i18n pipeline | `en.json` / `as.json` in elderly app | Ownership + missing-key tests still open. |
| T3-DS-001 | Srujna | PARTIAL | CP-01 | Shared tokens | Colors in both Tailwind configs | `packages/ui` missing. |
| T3-DS-002 | Srujna | PARTIAL | CP-01 | Accessible components | LargeButton etc. in elderly-app | Not a shared package. |
| T3-DS-003 | Srujna | PARTIAL | CP-01 | Assamese cultural pack | JSON Assam + Hornbill | Verify. No generic AI stock. |
| T3-DS-004 | Srujna | PARTIAL | CP-01 | i18n on views | Elderly yes. Dashboard English | |

## Integration (see also INTEGRATION_CHECKLIST.md)

| ID | Status | Notes |
|----|--------|-------|
| I-001 | DONE | CI builds backend + both frontends on `main` PRs |
| I-002 | NOT_STARTED | No hosted Supabase. Local Docker Postgres |
| I-003 | PARTIAL | Elderly PIN works when API is up. No fake unpaired success |
| I-004 | PARTIAL | Dashboard login works. Offline opens labeled demo |
| I-005 | PARTIAL | Games write Dexie |
| I-006 | PARTIAL | Outbox → POST /game-sessions. No batch route |
| I-007 | PARTIAL | Analytics engine on synced sessions |
| I-008 | PARTIAL | Dashboard live charts with demo fallback |
| I-009 | DONE | Elderly Assamese / English toggle |
| I-010 | NOT_STARTED | Full judge run needs seed accounts + reminder/memory APIs |
