# Smriti — Master Document (SIH26003)

**Last updated:** 2026-09-01 · Branch `feature/sih-winning-path` (merge of `origin/main` in progress) · Problem statement: [`docs/SIH-2026-problem-statement.pdf`](SIH-2026-problem-statement.pdf)

**This is the only living human-readable project document.** Quick commands: [`README.md`](../README.md). Machine-readable tasks: [`docs/task-registry.yaml`](task-registry.yaml).

---

## 1. Executive verdict — honest /10 scores

| Dimension | Score | Meaning |
|-----------|-------|---------|
| **Overall product today** | **6.5 / 10** | Story Mode, account-scoped offline sync, reminder notification code, 7 games, deploy configs — hosted URL, device validation, and playtest still pending |
| **Judge demo (local seed)** | **7.5 / 10** | Hero loop + `/story` + Settings notification control + live Alerts + Bhashini proxy hook |
| **Judge demo (public URL)** | **4 / 10** | `render.yaml` + Vercel configs exist — production URLs, CORS, migrations, and seed not verified |
| **Elderly Assamese experience** | **5.5 / 10** | Bhashini TTS proxy code exists; real Assamese audio on deployed env not verified; Web Speech fallback honest |
| **Production readiness** | **4.0 / 10** | Deploy targets documented; no verified prod Postgres, API, or frontends |
| **Code maintainability** | **6.5 / 10** | Monorepo coherent; this single doc replaces 60+ fragmented files |

**One-line pitch for judges:** Smriti is an offline-first cognitive companion PWA for elderly Assamese users — six PDF cognitive domains plus face recall, rule-based adaptive difficulty, caregiver dashboard — built as a working MVP with honest voice limits and a Bhashini integration path.

**Target 10/10 (post-SIH):** Assamese voice verified on prod OR honest UX; sync from any screen; hosted stack verified; 60+ elder playtest; DPDP review; zero diagnostic claims.

---

## 2. Attribution — built by Anirudh; teammates polish

**Anirudh P.S Yadav** built the working foundation from scratch while teammates were not yet on-repo:

| Area | Delivered |
|------|-----------|
| Monorepo | `apps/backend`, `apps/elderly-app`, `apps/caregiver-dashboard`, `packages/content-packs`, Docker, CI |
| Backend | FastAPI, Alembic, JWT, RBAC, 7 game types, adaptive staircase, analytics, reminders, memories, sync batch, pytest |
| Elderly PWA | Splash, login, home, **7 games**, Dexie, Workbox, i18n en/as, companions, Web Speech voice |
| Caregiver dashboard | Sidebar, Recharts, reminders/memories API, patient switcher, Story Mode `/story` |
| Content & assets | Assamese/English cultural JSON, game PNG sprites, judge seed script |
| Docs & CI | This master doc, GitHub Actions (pytest + build; Vitest not in CI — see §8) |

**Teammates do not rebuild.** They polish per §11.

---

## 3. Canonical stack (locked — one stack)

| Layer | PDF suggests | **We ship** | Port |
|-------|-------------|-------------|------|
| Elderly client | React Native | **React 18 PWA** (Vite + Workbox + Dexie) | **5173** |
| Local DB | SQLite | **Dexie / IndexedDB** | — |
| Caregiver UI | React/Next | **React / Vite** | **5174** |
| Backend | FastAPI | **FastAPI + Python 3.11** | **8000** |
| Server DB | PostgreSQL | **PostgreSQL** (Docker local → **Supabase prod target**) | — |
| Voice v1 | AI4Bharat/Bhashini | **Web Speech API** (browser TTS/STT) + optional Bhashini TTS proxy | — |
| Voice v3 | Bhashini Assamese | **Proxy code shipped; prod credentials/audio unverified** | — |
| Adaptive AI | RL / bandits | **Rule-based 3-up/2-down staircase** | — |
| Toolchain | — | **Node 20, Python 3.11** | — |

