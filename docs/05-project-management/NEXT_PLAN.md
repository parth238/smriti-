# NEXT PLAN: SIH 2026 (as of 2026-08-31)

**Branch:** `feature/phase1-close-gaps` · **PR:** #10

**Foundation:** Anirudh P.S Yadav built the repo from scratch (see `CONTRIBUTION_LEDGER.md`). Everyone below refines and owns their slice going forward.

**Honest state:** ~14% of full PDF vision. Scaffold exists; gamification, environments, and elder UX polish are not done.

**PDF:** `docs/SIH-2026-problem-statement.pdf`

---

## Anirudh P.S Yadav (foundation complete)

**Done:** Monorepo, backend APIs, 4 games, Dexie/Workbox, dashboard wiring, cultural packs, companion scaffold, seed script, CI.

**Only if needed:** Merge PR #10, unblock teammates, critical bugfixes.

---

## Srujna — design, art, gamification environments

**Goal:** Make Smriti feel like a **cognitive gaming** product, not a bare form grid.

1. **Integrate reference game art** into `apps/elderly-app/public/assets/games/`:
   - Memory match: NER cultural icon sheet (pot, elephant, hills, bowl, etc.)
   - Attention: tap targets (star, bell, leaf, butterfly)
   - Sequencing: daily routine strip (sun, pill, bowl, phone, moon)
   - Naming: objects strip (mug, flower, cow, umbrella, fish, book)
   - Splash/background: hill landscape with winding path
2. **Grandmother companion** — match reference portrait (red/gold, bindi, grey bun, glasses); walking stick on splash walk animation
3. **Grandfather variant** — gamosa companion for alternate screens if useful
4. **Bihu / festival scene** for cultural reminiscence screens
5. **Assamese i18n QA** — native speaker or ARDSI Guwahati review; fix wrong strings in `as.json`
6. Design QA vs `docs/00-source-of-truth/15-ui-ux-rules.md` on both apps
7. Figma/token handoff for any new game screen layouts

**Definition of done:** Each game has a distinct themed screen; companion looks dignified on splash, home, and games; no hardcoded English in components.

---

## Ananya — offline, sync, notifications

1. **Workbox Background Sync** tag for outbox (or document why online flush is MVP path)
2. **Local reminder notifications** when offline (scheduled triggers from Dexie cache)
3. Harden **batch sync retry** (edge cases: partial failure, idempotency)
4. **Precache game asset PNGs** once Srujna lands art in `public/assets/`
5. Expand Dexie tests; verify full offline loop: play game → outbox → sync → dashboard chart
6. KT-DEXIE: walk team through `dexie.ts`, `syncOutbox.ts`, `useOfflineSync.ts`

**Definition of done:** Elderly app usable for 30 minutes with zero network; reminders still surface locally.

---

## Rehan — AI, analytics, honest language

1. **Dashboard copy audit** — zero diagnostic claims; personal baseline framing only
2. **Elderly app copy audit** — same rules on game result and home screens
3. Document **voice roadmap**: Tier 2 Web Speech EN demo, Tier 3 Bhashini/AI4Bharat for Assamese ASR/TTS
4. Review telemetry schema vs PDF (accuracy, reaction time, errors, hints, duration) for future decline-detection
5. KT-AI: adaptive staircase + analytics engine for Parth/Harshit

**Definition of done:** Written sign-off that no UI string implies diagnosis; voice scope doc in `docs/06-reference/`.

---

## Parth — caregiver dashboard

1. **Polish Overview/Analytics** charts (loading states, empty states, live-only when signed in)
2. **Alerts page** — wire to real missed reminders + session gaps (not static demo)
3. **Reminder recurrence UI** (daily medicine vs once appointment)
4. **Deploy dashboard** to Vercel with production `VITE_API_URL`
5. **Sessions page** — filter by game type, link to PDF cognitive domains
6. KT-DASH: own `apps/caregiver-dashboard/` fully

**Definition of done:** Caregiver can run full demo loop without labeled demo fallback when API is up.

---

## Harshit — backend infra

1. **T0-INF-002** — provision hosted Postgres (Supabase/Neon), run `alembic upgrade head`
2. Review reminders/memories/sync routes Anirudh added; own merges going forward
3. **RBAC integration tests** — cross-user deny scenarios on API routes
4. **Cloud media** — move `/uploads` to Supabase Storage or S3
5. Production env: `JWT_SECRET`, `ALLOWED_ORIGINS`, rate limits

**Definition of done:** Public API URL + seeded judge accounts for demo day.

---

## Judge demo path (after seed + Postgres)

```bash
cd apps/backend && alembic upgrade head && python ../../scripts/seed_judge_demo.py
```

| App | Login |
|---|---|
| Caregiver 5174 | `9876543210` / `SmritiJudge2026` |
| Elderly 5173 | phone `9123456789`, PIN `2468` |

Loop: splash walk → PIN → memory game (see cultural prompt) → mark reminder → caregiver chart updates.

---

## Phase 2 (after playtest)

Web Speech voice demo, family photos in memory-match tiles, Manipuri UI strings, clinician export stub.
