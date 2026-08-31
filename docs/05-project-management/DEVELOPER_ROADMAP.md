# Smriti — Developer Roadmap (Master Guide)

**Last updated:** 2026-08-31 · Branch `feature/phase1-close-gaps` · SIH26003  
**Audience:** All six teammates + judges reviewing technical honesty  
**Source of truth chain:** `docs/SIH-2026-problem-statement.pdf` → `docs/00-source-of-truth/*.md` → **this file** → `NEXT_PLAN.md` (weekly tasks)

---

## 1. Brutally honest current rating

| Lens | Score | What that means |
|------|-------|-----------------|
| **Full PDF vision** (8 games, NER voice, RL, geofencing, clinician portal, 8-state packs, clinical validation) | **~20%** | We have a credible vertical slice, not the platform described in pages 4–26 of the PDF. |
| **Tier 1 MVP** (`03-features.md`) | **~52%** | Four games play end-to-end with telemetry, offline Dexie, dashboard scaffold, Assamese UI, reference art, Web Speech voice — but not elder-playtest ready. |
| **Judge-demo readiness** | **~65%** | Happy path works locally with seed script; hosted Postgres + Vercel deploy still on Harshit/Parth. |
| **Production readiness** | **~15%** | No real pilot users, no DPDP legal review, no Background Sync, Assamese TTS is browser-dependent. |

**One-line verdict:** Smriti is a **working hackathon MVP scaffold** with honest AI positioning — not yet the offline-first NER cognitive platform the PDF describes.

---

## 2. PDF feature matrix vs implementation

| PDF says | Repo has | Gap | Priority |
|----------|----------|-----|----------|
| React Native mobile app | **React 18 PWA** (Vite + Workbox + Dexie) | PDF §15–16 recommends RN; we chose PWA per `01-architecture.md` §2,6 and `03-features.md` Tier 1. Documented, not a bug. | P3 (post-MVP Capacitor/RN wrap) |
| SQLite on device | **IndexedDB via Dexie.js** | Same offline-first intent; ADR-006 explains why not SQLite-WASM. | — (aligned) |
| 8–12 game templates across 6 cognitive domains | **4 games** (memory, attention, sequencing, naming) | Missing arithmetic + visuospatial/maze. | P2 stretch |
| Family photos in memory match | Generic NER sprite sheet + cultural JSON | Personal photos API exists; not wired as match tiles. | P2 |
| Rule-based adaptive difficulty | **Done** — 3-up/2-down staircase in backend + mirrored client | Per-game-type only; no cross-game personalization. | P3 |
| Assamese + multilingual voice | **en/as UI**; Web Speech TTS (Assamese often falls back to bn/hi/en) | Real NER ASR/TTS needs Bhashini Tier 3. | P1 roadmap |
| Conversational voice assistant | **Companion TTS** on splash/login/home/all 4 games + optional STT in naming | Not a full assistant; no "When is my medicine?" intent routing. | P2 |
| Reminders (medicine/meals/appointments) | API + Dexie cache + elderly ack + dashboard CRUD | No local Notification API scheduling offline. | P1 (Ananya) |
| Reminiscence (Bihu, Hornbill, family uploads) | Cultural JSON + Bihu art + family upload API + Dexie `memoryItems` | Content depth thin; community QA not done. | P2 (Srujna) |
| Caregiver dashboard + trends | React dashboard + Recharts + live API + labeled demo fallback | Missed-reminder alerts not live; not deployed to prod URL. | P1 (Parth/Harshit) |
| Offline-first + sync | Dexie outbox + `/sync/batch` + Workbox precache | No Background Sync tag; pull-on-reconnect partial. | P1 (Ananya) |
| PostgreSQL + object storage | Postgres schema + local upload dir; Supabase planned | Hosted Postgres not wired in CI/prod yet. | P0 (Harshit) |
| RL / decline-detection ML | Analytics rolling stats only | Correctly deferred per doc 00 §5. | P4 |
| Geofencing / safe-return | Not started | Tier 3 per doc 03. | P4 |
| Clinician portal | Not started | Post-MVP per doc 00 §6. | P4 |
| DPDP consent flows | Proxy consent fields in schema; basic JWT RBAC | Legal review not done. | P2 |

