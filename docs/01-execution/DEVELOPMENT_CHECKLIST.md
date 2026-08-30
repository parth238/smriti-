# SMRITI DEVELOPMENT CHECKLIST

Tracking document for Smriti MVP tasks. Snapshot 2026-08-30. Stack is on `main` via PR 5. Rehan T2-AI PRs 6-8 are also on `main`. Living docs / NEXT_PLAN: PR 9 on `feature/sih-2026`.

**PARTIAL work is listed as unchecked** with a note of what exists. Do not treat covering as the owner's sign-off. Ports: elderly 5173, caregiver desk 5174, API 8000. STT is not MVP (Phase 2 Web Speech, Phase 3 Bhashini). Phase plan: `docs/05-project-management/NEXT_PLAN.md`.

## Repository & Infrastructure
- [x] `T0-INF-001` Scaffold monorepo structure (Owner: Harshit, implemented by Anirudh covering)
- [ ] `T0-INF-002` Initialize hosted Supabase / production Postgres (Owner: Harshit). Local Docker Postgres is running. This is not production.
- [x] `T0-INF-003` Configure CI linting/tests (Owner: Harshit, implemented by Anirudh covering)

## Backend (Team 1)
- [x] `T1-BE-001` Initialize FastAPI application (Owner: Harshit)
- [x] `T1-BE-002` Setup Alembic and DB Models (Owner: Harshit, implemented by Anirudh covering). Harshit must review.
- [x] `T1-BE-003` Implement JWT Authentication (Owner: Harshit, implemented by Anirudh covering). Caregiver + elderly PIN, refresh, rate limit. Harshit must review.
- [ ] `T1-BE-004` Role-Based Access Control (Owner: Harshit). PARTIAL: `verify_user_access` on games/analytics. Remaining routes need the same pass.
- [x] `T1-BE-005` Game Session API (Owner: Harshit, implemented by Anirudh covering). Idempotent POST, list, next-difficulty.
- [ ] `T1-BE-006` Sync batch API (Owner: Harshit / Ananya). Not built. Client flushes one `POST /game-sessions` at a time.
- [ ] `T1-BE-007` Reminders API (Owner: Harshit). Table exists. No CRUD routes. Blocks the caregiver reminder UI.
- [ ] `T1-BE-008` Memory / reminiscence API (Owner: Harshit). Table exists. No upload routes.

## Elderly App Shell (Team 1)
- [x] `T1-FE-001` Scaffold Vite PWA App (Owner: Anirudh). Port 5173, Workbox plugin, splash companion.
- [x] `T1-FE-002` Elderly PIN login and home (Owner: Anirudh). Honest offline: unpaired devices do not fake success.
- [ ] `T1-FE-003` Four core games at demo quality (Owner: Anirudh). PARTIAL: all four play and persist. Memory Match and Attention are deepened. Sequencing and Naming need visual craft.
- [x] `T1-FE-004` Game hub navigation (Owner: Anirudh)
- [x] `T1-FE-005` Attention game MVP (Owner: Anirudh)

## Intelligence & Analytics (Team 2)
- [x] `T2-AI-001` Adaptive difficulty engine (Owner: Rehan). DONE on `main` (PR 7). Rule-based staircase + `get_difficulty_summary` + tests. Anirudh covered the start. Not ML.
- [x] `T2-AI-002` Analytics engine and baseline (Owner: Rehan). DONE on `main` (PR 8). 14-day personal baseline including accuracy, reaction, errors, hints, duration, completion.
- [x] `T2-AI-003` Analytics API endpoints (Owner: Rehan). DONE on `main` (PR 6). Period, baseline, trend, optional `game_type`. Dashboard copy review and KT-AI still open.

## Caregiver Dashboard (Team 2)
- [x] `T2-FE-001` Scaffold Caregiver Dashboard Vite App (Owner: Parth, implemented by Anirudh covering for SIH demo). Port 5174, sidebar, Inter, Recharts. Parth takes over.
- [ ] `T2-FE-002` Caregiver login (Owner: Parth). PARTIAL: API login exists. Unreachable API opens labeled demo. No register UI.
- [ ] `T2-FE-003` Patient overview (Owner: Parth). PARTIAL: live API + labeled demo fallback. No multi-patient switcher.
- [ ] `T2-FE-004` Analytics charts (Owner: Parth). PARTIAL: Recharts vs personal baseline. Polish still open.
- [ ] `T2-FE-005` Reminder and memory management UI (Owner: Parth). Demo data only. Blocked on T1-BE-007/008.
- [ ] `T2-FE-006` Alerts UI feed (Owner: Parth). Demo missed-reminder copy only.

## Offline Sync & Persistence (Team 3)
- [ ] `T3-OS-001` Dexie and IndexedDB schema (Owner: Ananya). PARTIAL: sessions, outbox, reminders cache, paired (Anirudh covering). Extend. Do not rewrite.
- [ ] `T3-OS-002` Optimistic game writes and outbox (Owner: Ananya). PARTIAL: `game_session` only.
- [ ] `T3-OS-003` Workbox and service worker (Owner: Ananya). PARTIAL: `vite-plugin-pwa`. Polish still open. Install prompt is Phase 2 (doc 03).
- [ ] `T3-OS-004` Background sync engine (Owner: Ananya). NOT STARTED. Current path is `online` event flush.
- [ ] `T3-OS-005` i18n localization pipeline (Owner: Ananya). PARTIAL: elderly `en.json` / `as.json` exist. Pipeline ownership still Ananya's.

## Design System & Content (Team 3)
- [ ] `T3-DS-001` Tailwind design tokens (Owner: Srujna). PARTIAL: palette in both apps. `packages/ui` does not exist.
- [ ] `T3-DS-002` Accessible UI components (Owner: Srujna). PARTIAL: elderly LargeButton and 56px targets. Not shared.
- [ ] `T3-DS-003` Assamese cultural content pack (Owner: Srujna). PARTIAL: JSON Assam + Hornbill (Anirudh covering). Verify. No generic AI stock.
- [ ] `T3-DS-004` i18n strings on all UI views (Owner: Srujna). PARTIAL: elderly yes. Dashboard still English.

## Integration Checkpoints
- [x] `I-001` Repository builds (CI on PRs to `main`)
- [ ] `I-002` Backend connects to hosted Supabase
- [ ] `I-003` Elderly app authenticates via API (works locally when API is up; not a hosted demo yet)
- [ ] `I-004` Dashboard authenticates via API (same; labeled demo fallback if down)
- [ ] `I-005` Offline game writes to Dexie (PARTIAL: games yes)
- [ ] `I-006` Offline outbox syncs to backend (PARTIAL: game sessions only)
- [ ] `I-007` Analytics engine processes synced sessions (PARTIAL)
- [ ] `I-008` Dashboard displays accurate synced data (PARTIAL: live + labeled demo)
- [x] `I-009` Assamese localization switch works on the elderly app
- [ ] `I-010` Full SIH MVP demo run (needs seed accounts + reminder/memory APIs)

## Explicitly later (do not check off here)
- Voice / STT / TTS via Web Speech API: Tier 2 (`docs/00-source-of-truth/03-features.md`).
- Assamese ASR via Bhashini / AI4Bharat: Tier 3.
- KT (knowledge transfer) sessions: process, not a product checkbox. See NEXT_PLAN Phase 2.
- RL, clinician portal, geofencing, 8-state packs: Phase 3.