**Why PWA not React Native:** PWA-first for offline support and zero-install access on low-end Android; React Native is the post-hackathon path. Judges test via URL; offline is met by service worker + IndexedDB; backend logic is shared; team web skills match hackathon timeline.

**Do not claim:** React Native for current MVP, verified native Assamese TTS/STT on prod, clinical diagnosis, RL personalization, or closed-app reminder delivery.

---

## 4. PDF requirement matrix (SIH26003)

| PDF req | Status | Evidence |
|---------|--------|----------|
| (a) Cognitive games — 6 domains | **DONE** | Memory, attention, sequencing, naming, arithmetic, path maze |
| (b) AI adaptive difficulty | **DONE** | `lib/adaptive.ts` + backend staircase |
| (c) Multilingual + voice | **PARTIAL** | en/as UI; Web Speech TTS; STT English-only; Bhashini proxy when keys set (unverified on prod) |
| (d) Cultural themes / regional language | **PARTIAL** | Assamese pack, Bihu art, family upload API |
| (e) Reminders | **PARTIAL** | API + Dexie + ack + Settings permission + in-page scheduler; real Android device validation pending |
| (f) Caregiver dashboard | **PARTIAL** | Live API + charts + Story Mode; prod deploy unverified |
| (g) Offline functionality | **PARTIAL** | Account-scoped Dexie outbox, push-then-pull sync cycle, Workbox caching; no SW Background Sync handler |
| (h) Elderly-friendly UI | **PARTIAL** | 56px targets, max 4 choices per screen; design QA pending |
| Face/name recall | **DONE** | `face_recall` with family photos + demo fallback |
| Full NER voice (Bhashini) | **PARTIAL** | Backend proxy + elderly client hook exist; credentials and audio not verified on deployed env |
| RL / decline ML | **NOT STARTED** | Correctly deferred |
| Geofencing / clinician portal | **NOT STARTED** | Post-MVP |

---

## 5. Architecture flowcharts

### 5.1 Auth and pairing

```mermaid
flowchart TD
  splash[Splash voice welcome] --> paired{Paired before?}
  paired -->|yes| home[Home reality orientation]
  paired -->|no| login[Elderly PIN login]
  login --> apiAuth[POST /auth/elderly/login]
  apiAuth --> persist[persistAuthSession localStorage + sessionStorage]
  persist --> home
  caregiver[Caregiver 5174] --> cgAuth[POST /auth/caregiver/login]
  cgAuth --> link[Link elderly via pairing API]
  link --> upload[Upload reminders + family photos]
  upload --> syncPull[Elderly pulls on reconnect]
```

### 5.2 Game telemetry → offline → sync

```mermaid
flowchart LR
  game[Game hook] --> record[persistCompletedGameSession]
  record --> dexie[(Dexie sessions)]
  record --> outbox[(Dexie outbox userId-scoped)]
  record --> adaptiveEvt[notifyAdaptiveRefresh]
  outbox --> cycle[runSyncCycle on online + interval]
  cycle --> flush[flushOutbox POST /sync/batch]
  flush --> pull[GET /sync/status incremental pull]
  pull --> postgres[(PostgreSQL)]
  postgres --> dashboard[Caregiver charts]
```

### 5.3 Voice pipeline (Assamese honesty)

```mermaid
flowchart TD
  ui[Assamese UI text] --> bhashiniCheck{Bhashini configured?}
  bhashiniCheck -->|yes| bhashiniTTS[POST /voice/assamese-tts]
  bhashiniCheck -->|no| tts[Web Speech TTS]
  tts --> tryAs{as-IN voice?}
  tryAs -->|rare| speakAs[Speak Assamese]
  tryAs -->|no| fallback[bn-IN → hi-IN → en-IN]
  mic[Mic button naming game] --> stt[Web Speech STT en-IN only]
  stt --> match{Matches English label?}
  match -->|yes| correct[Count correct]
  match -->|no| gentle[tryAgainGentle — not wrong answer]
```

### 5.4 Reminder lifecycle

