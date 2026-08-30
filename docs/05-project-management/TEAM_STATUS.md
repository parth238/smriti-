# TEAM STATUS BOARD

**Snapshot:** 2026-08-30. Branch `feature/sih-2026`. PR https://github.com/Rehan-2024/smriti-/pull/5

**Covering:** Anirudh P.S Yadav (TEAM 1 Elderly UI) landed Harshit backend/infra and scaffolded Parth / Rehan / Ananya / Srujna slices so the SIH demo loop exists. Owners below are who must work **next**. Covering is not ownership transfer.

**Plan:** `docs/05-project-management/NEXT_PLAN.md`

## Current board (next work)

| Member | Current Task ID | Status | Checkpoint | Expected result | Actual result | Notes |
|--------|-----------------|--------|------------|-----------------|---------------|-------|
| Harshit | T1-BE-007 | NOT_STARTED | CP-01 | Reminder + memory APIs | Schema only (no routes) | Take backend ownership. Review auth/schema Anirudh covered. Then reminders, memories, sync. |
| Anirudh | T1-FE-003 | PARTIAL | CP-06 | Four games at demo quality | Memory Match + Attention deepened. Sequencing/Naming persist with less craft | Own elderly UX. Stop covering other folders unless a Phase 1 blocker has no owner. |
| Parth | T2-FE-005 | NOT_STARTED | CP-01 | Reminder/memory mgmt UI on live APIs | Pages render `demo.ts` | Dashboard is HIS. Take over 5174. Keep labeled live/demo split. |
| Rehan | T2-AI-001/2/3 | DONE | CP-15 | Staircase & full analytics | All metrics mapped, tested, and endpoints stable | Ready for dashboard UI integration. KT-AI pending. |
| Srujna | T3-DS-001 | PARTIAL | CP-01 | Tokens + verified culture | Palette copied in both apps. JSON pack Assam + Hornbill. No `packages/ui` | Design QA vs doc 15. Real assets, not generic AI stock. |
| Ananya | T3-OS-001 | PARTIAL | CP-06 | Dexie for all entities | Sessions/outbox/reminders-cache/paired. Game flush only | Extend Anirudh's start. Do not rewrite. Workbox polish + reminder scheduling. |

## What is actually landed (verify in repo)

Done enough to demo if Postgres is up and accounts are linked:

- T0-INF-001 / T0-INF-003: monorepo, CI, Docker Postgres, Node 20, Python 3.11 (Anirudh covering Harshit).
- T1-BE-002 / T1-BE-003: Alembic schema, JWT caregiver + elderly PIN, refresh, rate limit (Anirudh covering Harshit).
- T1-BE-005: idempotent `POST /game-sessions`, session list, next-difficulty, `/me/patients`, 7d analytics vs personal baseline.
- T1-FE-001+: elderly PWA 5173: splash companion, login, home, four games, reminders UI, reminiscence UI, i18n en/as, gamosa design.
- T2-FE-001: caregiver dashboard 5174: sidebar, Inter, Recharts (Anirudh covering Parth). Overview/Analytics/Sessions can load live API with labeled demo fallback.
- T2-AI-001/002/003: rule-based staircase + personal-baseline analytics (Rehan owned & extended). Not ML. Full metrics mapped.
- T3-OS-001/003: Dexie + outbox + Workbox plugin (Anirudh covering Ananya). Partial.
- T3-DS-003: cultural JSON pack Assam + Hornbill (Anirudh covering Srujna/Ananya). Partial, unverified assets.

## Still not done (do not pitch as complete)

- Reminder and memory CRUD APIs + caregiver upload.
- `/sync/batch` (today: per-session POST from the outbox).
- Live Supabase project (T0-INF-002). Local Docker Postgres only.
- Sequencing / Naming visual craft.
- Multi-patient switcher UI.
- Assamese playtest with a real elder.
- Linked demo-account seed script.
- Ananya: full Dexie schema, Workbox polish, Background Sync engine, i18n pipeline ownership.
- Srujna: Figma/token handoff, verified cultural assets, remaining screen QA.
- Rehan: review dashboard copy for diagnostic claims and schedule KT-AI with Anirudh.
- Parth: own dashboard, chart polish, reminder/memory UI on real APIs.
- Harshit: own backend, review auth, remaining domain APIs, env/prod.
- Voice / STT / TTS / Bhashini: later (Tier 2 Web Speech demo at most; full NER voice Tier 3). See NEXT_PLAN Phase 2 and 3.
- KT sessions: schedule them. Not a product feature.
