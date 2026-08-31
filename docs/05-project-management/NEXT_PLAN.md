# NEXT PLAN: SIH 2026 (as of 2026-08-31)

Branch `feature/phase1-close-gaps` · PR #10 · PDF: `docs/SIH-2026-problem-statement.pdf` (SIH26003)

## Foundation (done by Anirudh P.S Yadav)

Anirudh built the **entire MVP foundation from scratch**: monorepo, FastAPI backend, elderly PWA, caregiver dashboard, content packs, offline Dexie/Workbox, four cognitive games scaffold, adaptive + analytics integration, CI, judge seed script, and reference game art wiring (2026-08-31).

**Honest completion:** ~18% of full PDF vision · ~48% of Tier 1 MVP scaffold (themed games + flows exist; not elder-playtest ready).

See `CONTRIBUTION_LEDGER.md` for the full narrative.

## PDF MVP cross-check (SIH26003)

| Requirement | Status | Owner next |
|-------------|--------|------------|
| 4 MVP games + telemetry | PARTIAL — all four play, persist sessions, reference sprites wired | Srujna polish; Rehan copy audit |
| Adaptive difficulty | DONE — rule-based 3-up/2-down | Rehan KT-AI |
| Reminiscence (cultural + family) | PARTIAL — Bihu art, cultural JSON, family upload API | Srujna community QA; Ananya offline cache hardening |
| Reminders | PARTIAL — API + elderly ack + dashboard CRUD | Ananya local notifications |
| Caregiver dashboard | PARTIAL — live API + labeled demo | Parth polish, alerts, deploy |
| Offline-first PWA | PARTIAL — Workbox precaches games + content packs | Ananya Background Sync tag |
| Multilingual (Assamese) | PARTIAL — en/as on elderly; Assamese strings corrected 2026-08-31 | Srujna community playtest |
| Holistic design (not bare grid) | PARTIAL — hill path splash, grandmother/grandfather companions, themed game hubs | Srujna design QA vs doc 15 |

## Each owner still owes

### Ananya — offline / sync / notifications
- Workbox Background Sync tag (or document online flush as MVP ceiling)
- Local notification scheduling for reminders (elderly PWA)
- Harden `reminder_ack` + memory item pull on reconnect
- E2E offline play → online flush test script

### Rehan — AI / analytics / copy / voice scoping
- Dashboard copy audit (no diagnostic language, no scores)
- KT-AI session for adaptive + analytics engines
- Voice / Web Speech / Bhashini scoping doc (Tier 2 vs 3)
- Review analytics chart labels with Parth

### Srujna — design, cultural assets, i18n QA, companion art direction
- Design QA vs `15-ui-ux-design.md` (56px targets, palette, no sidebar on elderly)
- Community review of Assamese cultural JSON + `as.json` strings
- Refine grandmother/grandfather companion poses if needed
- Replace placeholder SVG nav icons on Home with final art if desired
- Family photo tiles inside Memory Match (stretch)

### Parth — caregiver dashboard polish
- Overview missed-reminder from live API (not demo)
- Alerts UI feed
- Chart polish + non-diagnostic copy with Rehan
- Deploy dashboard to Vercel with hosted API URL

### Harshit — hosted Postgres, backend review
- T0-INF-002 hosted Supabase / production `DATABASE_URL`
- RBAC integration tests on reminders/memories/sync routes
- Review Alembic revisions before prod

### Anirudh — integration only when blocked
- Merge PR #10 after team review
- Stop covering unless a teammate is blocked

## Judge path (when Postgres up + accounts linked)

1. Caregiver registers, creates elderly PIN on API.
2. Caregiver adds reminder + uploads family photo on 5174.
3. Elderly PIN on 5173 → splash hill path + grandmother walk → play Memory Match (NER icons + reminiscence prompt).
4. Elderly marks reminder done (syncs when online).
5. Caregiver Overview shows live session chart (labeled demo if API down).

## Phase 2 (after playtest)

PWA install prompt, Web Speech EN/HI demo, Manipuri pack proof, family photos as memory tiles.