```mermaid
flowchart LR
  cgCreate[Caregiver creates reminder] --> api[POST /reminders]
  api --> elderlyPull[GET /sync/status or /reminders]
  elderlyPull --> dexieRem[(Dexie reminders userId-scoped)]
  dexieRem --> scheduler[reminderScheduler 30s poll]
  scheduler --> settingsPerm[Settings Enable reminder alerts]
  settingsPerm --> notify[showReminderNotification]
  dexieRem --> ui[Reminders screen]
  ui --> ack[Mark done]
  ack --> outboxAck[outbox reminder_ack]
  outboxAck --> sync[POST /sync/batch]
  sync --> dashAlert[Dashboard missed alert]
```

### 5.5 Reminder notification delivery (implemented — in-page only)

```mermaid
flowchart TD
  settingsTap[Settings button tap] --> reqPerm[requestReminderNotifications]
  schedulerTick[Scheduler every 30s] --> due{Due in 5 min window?}
  due -->|yes| guard{Active userId matches?}
  guard -->|yes| sw{Active service worker?}
  sw -->|yes| showSW[registration.showNotification]
  sw -->|no| showDesk[new Notification desktop fallback]
  showSW --> success{Display succeeded?}
  showDesk --> success
  success -->|yes| notified[Add to notifiedKeys]
  success -->|no| retry[Retry on next tick]
```

**Honest limit:** delivery requires the PWA page (and its service worker registration) to remain active. Fully closed or OS-suspended delivery is **not guaranteed** without Push API or another service-worker wake trigger.

---

## 6. Complete setup guide

### 6.1 Prerequisites

- Docker Desktop (Postgres)
- Node 20, Python 3.11
- Git

### 6.2 Local full stack

```bash
# 1. Database
docker compose up -d postgres

# 2. Backend
cd apps/backend
python -m venv .venv
source .venv/bin/activate          # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python ../../scripts/seed_judge_demo.py
uvicorn app.main:app --reload --port 8000

# 3. Elderly PWA (:5173)
cd apps/elderly-app
npm ci
cp .env.example .env            # VITE_API_URL=http://localhost:8000/api/v1
npm run dev

# 4. Caregiver dashboard (:5174)
cd apps/caregiver-dashboard
npm ci
export VITE_API_URL=http://localhost:8000/api/v1
npm run dev

# 5. Health check
curl http://localhost:8000/health
```

### 6.3 Environment variables

| App | Variable | Example |
|-----|----------|---------|
| Backend | `DATABASE_URL` | `postgresql://smriti:smriti_dev@localhost:5432/smriti_dev` |
| Backend | `JWT_SECRET_KEY` | 32+ random bytes |
| Backend | `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:5174` |
| Backend | `BHASHINI_API_KEY` | Optional — empty in local dev |
| Backend | `BHASHINI_TTS_SERVICE_ID` | Optional — empty in local dev |
| Elderly / Caregiver | `VITE_API_URL` | `http://localhost:8000/api/v1` |
| Caregiver | `VITE_ELDERLY_APP_URL` | Prod elderly PWA URL for Story Mode CTA |

### 6.4 Judge demo logins

| App | Credentials |
|-----|-------------|
| Caregiver :5174 | phone `9876543210` or `demo@smriti.local` / password `SmritiJudge2026` |
| Elderly :5173 | phone `9123456789` / PIN `2468` |

### 6.5 Production deploy (targets — not verified)

Render, Supabase, and Vercel are **deployment targets**. The following remain **unverified** until a teammate completes and documents them:

1. Public API URL on Render (or equivalent) with prod `DATABASE_URL`
2. Supabase/Neon Postgres with `alembic upgrade head` and judge seed on prod
3. Vercel frontends with prod `VITE_API_URL` and caregiver `VITE_ELDERLY_APP_URL`
4. Production `ALLOWED_ORIGINS` matching deployed frontend URLs
5. Production judge demo accounts and CORS smoke test
6. Real environment variables on hosted backend (including optional Bhashini keys)

