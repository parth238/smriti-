# NEXT PLAN: SIH 2026 (as of 2026-08-31)

Phase 1 honesty loop is **mostly closed**. Anirudh covered backend reminders/memories/sync, elderly game depth, dashboard wiring, and offline batch on `feature/sih-2026`.

**PDF:** `*Cognitive*Gaming*.pdf` not found under Downloads or repo. Requirements taken from `docs/00-source-of-truth/00-problem-statement-and-context.md` and `03-features.md`.

## Finished today (2026-08-31)

| Area | Delivered |
|------|-----------|
| Harshit / backend | `reminders.py`, `memories.py`, `sync.py` routes; services + unit tests |
| Anirudh / elderly | `useSequencingGame`, `useNamingGame`, API reminders + Dexie cache |
| Parth / dashboard | `api/reminders.ts`, `api/memories.ts`, live forms on Reminders/Memories pages |
| Ananya / offline | `reminder_ack` outbox, `/sync/batch` client, 30s retry in `useOfflineSync` |
| Rehan | Verified: 37 pytest including adaptive + analytics (unchanged, still DONE) |

**Tests:** `pytest` 37 pass, `elderly-app` vitest 14 pass, both apps `npm run build` green.

## Each owner still owes

**Harshit:** Own backend review. T0-INF-002 hosted Postgres. RBAC integration tests. Demo seed script.

**Anirudh:** Splash/companion polish. Elderly personal-memories screen from uploaded API photos. Stop covering unless blocked.

**Parth:** Patient switcher (`/me/patients`). Reminder edit (PATCH). Chart polish. Overview missed-reminder from live API not demo.

**Rehan:** Dashboard copy audit (no diagnostic language). KT-AI session.

**Ananya:** Workbox Background Sync tag if browser allows; else document online flush as MVP. Local notification scheduling for reminders.

**Srujna:** Design QA vs doc 15. Verify cultural JSON with community names. Real photo assets.

## Judge path (works when Postgres up + accounts linked)

1. Caregiver registers, creates elderly PIN on API.
2. Caregiver adds reminder + uploads family photo on 5174.
3. Elderly PIN on 5173, plays Memory Match or Attention.
4. Elderly marks reminder done (syncs when online).
5. Caregiver Overview shows live session chart (labeled demo if API down).

## Phase 2 (only after playtest)

PWA install prompt, Web Speech EN/HI demo, Manipuri content pack proof.
