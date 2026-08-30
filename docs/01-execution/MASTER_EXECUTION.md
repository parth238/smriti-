# MASTER EXECUTION PLAN — SMRITI / SIH26003

**Current phase (2026-08-30):** Phase 1, close the honesty loop. Living plan: `docs/05-project-management/NEXT_PLAN.md`. Status board: `docs/05-project-management/TEAM_STATUS.md`.

Anirudh P.S Yadav covered Harshit backend/infra and scaffolded other slices on `feature/sih-2026` so the play-to-dashboard loop exists. Owners did not change. Covering is not a handoff.

## 1. Project Overview
Smriti is an offline-first cognitive gaming, memory-assistance, reminiscence, and caregiver-monitoring platform for elderly dementia patients in North-East India (NER). It provides culturally familiar digital therapeutics without requiring constant internet access.

## 2. MVP Scope
The MVP strictly focuses on 4 rule-based games, local Assamese/English support, offline sync, reminiscence gallery, and essential caregiver monitoring. No clinical diagnostic tools or population normative comparisons are included.

## 3. Tier 1/2/3 Boundary
- **Tier 1 (MUST BUILD):** Assamese/English toggle, 4 Cognitive Games, rule-based adaptive difficulty (staircase), Reminders, Reminiscence Gallery, Offline-first IndexedDB sync, Caregiver Dashboard, JWT Auth.
- **Tier 2 (STRETCH):** Voice/STT/TTS demo via Web Speech API (English/Hindi, "When is my medicine?"), caregiver email alerts, Manipuri language pack as architecture proof, PWA install prompt.
- **Tier 3 (DO NOT BUILD):** Real-time multiplayer, RL/ML decline detection, Geofencing, Bhashini / AI4Bharat Assamese ASR-TTS, clinician portal.

## 4. Architecture Reference
- **Frontend:** React + Vite + TypeScript (PWA for Elderly, SPA for Dashboard).
- **Backend:** FastAPI + Python 3.11.
- **Database:** PostgreSQL (Supabase).
- **Offline Storage:** IndexedDB/Dexie + Workbox Service Worker.

## 5. Repository Structure
- `apps/elderly-app/`: React PWA.
- `apps/caregiver-dashboard/`: React SPA.
- `apps/backend/`: FastAPI core.
- `packages/shared-types/`: TypeScript interfaces.
- `packages/ui/`: Tailwind tokens.
- `docs/`: Canonical engineering and execution documentation.

## 6. Team Structure
- **Team 1:** Core Platform (Harshit Divekar, Anirudh P.S Yadav)
- **Team 2:** Intelligence & Dashboard (Parth Shrivastav, Mohd Rehan)
- **Team 3:** Offline, Content & Design System (Srujna, Ananya)

## 7. Member Structure
- **Harshit:** Backend & Infrastructure Lead.
- **Anirudh:** Elderly UI Developer.
- **Parth:** Caregiver Dashboard Developer.
- **Rehan:** AI & Analytics Engine Developer.
- **Srujna:** UI/UX & Design System Owner.
- **Ananya:** Offline Sync & Resilience Engineer.

## 8. Ownership Matrix
- **PostgreSQL / Backend API:** Team 1
- **Elderly Shell & Games:** Team 1
- **Caregiver Dashboard:** Team 2
- **Analytics & Adaptive Difficulty:** Team 2
- **Offline Sync & Service Worker:** Team 3
- **Design Tokens & Content:** Team 3

## 9. Infrastructure Ownership
- **Supabase Database & Storage:** Harshit
- **FastAPI Hosting (Render/Railway):** Harshit
- **Elderly App Hosting (Vercel):** Anirudh
- **Dashboard Hosting (Vercel):** Parth

## 10. Dependency Graph
1. Tokens (T3) → UI (T1, T2)
2. Database Schema (T1) → All Backend Models (T1)
3. Auth API (T1) → Login UI (T1, T2)
4. Pydantic Schemas (T1) → Dashboard Integration (T2)
5. Adaptive Engine (T2) → Game API (T1)
6. Online Game API (T1) → Dexie Offline Schema (T3)
7. Content Packs (T3) → Reminiscence UI (T1)

## 11. Implementation Order
Follow `docs/05-project-management/NEXT_PLAN.md`. Do not skip to Phase 2 voice/STT or Phase 3 RL.

1. Phase 0 already landed on this PR (see NEXT_PLAN).
2. Phase 1: reminder/memory APIs, Parth takes dashboard, Rehan owns staircase, Ananya extends Dexie, Srujna verifies culture, linked demo seed, 10-minute judge path.
3. Phase 2 only if Phase 1 is solid: Web Speech STT demo, PWA install prompt, KT recordings, optional Manipuri pack.
4. Phase 3 is pitch-only.

## 12. Task IDs
All work must map to an official MVP task ID. E.g., `T1-FE-001`. See `docs/05-project-management/task-registry.yaml`.

## 13. Checkpoints
Every task utilizes a standardized 18-step checkpoint system (CP-01 through CP-18) encompassing environment verification through to post-merge review.

## 14. Testing
- `pytest` for backend services.
- `vitest` for frontend logic.
- Offline behavior must be physically verified in Chrome DevTools (Offline mode).

## 15. Git Workflow
- Create branch: `feature/<task-id>-<name>` from `main`.
- Commit format: `feat(scope): message`.
- Push and open PR. Do not force push to `main`.

## 16. PR Workflow
- PR must target `main`.
- PR must link to the specific `00-18` source-of-truth document section it implements.
- CI must pass. One approval required from a cross-team reviewer or pair.

## 17. Integration
Integrations (e.g., Auth Sync, Online Game Loop, Offline-to-Online Loop) are tracked in `INTEGRATION_CHECKLIST.md`.

## 18. Handoffs
When completing a shared dependency, the owner must post the exact JSON payload, API endpoint, or import path to the team channel to unblock the dependent member.

## 19. Security
- No secrets in `.env` committed to Git.
- All API routes must utilize the JWT dependency `verify_user_access`.
- Caregiver A must never have access to Caregiver B's data (RBAC isolation).

## 20. Environment Setup
Developers must configure their `.env` files using placeholders provided in the individual member manuals. Real secrets are managed via GitHub Secrets or direct platform environments.

## 21. Deployment
- **Frontend:** Vercel (Auto-deploy on push to `main`).
- **Backend:** Managed by Harshit. Must run `alembic upgrade head` on deploy.

## 22. AI Agent Rules
AI must read this document, the member's specific manual, and the targeted source-of-truth document. The AI must NEVER invent features, bypass security layers, or implement Tier 2/3 functionality.

## 23. Definition of Done
Code is merged, tests pass in CI, UI is accessible (48px targets), offline behavior handles disconnect gracefully, and documentation reflects the final implementation.

## 24. Escalation Rules
If an instruction is missing, a dependency is blocked, or a document conflicts, explicitly mark it `[DECISION REQUIRED]` and halt work. Do not guess. Escalate to Harshit.

## 25. Final MVP Checklist
Tracked centrally in `docs/05-project-management/DEVELOPMENT_CHECKLIST.md`. SIH submission requires honest Tier 1: play → persist → caregiver chart, plus real reminders/memories. Do not claim 100% while those APIs are missing. Voice/STT is not a Tier 1 gate.