Do **not** describe these as completed until verified end-to-end.

### 6.6 Test commands and counts (Gate 4B — local verification)

Run from repo root on **2026-09-01**:

```bash
# Backend (apps/backend, .venv active)
ruff check .                    # Gate 4B: All checks passed
black --check .                 # Gate 4B: 73 files unchanged
pytest -v --tb=short            # Gate 4B: 69 passed

# Elderly PWA (Node 20)
cd apps/elderly-app
npm ci
npm test -- --maxWorkers=1 --minWorkers=1   # Gate 4B: 147 passed (22 files)
npx tsc --noEmit                # Gate 4B: pass
npm run build                   # Gate 4B: dist/sw.js + workbox + manifest generated

# Caregiver dashboard
cd apps/caregiver-dashboard
npm ci
npx tsc --noEmit                # Gate 4B: pass
npm run build                   # Gate 4B: pass (chunk size warning only)
```

**CI today:** GitHub Actions runs backend pytest + ruff/black and frontend `tsc` + build. **Vitest is not run in CI** (see §8).

---

## 7. Games inventory (7 activities)

| Game | Domain | Route | `game_type` | Hook |
|------|--------|-------|-------------|------|
| Memory Match | Memory | `/games/memory-match` | `memory_match` | `useMemoryMatch.ts` |
| Attention Tap | Attention | `/games/attention-reaction` | `attention_reaction` | `useAttentionGame.ts` |
| Daily Sequencing | Executive | `/games/sequencing` | `sequencing` | `useSequencingGame.ts` |
| Picture Naming | Language | `/games/picture-naming` | `picture_naming` | `useNamingGame.ts` |
| Simple Arithmetic | Calculation | `/games/arithmetic` | `simple_arithmetic` | `useArithmeticGame.ts` |
| Hill Path | Visuospatial | `/games/path-maze` | `path_maze` | `usePathMazeGame.ts` |
| Who Is This? | Reminiscence | `/games/face-recall` | `face_recall` | `useFaceRecallGame.ts` |

Game picker: **4 per screen** + “More activities” (elderly max-4-choices rule).

Each game records: user_id, game_type, difficulty, accuracy, reaction_time, errors, hints_used, session_duration, completed_or_quit → Dexie → POST `/game-sessions` or account-scoped outbox.

**Known drift:** `packages/shared-types` lists only 4 game types; backend catalog and elderly app use all 7. Shared types need alignment (§8).

---

## 8. Bug register — fixed in this hardening pass

| Severity | Issue | Fix | Status |
|----------|-------|-----|--------|
| Critical | Attention penalizes taps during wait | Guard `phase === "wait"` | **FIXED** |
| Critical | Naming STT failure counted as wrong answer | Gentle nudge only | **FIXED** |
| Critical | Outbox items skipped forever at 8 attempts | Reset attempts + surface banner | **FIXED** |
| High | Sync only ran on Home screen | `OfflineSyncProvider` in `main.tsx` | **FIXED** |
| High | Sign-out left JWT in localStorage | `clearAuthSession()` | **FIXED** |
| High | Face recall empty without photos | Demo rounds with grandmother PNG | **FIXED** |
| High | Assamese UI promised voice input | Mic hidden in `as`; honest note shown | **FIXED** |
| High | Adaptive difficulty stale after game | `notifyAdaptiveRefresh` event | **FIXED** |
| High | Cultural pack ignored UI language | `loadBundledCulturalPack(language)` | **FIXED** |
| High | Cross-account outbox/session bleed | Dexie v4 `userId` on reminders/outbox + isolation guards | **FIXED** |
| High | Notification permission on startup | Removed; Settings gesture only | **FIXED** |
| High | Android `new Notification` failure | `showReminderNotification` prefers SW path | **FIXED** |
| Medium | Path maze accuracy floored at 60% | Removed floor | **FIXED** |
| Medium | Wrong GameSelect sprites | Dedicated icons for arithmetic/path | **FIXED** |
| Medium | Splash ignored localStorage paired flag | `readPairedFlag()` | **FIXED** |
| Medium | Failed reminder display marked delivered | `notifiedKeys` only after successful display | **FIXED** |