---

## 3. Tech stack truth table

| Layer | PDF (problem statement §5, §15–21) | Actual repo | Recommended path |
|-------|-----------------------------------|-------------|------------------|
| Elderly client | React Native | **React PWA** (`apps/elderly-app`) | Keep PWA for SIH; Capacitor wrap in Tier 3 if app-store needed |
| Local DB | SQLite | **Dexie/IndexedDB** (`src/db/dexie.ts`) | Keep Dexie; do not introduce parallel SQLite |
| Offline shell | (implied native) | **Workbox** service worker | Add Background Sync tag (Ananya) |
| Backend | FastAPI | **FastAPI 3.11** (`apps/backend`) | ✓ aligned |
| Server DB | PostgreSQL | **PostgreSQL** (Docker local; Supabase target) | Harshit: hosted `DATABASE_URL` |
| Media | S3-compatible | Local `UPLOAD_DIR` + magic-byte validation | Supabase Storage when hosted |
| Caregiver UI | React/Next.js | **React/Vite** (`apps/caregiver-dashboard`) | ✓ aligned |
| Auth | JWT | **JWT access + refresh**, PIN for elderly | ✓; prod secret guard in `config.py` |
| Voice | AI4Bharat / Bhashini | **Web Speech API** MVP (`src/voice/`) | Tier 3: Bhashini Assamese ASR/TTS |
| Adaptive AI | RL / bandits (later) | **Rule-based staircase** | ✓ honest v1 |
| CI | (not specified) | **GitHub Actions** — pytest 43, vitest 15, tsc + build | ✓ green locally |

**Why PWA instead of React Native (repeat this to judges):**

1. SIH judges test via URL — zero APK friction.  
2. Offline requirement (PS point g) is met by Service Worker + IndexedDB, not native-only.  
3. Business logic lives in FastAPI + shared types — RN/Capacitor is a shell swap later (`03-features.md` Tier 3).  
4. Team web skills >> mobile native skills for a 6-person hackathon timeline.

---

## 4. Offline / Dexie canonical schema

**Source of truth in code:** `apps/elderly-app/src/db/dexie.ts` (DB name `smriti_elderly`).

| Doc name (`04-database.md`) | Dexie table | Purpose |
|-----------------------------|-------------|---------|
| `game_sessions_local` | `sessions` | Offline game telemetry |
| `reminders_local` | `reminders` | Cached reminders + local ack |
| `memory_items_local` | `memoryItems` | Family photo metadata cache |
| `sync_outbox` | `outbox` | Pending writes for background sync |
| *(app-specific)* | `paired` | Offline re-login after first online pair |

**Schema versions:** v1 → core tables; v2 → `scheduledTime` index on reminders; v3 → `memoryItems`. **Add `version(N+1)` — never rewrite v1 in place.**

### Storage rules

| Data | Store | Why |
|------|-------|-----|
| Reminders, sessions, memories, outbox | **Dexie** | Must survive offline + sync |
| JWT, userId, paired flag, deviceId | **localStorage + sessionStorage** via `authStorage.ts` | Auth survives restart |
| Language, text size, voice toggle | **localStorage** | UI prefs only (`smriti.voice` = `on`/`off`) |
| lastGame, splash flags | **sessionStorage** | Ephemeral UI |

**Do NOT store reminders in localStorage.** Legacy key `smriti.reminders` was removed 2026-08-31.

### Outbox kinds

| `kind` | API type | When enqueued |
|--------|----------|---------------|
| `game_session` | `game_session` | After each completed game |
| `reminder_ack` | `reminder_ack` | User marks reminder done offline |

Flush: `db/syncOutbox.ts` → `POST /sync/batch`. Triggered by `hooks/useOfflineSync.ts` on `online` + interval retry.

### Sync flow

```
[Elderly plays offline]
  → Dexie sessions + outbox (game_session)

[Elderly marks reminder done offline]
  → Dexie reminders.update + outbox (reminder_ack)

[Device online]
  → flushOutbox(token) → POST /sync/batch
  → (TODO Ananya) GET /sync/status + syncReminders pull
```

