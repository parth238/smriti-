# Contribution ledger (SIH 2026)

**Snapshot:** 2026-08-31 · Branch `feature/phase1-close-gaps` · PR #10

## Foundation built from scratch

**Anirudh P.S Yadav** implemented the working MVP scaffold end-to-end while teammates were not yet on-repo. This is not a stub demo; it is the full vertical slice others now extend.

| Area | What Anirudh built |
|---|---|
| **Monorepo** | `apps/backend`, `apps/elderly-app`, `apps/caregiver-dashboard`, `packages/content-packs`, Docker Postgres, GitHub Actions CI |
| **Backend** | FastAPI, Alembic schema, JWT auth (caregiver + elderly PIN), game sessions, adaptive staircase, analytics engine, reminders CRUD, memory upload, sync batch, RBAC helpers, 43 pytest |
| **Elderly PWA** | Vite PWA port 5173, splash/login/home, 4 cognitive games with reference art, Dexie offline (reminders in IndexedDB, not localStorage), Workbox precache, i18n en/as, cultural reminiscence, grandmother/grandfather companions, in-game Web Speech voice |
| **Caregiver dashboard** | Port 5174, sidebar, Recharts analytics, reminders/memories live API + labeled demo fallback, patient switcher, reminder edit |
| **Content** | Assamese/English cultural JSON packs, Manipuri POC pack, offline precache of content + game sprites |
| **Ops** | Judge demo seed script, README deploy section, Vercel configs, `DEVELOPER_ROADMAP.md` master guide |

**Harshit** owns production backend review and hosted Postgres going forward. **Parth, Rehan, Ananya, Srujna** own refinement and domain depth on top of this base (see `DEVELOPER_ROADMAP.md` §7).

## Honest completion

**~20% of full PDF vision** · **~52% of Tier 1 MVP scaffold**

Full gap matrix, tech stack truth table, and per-teammate steps: **`docs/05-project-management/DEVELOPER_ROADMAP.md`**

Cross-check: `task-registry.yaml` header and `TEAM_STATUS.md`.

**2026-08-31:** Dexie reminders canonical; legacy localStorage reminder path removed. Offline schema documented in `DEVELOPER_ROADMAP.md` §4 (replaces `ANANYA_OFFLINE_FAQ.md`).

**2026-08-31 (voice + CI + security):** Web Speech TTS/STT on splash/login/home/all 4 games + GameResult; Settings voice toggle; companion-speaking animation on PNG companions; optional STT in Picture Naming; CI green (pytest 43, vitest 15); JWT prod guard; upload magic-byte validation.

## What teammates must do now

The product must feel **gamified** (themed environments, reference art, reminiscence-linked play), not a bare utility grid. Per-owner tasks are in **`DEVELOPER_ROADMAP.md` §7** and `NEXT_PLAN.md`.