### Still open (known gaps)

| Issue | Status |
|-------|--------|
| **Seven-game shared-type drift** (`packages/shared-types` has 4 types; app/backend use 7) | Open |
| **Vitest not in CI** — elderly unit tests run locally only | Open |
| **Supabase Storage** for family photos | Not implemented |
| **`Alert` / `PerformanceMetric` models** | Dead schema — no API routes |
| **Playtest video** | [`docs/playtest/PLAYTEST.md`](playtest/PLAYTEST.md) template only |
| **Bhashini credentials on prod** | Proxy code exists; keys unset locally; Assamese audio not verified on deployed env |
| **Android airplane-mode device validation** | Not performed in this gate |
| **Real Android reminder notification validation** | Code shipped; device test pending |
| **Closed-app notification delivery** | Not supported — requires Push API or SW wake trigger |
| **Workbox Background Sync handler** | Tag `smriti-outbox-flush` registered in `main.tsx`; generated SW has **no** `sync` event handler — online + interval flush only |
| Hosted Postgres + API deploy | Harshit — config exists, not verified |
| Vercel frontends | Parth — config exists, not verified |
| Assamese community review of `as.json` | Srujna |
| 192/512 PWA icons, self-hosted fonts | Parth |
| `completedOrQuit: "quit"` on back navigation | Backlog |
| Hints feature (`needHint` i18n unused) | Backlog |
| DPDP legal review | Harshit |

---

## 9. Assamese / voice / STT / TTS reality

| Capability | Assamese UI | Reality |
|------------|-------------|---------|
| On-screen text | Full `as.json` | Works |
| Bhashini Assamese TTS | Settings may show “Assamese voice (Bhashini) is active” | **Only when** backend reports `bhashini_assamese_tts: true` (requires `BHASHINI_API_KEY` + `BHASHINI_TTS_SERVICE_ID`). Local dev defaults to **false**. Real Assamese audio on deployed env **not verified**. |
| Web Speech TTS fallback | All screens | Browser often lacks `as-IN`; falls back bn/hi/en |
| STT voice naming | Hidden in Assamese mode | English STT only — tap words on screen |

**Implemented code:**
- Backend: `POST /api/v1/voice/assamese-tts`, `GET /api/v1/voice/status` (`apps/backend/app/api/v1/voice.py`, `app/services/bhashini_tts.py`)
- Elderly: `bhashiniTts.ts`, hybrid routing in `CompanionVoice.tsx`

**Do not claim** Bhashini is “active” in production merely because proxy/client code exists. Distinguish: **code implemented** vs **credentials configured** vs **Assamese audio verified on real deployed environment**.

**Judge script line:** “Bhashini Assamese TTS when API keys are configured; Web Speech honest fallback otherwise — prod audio verification pending.”

---

## 10. Dexie / offline schema and sync

**DB:** `smriti_elderly` in `apps/elderly-app/src/db/dexie.ts` (Dexie v4)

| Table | Purpose |
|-------|---------|
| `sessions` | Offline game telemetry (`userId`-scoped) |
| `reminders` | Cached reminders + local ack (`userId`-scoped) |
| `memoryItems` | Family photo metadata cache (`userId`-scoped) |
| `outbox` | Pending writes for sync (`userId`-scoped) |
| `paired` | Offline re-login metadata |

**Storage rules:**
- Reminders/sessions/memories/outbox → **Dexie only** (never localStorage)
- JWT/userId/paired → `authStorage.ts` (localStorage + sessionStorage)
- Voice toggle → `localStorage` `smriti.voice`
- Sync cursor → `syncWatermark.ts` per user (`next_since`)

**Outbox kinds:** `game_session`, `reminder_ack`

### Implemented offline synchronization

