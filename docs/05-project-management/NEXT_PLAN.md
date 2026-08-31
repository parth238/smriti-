# NEXT PLAN: SIH 2026 (as of 2026-08-31)

Branch `feature/phase1-close-gaps` · PR #10 · PDF: `docs/SIH-2026-problem-statement.pdf` (SIH26003)

**Master guide (read this first):** [`DEVELOPER_ROADMAP.md`](./DEVELOPER_ROADMAP.md) — honest ratings, PDF matrix, Dexie schema, voice roadmap, judge script, per-teammate steps.

## Foundation (done by Anirudh P.S Yadav)

Anirudh built the **entire MVP foundation from scratch**: monorepo, FastAPI backend, elderly PWA, caregiver dashboard, content packs, offline Dexie/Workbox, four cognitive games, adaptive + analytics integration, CI, judge seed script, reference game art, and in-game Web Speech voice (2026-08-31).

**Honest completion:** ~20% of full PDF vision · ~52% of Tier 1 MVP scaffold.

See `CONTRIBUTION_LEDGER.md` for the full narrative.

## PDF MVP cross-check (SIH26003)

| Requirement | Status | Owner next |
|-------------|--------|------------|
| 4 MVP games + telemetry | PARTIAL — all four play, persist sessions, reference sprites + voice cues | Srujna polish; Rehan copy audit |
| Adaptive difficulty | DONE — rule-based 3-up/2-down | Rehan KT-AI |
| Reminiscence (cultural + family) | PARTIAL — Bihu art, cultural JSON, family upload API | Srujna community QA; Ananya offline cache hardening |
| Reminders | PARTIAL — API + elderly ack + dashboard CRUD | Ananya local notifications |
| Caregiver dashboard | PARTIAL — live API + labeled demo | Parth polish, alerts, deploy |
| Offline-first PWA | PARTIAL — Workbox precaches games + content packs | Ananya Background Sync tag |
| Multilingual (Assamese) | PARTIAL — en/as on elderly; strings corrected 2026-08-31 | Srujna community playtest |
| Voice (Web Speech TTS/STT) | PARTIAL — all screens + games wired; Assamese TTS fallback | Rehan Bhashini Tier 3 scoping |
| Holistic design (not bare grid) | PARTIAL — hill path splash, grandmother/grandfather companions, themed game hubs | Srujna design QA vs doc 15 |

## Each owner still owes

See **`DEVELOPER_ROADMAP.md` §7** for step-by-step instructions. Summary:

- **Ananya** — Background Sync, local notifications, pull-on-reconnect, E2E offline test
- **Rehan** — copy audit, KT-AI, Bhashini spec
- **Srujna** — design QA, Assamese community review, PNG asset audit
- **Parth** — live alerts, Vercel deploy, chart polish
- **Harshit** — hosted Postgres, RBAC tests, prod deploy
- **Anirudh** — merge PR #10 after review; integration only when blocked

## Judge path

Full script in **`DEVELOPER_ROADMAP.md` §8**.

## Phase 2 (after playtest)

PWA install prompt, Bhashini Assamese voice, Manipuri pack proof, family photos as memory tiles, arithmetic + maze games.
