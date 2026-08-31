# TEAM STATUS BOARD

**Snapshot:** 2026-08-31. Sprint on `feature/sih-2026`. PDF not found on disk; used `docs/00-source-of-truth/00-problem-statement-and-context.md`.

**Honest MVP completion:** ~72% of Tier 1 tasks (18 DONE, 11 PARTIAL, 1 NOT_STARTED out of 30 tracked tasks).

**Ports:** elderly PWA `5173`, caregiver desk `5174`, API `8000`.

**Plan:** `docs/05-project-management/NEXT_PLAN.md`

## What landed today (2026-08-31)

- **Backend (Harshit slice, Anirudh covering):** Reminders CRUD + acknowledge, memory multipart upload + cultural-pack JSON, `POST /sync/batch` + `GET /sync/status`, RBAC helpers on new routes. 37 pytest pass.
- **Elderly (Anirudh):** Sequencing + Naming use adaptive hooks, 200-300ms transitions, reduced-motion safe. Reminders screen hits API with Dexie cache + offline ack outbox. Home next-reminder from API.
- **Dashboard (Parth slice, Anirudh covering):** Reminders/Memories pages wired to live API with labeled demo fallback, create reminder + upload photo forms.
- **Offline (Ananya slice, Anirudh covering):** Outbox supports `reminder_ack`, batch sync consumer, retry poll.
- **Judge demo:** `scripts/seed_judge_demo.py` seeds linked accounts + sessions + family photo.
- **Elderly memories:** Family photos gallery reads live API on `/memories/personal`.

## Current board

| Member | Task | Status | Notes |
|--------|------|--------|-------|
| Harshit | T1-BE-007/008/006 | DONE | Review + prod Postgres (T0-INF-002) still his |
| Harshit | T1-BE-004 | PARTIAL | Route-level RBAC deny tests missing |
| Anirudh | T1-FE-003 | PARTIAL | Games deeper; splash/companion polish remains |
| Parth | T2-FE-005 | PARTIAL | Live CRUD wired; patient switcher + edit UI his |
| Rehan | T2-AI-001/2/3 | DONE | KT-AI + dashboard copy review |
| Ananya | T3-OS-004 | PARTIAL | No Workbox Background Sync tag yet |
| Srujna | T3-DS-001/003 | PARTIAL | Community asset verification open |

## Still not full product

- Hosted Supabase / multi-patient switcher UI
- Assamese playtest with a real elder
- Workbox Background Sync API (optional; online flush works)
- Voice / Bhashini (Tier 3, not MVP)