1. **Enqueue:** Completed game sessions (`persistCompletedGameSession`) and reminder acknowledgements enter the Dexie outbox with `userId`. Game-session persistence maintains the local session/outbox durability invariant atomically.
2. **Account scope:** Outbox flush, pull, and cache reads require matching active session, outbox row `userId`, and payload `userId`. Contradictory rows are quarantined.
3. **Reconnect orchestration:** `runSyncCycle()` in `syncCycle.ts` performs **push then pull**:
   - `flushOutbox(token, userId)` → `POST /sync/batch`
   - `pullServerChanges(token, userId, locale)` → `GET /sync/status`
4. **Incremental pull:** `/sync/status` returns changed reminders and memories since stored cursor; backend sync windows use **database time** (`next_since = database_utc_now(db)`).
5. **Cursor advance:** `syncWatermark` updates `next_since` **only after successful pull** write to Dexie.
6. **Idempotency:** Game sessions dedupe on `client_generated_id` bound to the owning user (backend rejects cross-user replay).
7. **Flush triggers:** `useOfflineSync` runs sync on **`online` event**, **interval polling**, and exponential retry when pending outbox items remain. This is the current outbox-flush mechanism.
8. **Background Sync tag:** `main.tsx` registers `smriti-outbox-flush` when `SyncManager` exists, but the **generated Workbox service worker has no `sync` event handler**. Do **not** claim full Background Sync recovery — online + interval flush is what actually runs.

---

## 11. Teammate assignments (manager view)

### Anirudh — integration lead
- [x] Monorepo, 7 games, Dexie, voice, CI, this master doc, P0 bug fixes
- [x] Account-scoped sync hardening (Gates 3A–4A)
- [ ] Merge `feature/sih-winning-path` → `main` after Gate 4B verification

### Harshit — backend / infra (P0 prod)
1. Hosted Supabase/Neon `DATABASE_URL` — **unverified**
2. API deploy with `ALLOWED_ORIGINS` — **unverified**
3. RBAC integration tests
4. Supabase Storage for family photos — **not implemented**
5. DPDP consent legal review

### Parth — caregiver dashboard + deploy
1. Vercel deploy elderly + caregiver with prod `VITE_API_URL` — **unverified**
2. Live missed-reminder alerts (caregiver polling exists)
3. Chart polish, non-diagnostic copy
4. PWA install icons 192/512

### Ananya — offline / sync
1. [x] Account-scoped Dexie outbox + `/sync/status` pull on reconnect
2. [x] `reminderScheduler.ts` — local notifications with Settings permission + SW delivery
3. [ ] Real Android device validation (airplane mode + notification permission)
4. [ ] Optional: implement SW `sync` handler for `smriti-outbox-flush` tag

### Rehan — AI / analytics / voice Tier 3
1. Staircase engine doc for judges
2. Copy audit — zero diagnostic language
3. Dashboard chart labels — personal baseline only
4. Bhashini prod credentials + verify Assamese audio on deployed API

### Srujna — design / cultural / i18n
1. Design QA vs 56px touch, high contrast
2. Community Assamese review (`as.json`)
3. Verify PNG assets on all game screens
4. Elder playtest coordination (3+ Assamese speakers) + playtest video

---

## 12. Judge demo script (10 minutes)

**Prep:** Postgres up, `alembic upgrade head`, `python scripts/seed_judge_demo.py`

| Step | Action | Say |
|------|--------|-----|
| 1 | Caregiver login :5174 | “Remote family monitors from Guwahati.” |
| 2 | Add reminder + upload family photo | “Content syncs to her device.” |
| 3 | Elderly splash + voice | “Bhashini when keys configured; honest Web Speech fallback.” |
| 4 | PIN login → Home | “Date, time, you are at home.” |
| 5 | Memory Match + Arithmetic | “Six PDF cognitive domains, telemetry logged.” |
| 6 | Face recall | “Personal reminiscence — who is this?” |
| 7 | Settings → Enable reminder alerts + Assamese | “Permission is explicit; honest about STT limits.” |
| 8 | Mark reminder done offline optional | “Dexie outbox, account-scoped, not localStorage.” |
| 9 | Caregiver refresh charts | “Peace of mind in 30 seconds.” |
| 10 | Show §1 scores + `/story` | “6.5/10 overall; Story at /story; hosted URL pending verification.” |

