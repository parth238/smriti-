# SMRITI DEVELOPMENT CHECKLIST

Tracking document for Smriti MVP tasks. Snapshot 2026-08-31. Branch `feature/phase1-close-gaps` PR #10.

**PARTIAL work is listed as unchecked** with a note of what exists. Ports: elderly 5173, caregiver desk 5174, API 8000. Plan: `docs/05-project-management/NEXT_PLAN.md`.

**Honest completion:** ~18% PDF vision · ~48% Tier 1 scaffold.

## Repository & Infrastructure
- [x] `T0-INF-001` Scaffold monorepo structure (Owner: Harshit, implemented by Anirudh covering)
- [ ] `T0-INF-002` Initialize hosted Supabase / production Postgres (Owner: Harshit)
- [x] `T0-INF-003` Configure CI linting/tests (Owner: Harshit, implemented by Anirudh covering)

## Backend (Team 1)
- [x] `T1-BE-001` Initialize FastAPI application (Owner: Harshit)
- [x] `T1-BE-002` Setup Alembic and DB Models (Owner: Harshit, implemented by Anirudh covering)
- [x] `T1-BE-003` Implement JWT Authentication (Owner: Harshit, implemented by Anirudh covering)
- [ ] `T1-BE-004` Role-Based Access Control (Owner: Harshit). PARTIAL: route guards exist; integration tests open.
- [x] `T1-BE-005` Game Session API (Owner: Harshit, implemented by Anirudh covering)
- [x] `T1-BE-006` Sync batch API (Owner: Harshit / Ananya). POST /sync/batch + client fallback.
- [x] `T1-BE-007` Reminders API (Owner: Harshit). CRUD + elderly acknowledge.
- [x] `T1-BE-008` Memory / reminiscence API (Owner: Harshit). Multipart upload + cultural JSON.

## Elderly App Shell (Team 1)
- [x] `T1-FE-001` Scaffold Vite PWA App (Owner: Anirudh). Port 5173, Workbox, hill splash.
- [x] `T1-FE-002` Elderly PIN login and home (Owner: Anirudh). Honest offline pairing.
- [ ] `T1-FE-003` Four core games at demo quality (Owner: Anirudh → Srujna polish). PARTIAL: reference sprites wired 2026-08-31; community playtest open.
- [x] `T1-FE-004` Game hub navigation (Owner: Anirudh)
- [x] `T1-FE-005` Attention game MVP (Owner: Anirudh). Reference tap-target sprites.

## Intelligence & Analytics (Team 2)
- [x] `T2-AI-001` Adaptive difficulty engine (Owner: Rehan). DONE on main.
- [x] `T2-AI-002` Analytics engine and baseline (Owner: Rehan). DONE on main.
- [x] `T2-AI-003` Analytics API endpoints (Owner: Rehan). DONE on main. Copy audit still open.

## Caregiver Dashboard (Team 2)
- [x] `T2-FE-001` Scaffold Caregiver Dashboard Vite App (Owner: Parth, implemented by Anirudh covering)
- [ ] `T2-FE-002` Caregiver login (Owner: Parth). PARTIAL: API login + labeled demo.
- [ ] `T2-FE-003` Patient overview (Owner: Parth). PARTIAL: live + demo; alerts polish open.
- [ ] `T2-FE-004` Analytics charts (Owner: Parth). PARTIAL: Recharts vs baseline.
- [ ] `T2-FE-005` Reminder and memory management UI (Owner: Parth). PARTIAL: live API forms.
- [ ] `T2-FE-006` Alerts UI feed (Owner: Parth). NOT STARTED.

## Offline Sync & Persistence (Team 3)
- [ ] `T3-OS-001` Dexie and IndexedDB schema (Owner: Ananya). PARTIAL: sessions, outbox, reminders, memoryItems.
- [ ] `T3-OS-002` Optimistic game writes and outbox (Owner: Ananya). PARTIAL: game_session + reminder_ack.
- [ ] `T3-OS-003` Workbox and service worker (Owner: Ananya). PARTIAL: precaches content packs + game PNGs.
- [ ] `T3-OS-004` Background sync engine (Owner: Ananya). PARTIAL: online flush + 30s poll.
- [ ] `T3-OS-005` i18n localization pipeline (Owner: Ananya / Srujna). PARTIAL: en/as on elderly.

## Design System & Content (Team 3)
- [ ] `T3-DS-001` Tailwind design tokens (Owner: Srujna). PARTIAL: palette in both apps.
- [ ] `T3-DS-002` Accessible UI components (Owner: Srujna). PARTIAL: 56px targets on elderly.
- [ ] `T3-DS-003` Assamese cultural content pack (Owner: Srujna). PARTIAL: JSON + Bihu art; community review open.
- [ ] `T3-DS-004` i18n strings on all UI views (Owner: Srujna). PARTIAL: elderly yes; dashboard English.

## Integration Checkpoints
- [x] `I-001` Repository builds (CI on PRs to `main`)
- [ ] `I-002` Backend connects to hosted Supabase
- [ ] `I-003` Elderly app authenticates via API (works locally)
- [ ] `I-004` Dashboard authenticates via API (labeled demo fallback)
- [ ] `I-005` Offline game writes to Dexie (PARTIAL)
- [ ] `I-006` Offline outbox syncs to backend (PARTIAL)
- [ ] `I-007` Analytics engine processes synced sessions (PARTIAL)
- [ ] `I-008` Dashboard displays accurate synced data (PARTIAL)
- [x] `I-009` Assamese localization switch works on the elderly app
- [ ] `I-010` Full SIH MVP demo run (needs hosted Postgres + playtest)

## Explicitly later
- Voice / STT / TTS: Tier 2–3 (`docs/00-source-of-truth/03-features.md`).
- RL, clinician portal, geofencing, 8-state packs: Phase 3.