### Ananya safe extension points

1. `hooks/useOfflineSync.ts` — pull after flush  
2. Workbox — Background Sync registration  
3. `src/notifications/reminderScheduler.ts` — Notification API from Dexie `scheduledTime`  
4. Tests under `apps/elderly-app/src/db/`

---

## 5. Voice roadmap

| Tier | Scope | Status |
|------|-------|--------|
| **Tier 2 MVP** | Web Speech TTS on splash, login, home, all 4 games (instructions, nudges, pair-found, complete); Settings toggle; `companion-speaking` CSS on grandmother/grandfather PNGs; optional STT button in Picture Naming | **Shipped 2026-08-31** |
| **Tier 2 stretch** | Intent routing ("When is my medicine?" → read next reminder from Dexie) | Not started — Rehan spec |
| **Tier 3** | Bhashini / AI4Bharat Assamese ASR+TTS; replace `useSpeech`/`useListening` backends | Post-SIH; needs API keys + latency testing |

**Assamese honesty:** Web Speech often has no `as-IN` voice. We try `as-IN` → `bn-IN` → `hi-IN` → `en-IN`. Judges must hear English/Hindi fallback until Bhashini ships.

**Files:** `src/voice/useSpeech.ts`, `useListening.ts`, `CompanionVoice.tsx`; wired via `useSpeakOnMount`, `useSpeakText`, `GameCompanion`.

---

## 6. Security quick pass (2026-08-31)

| Area | Status | Notes |
|------|--------|-------|
| JWT | ✓ | Prod guard rejects weak/short `JWT_SECRET_KEY` (`config.py`) |
| RBAC | ✓ | Elderly vs caregiver roles; pytest coverage |
| CORS | ✓ | `ALLOWED_ORIGINS` env list; no wildcard in prod |
| Uploads | ✓ | Magic-byte validation on memory uploads (`memories.py`) |
| Secrets | ✓ | `.env` gitignored; example files only |
| DPDP | ⚠️ | Consent fields exist; legal review pending |
| HTTPS | ⚠️ | Required at deploy; local dev HTTP only |

---

## 7. Step-by-step plan per teammate

### Anirudh — integration lead (stop covering when others unblocked)

- [x] Monorepo scaffold, 4 games, Dexie, voice module, reference art  
- [ ] Merge `feature/phase1-close-gaps` after team review  
- [ ] Unblock only when asked — others own their lanes now  

### Ananya — offline / sync / notifications

1. Read §4 above (Dexie schema — do not fork).  
2. Implement Background Sync tag OR document online-flush as MVP ceiling in PR.  
3. Wire `GET /sync/status` + `syncReminders()` pull on reconnect in `useOfflineSync.ts`.  
4. Build `reminderScheduler.ts` — schedule local notifications from Dexie `scheduledTime`.  
5. Write manual E2E script: play game offline → mark reminder → go online → verify batch ack.  
6. Harden outbox retry/backoff in `syncOutbox.ts`.

### Rehan — AI / analytics / voice Tier 3

1. KT-AI session: document staircase engine (`apps/backend/app/services/adaptive.py`).  
2. Audit all user-facing copy — zero diagnostic language (doc 07 §4).  
3. Review dashboard chart labels with Parth — personal baseline only, no population norms.  
4. Write Bhashini integration spec: endpoints, fallback, latency budget, Assamese test phrases.  
5. Optional: intent router spec for "When is my medicine?" using Dexie reminders.

### Srujna — design / cultural content / i18n

1. Design QA vs `15-ui-ux-design.md` — 56px tap targets, palette, no sidebar on elderly app.  
2. Community review of Assamese strings (`as.json`) and cultural JSON packs.  
3. Verify all games use PNG assets in `public/assets/games/` — no generic SVG where PNG exists.  
4. Refine companion poses if needed; replace Home nav Motif SVGs with final art (stretch).  
5. Family photo tiles inside Memory Match (stretch, needs Anirudh/API wiring).

### Parth — caregiver dashboard