---

## 13. Path to 10/10

| Phase | Exit criteria | Owner | Target |
|-------|---------------|-------|--------|
| **A — Demo solid** | P0 bugs fixed, master doc, local tests green | Anirudh | Done |
| **B — Hosted** | Verified API + Postgres + Vercel URLs | Harshit + Parth | Week 1 |
| **C — Assamese voice honest** | Bhashini keys on prod **and** audio verified OR clear UX | Rehan + Srujna | Week 2 |
| **D — Offline real** | Airplane demo on phone; Android notification device test | Ananya | Week 2 |
| **E — Elder test** | 3+ Assamese-speaking elders; issues fixed | All | Week 3 |
| **F — Production** | DPDP, RBAC tests, monitoring | Harshit | Post-SIH |

---

## 14. Git / branch policy

- **Main branch:** `main`
- **Feature branches:** short-lived `feature/*` from `main`
- **Current merge:** `origin/main` → `feature/sih-winning-path` (Gate 4B resolves docs; commit pending)

**Workflow:** PR → CI green → merge.

---

## 15. Winning path — what shipped vs teammate P0

| # | Item | Code status | Owner to finish |
|---|------|-------------|-----------------|
| 1 | **Public judge URL** | `render.yaml`, `vercel.json`, `.env.example` exist | Harshit: Supabase + Render; Parth: Vercel — **verify prod** |
| 2 | **Bhashini Assamese TTS** | `POST /api/v1/voice/assamese-tts`, hybrid `CompanionVoice` | Rehan: prod keys + **verify audio** |
| 3 | **Reminder loop** | Settings permission + `reminderScheduler.ts` + SW delivery + live `Alerts.tsx` | Ananya: **real Android device test** |
| 4 | **Hero journey** | Memory hint, adaptive level, face recall demo, **Story Mode `/story`** | Srujna: rehearse + Assamese copy QA |
| 5 | **Offline sync** | Account-scoped outbox, push-then-pull, `/sync/status` | Ananya: airplane-mode rehearsal on phone |
| 6 | **Playtest video** | [`docs/playtest/PLAYTEST.md`](playtest/PLAYTEST.md) template | Srujna: record 60s clip + quote in README |

**Story Mode** (`apps/caregiver-dashboard/src/pages/StoryMode.tsx`) — public scroll narrative at **`/story`** (no login). Set `VITE_ELDERLY_APP_URL` on Vercel so “Try elderly app” opens prod PWA.

**Caregiver notifications** — `useCaregiverNotifications` polls live reminders every 60s when signed in; fires browser `Notification` for missed items (not medical alerts).

### Deploy checklist (copy-paste for Harshit/Parth — targets only)

```bash
# 1. Supabase → DATABASE_URL
# 2. Render: connect repo, use render.yaml, set env vars
# 3. alembic upgrade head && python scripts/seed_judge_demo.py on prod DB
# 4. Vercel elderly: root apps/elderly-app, VITE_API_URL=https://YOUR-API/api/v1
# 5. Vercel caregiver: root apps/caregiver-dashboard, VITE_API_URL + VITE_ELDERLY_APP_URL
# 6. ALLOWED_ORIGINS=https://YOUR-ELDERLY.vercel.app,https://YOUR-CG.vercel.app
# 7. BHASHINI_API_KEY + BHASHINI_TTS_SERVICE_ID → verify Settings shows Bhashini + hear Assamese
# 8. Smoke-test judge logins, CORS, and sync on prod URLs before claiming deploy done
```

---

*Maintained by Anirudh P.S Yadav. Teammates: polish only — see §11.*