1. Deploy dashboard to Vercel with hosted `VITE_API_URL`.  
2. Wire missed-reminder alerts from live API (not demo fallback).  
3. Alerts UI feed on Overview.  
4. Chart polish + non-diagnostic copy (pair with Rehan).  
5. Patient switcher QA with multi-elderly seed data.

### Harshit — backend / infra

1. **P0:** Hosted Supabase/Neon — set production `DATABASE_URL`, run Alembic.  
2. RBAC integration tests on reminders/memories/sync routes.  
3. Review Alembic revisions before prod deploy.  
4. Render/Railway API deploy with `ALLOWED_ORIGINS` for Vercel URLs.  
5. Monitor Supabase free tier; document Neon fallback.

---

## 8. Judge demo script (15 minutes)

**Prep:** Postgres up, `alembic upgrade head`, `python scripts/seed_judge_demo.py`.

| Step | Actor | Action | What to say |
|------|-------|--------|-------------|
| 1 | Caregiver | Open dashboard :5174, login `9876543210` / `SmritiJudge2026` | "Remote son monitors mother from Guwahati." |
| 2 | Caregiver | Add medicine reminder + upload family photo | "Content and schedules sync to her device." |
| 3 | Elderly | Open :5173 → splash hill path + grandmother walks + **voice welcome** | "Voice removes the reading barrier — Web Speech today, Bhashini Assamese on roadmap." |
| 4 | Elderly | PIN `9123456789` / `2468` → Home reality orientation + companion speaks greeting | "Reality orientation therapy — date, time, you are at home." |
| 5 | Elderly | Play Memory Match — hear hint, pair-found voice, completion | "Four cognitive domains, NER sprite art, telemetry logged." |
| 6 | Elderly | Settings → toggle voice off/on | "User control — not forced audio." |
| 7 | Elderly | Mark reminder done (works offline if you toggle airplane mode) | "Offline-first — Dexie outbox, not localStorage hack." |
| 8 | Caregiver | Refresh Overview — session chart updates | "Caregiver peace of mind in 30 seconds." |
| 9 | All | Show `DEVELOPER_ROADMAP.md` rating table | "We are ~52% of Tier 1 MVP, ~20% of full PDF — honest, not overselling AI." |

**Fallback if API down:** Elderly app still plays games offline; dashboard shows labeled demo data.

---

## 9. CI / test commands

```bash
# Backend (43 tests)
cd apps/backend && pytest

# Elderly frontend (15 vitest + tsc + build)
cd apps/elderly-app && npx vitest run && npm run build

# Caregiver dashboard
cd apps/caregiver-dashboard && npm run build
```

GitHub Actions: `.github/workflows/ci.yml` — runs on PR/push to `main`.

---

## 10. Related docs (do not duplicate)

| Doc | Purpose |
|-----|---------|
| `NEXT_PLAN.md` | Weekly owner task checklist |
| `CONTRIBUTION_LEDGER.md` | Who built what |
| `docs/00-source-of-truth/` | Permanent architecture/features/API specs |
| `TOOLING_VERSIONS.md` | Node 20, Python 3.11 pin |

**Deprecated:** `ANANYA_OFFLINE_FAQ.md` — content merged here §4. Do not edit the FAQ file.

---

## 11. Top 10 gaps (priority order)

1. **Hosted production Postgres** — blocks real multi-device demo  
2. **Local reminder notifications offline** — Ananya  
3. **Background Sync / pull-on-reconnect** — Ananya  
4. **Assamese voice quality** — Bhashini Tier 3, not Web Speech  
5. **Caregiver live alerts + Vercel deploy** — Parth  
6. **Elder UX playtest** — no real 60+ user validation  
7. **Family photos in memory game tiles** — personal reminiscence loop incomplete  
8. **Arithmetic + maze games** — PDF lists 6 domains, we ship 4  
9. **DPDP legal review** — consent flows exist but unvalidated  
10. **8-state NER content depth** — Assamese pack only; sub-regional variation untested

---

*Maintained by Anirudh P.S Yadav. Update this file when completion % shifts by ≥5 points or a Tier 1 item ships.*
