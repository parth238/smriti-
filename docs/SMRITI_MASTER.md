# Smriti — Master Document (SIH26003)

**Last updated:** 2026-08-31 · Branch `main` · Problem statement: [`docs/SIH-2026-problem-statement.pdf`](SIH-2026-problem-statement.pdf)

**This is the only living human-readable project document.** Quick commands: [`README.md`](../README.md). Machine-readable tasks: [`docs/task-registry.yaml`](task-registry.yaml).

---

## 1. Executive verdict — honest /10 scores

| Dimension | Score | Meaning |
|-----------|-------|---------|
| **Overall product today** | **6.0 / 10** | Winning-path code landed; hosted URL + playtest video still on teammates |
| **Judge demo (local seed)** | **7.5 / 10** | Hero loop + notifications + live Alerts + Bhashini hook |
| **Judge demo (public URL)** | **4 / 10** | `render.yaml` + Vercel ready — Harshit/Parth must deploy |
| **Elderly Assamese experience** | **5.5 / 10** | Bhashini TTS when keys set; else honest Web Speech + system fonts offline |
| **Production readiness** | **4.5 / 10** | Deploy configs exist; no prod DB yet |
| **Code maintainability** | **6.5 / 10** | Monorepo coherent; this single doc replaces 60+ fragmented files |

**One-line pitch for judges:** Smriti is an offline-first cognitive companion PWA for elderly Assamese users — six PDF cognitive domains plus face recall, rule-based adaptive difficulty, caregiver dashboard — built as a working MVP with honest voice limits and a Bhashini roadmap.

**Target 10/10 (post-SIH):** Assamese voice that works OR honest UX; sync from any screen; hosted stack; 60+ elder playtest; DPDP review; zero diagnostic claims.

---

## 2. Attribution — built by Anirudh; teammates polish

**Anirudh P.S Yadav** built the working foundation from scratch while teammates were not yet on-repo:

| Area | Delivered |
|------|-----------|
| Monorepo | `apps/backend`, `apps/elderly-app`, `apps/caregiver-dashboard`, `packages/content-packs`, Docker, CI |
| Backend | FastAPI, Alembic, JWT, RBAC, 7 game types, adaptive staircase, analytics, reminders, memories, sync batch, pytest |
| Elderly PWA | Splash, login, home, **7 games**, Dexie, Workbox, i18n en/as, companions, Web Speech voice |
| Caregiver dashboard | Sidebar, Recharts, reminders/memories API, patient switcher |
| Content & assets | Assamese/English cultural JSON, game PNG sprites, judge seed script |
| Docs & CI | This master doc, GitHub Actions (pytest + vitest + build) |

**Teammates do not rebuild.** They polish per §11.

---

## 3. Canonical stack (locked — one stack)

| Layer | PDF suggests | **We ship** | Port |
|-------|-------------|-------------|------|
| Elderly client | React Native | **React 18 PWA** (Vite + Workbox + Dexie) | **5173** |
| Local DB | SQLite | **Dexie / IndexedDB** | — |
| Caregiver UI | React/Next | **React / Vite** | **5174** |
| Backend | FastAPI | **FastAPI + Python 3.11** | **8000** |
| Server DB | PostgreSQL | **PostgreSQL** (Docker local → Supabase prod) | — |
| Voice v1 | AI4Bharat/Bhashini | **Web Speech API** (browser TTS/STT) | — |
| Voice v3 | Bhashini Assamese | **Roadmap only** — not in MVP | — |
| Adaptive AI | RL / bandits | **Rule-based 3-up/2-down staircase** | — |
| Toolchain | — | **Node 20, Python 3.11** | — |

**Why PWA not React Native:** judges test via URL; offline met by SW + IndexedDB; backend logic is shared; team web skills match hackathon timeline.

**Do not claim:** React Native for MVP, native Assamese TTS/STT, clinical diagnosis, RL personalization.

---

## 4. PDF requirement matrix (SIH26003)

| PDF req | Status | Evidence |
|---------|--------|----------|
| (a) Cognitive games — 6 domains | **DONE** | Memory, attention, sequencing, naming, arithmetic, path maze |
| (b) AI adaptive difficulty | **DONE** | `lib/adaptive.ts` + backend staircase |
| (c) Multilingual + voice | **PARTIAL** | en/as UI; Web Speech TTS; STT English-only; Assamese TTS often Bengali/Hindi fallback |
| (d) Cultural themes / regional language | **PARTIAL** | Assamese pack, Bihu art, family upload API |
| (e) Reminders | **PARTIAL** | API + Dexie + ack; no local Notification API yet |
| (f) Caregiver dashboard | **PARTIAL** | Live API + charts; not deployed prod |
| (g) Offline functionality | **PARTIAL** | Dexie outbox + Workbox; sync now app-wide; no Background Sync tag |
| (h) Elderly-friendly UI | **PARTIAL** | 56px targets, max 4 choices per screen; design QA pending |
| Face/name recall | **DONE** | `face_recall` with family photos + demo fallback |
| Full NER voice (Bhashini) | **NOT STARTED** | Tier 3 — §12 |
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
  game[Game hook] --> record[useGameSession.recordResult]
  record --> dexie[(Dexie sessions)]
  record --> outbox[(Dexie outbox)]
  record --> adaptiveEvt[notifyAdaptiveRefresh]
  outbox --> flush[flushOutbox on online]
  flush --> batch[POST /sync/batch]
  batch --> postgres[(PostgreSQL)]
  postgres --> dashboard[Caregiver charts]
```

### 5.3 Voice pipeline (Assamese honesty)

```mermaid
flowchart TD
  ui[Assamese UI text] --> tts[Web Speech TTS]
  tts --> tryAs{as-IN voice?}
  tryAs -->|rare| speakAs[Speak Assamese]
  tryAs -->|no| fallback[bn-IN → hi-IN → en-IN]
  mic[Mic button naming game] --> stt[Web Speech STT en-IN only]
  stt --> match{Matches English label?}
  match -->|yes| correct[Count correct]
  match -->|no| gentle[tryAgainGentle — not wrong answer]
  bhashini[Bhashini Tier 3] -.->|future| realAs[Real Assamese ASR+TTS]
```

### 5.4 Reminder lifecycle

```mermaid
flowchart LR
  cgCreate[Caregiver creates reminder] --> api[POST /reminders]
  api --> elderlyPull[GET /reminders on elderly]
  elderlyPull --> dexieRem[(Dexie reminders)]
  dexieRem --> ui[Reminders screen]
  ui --> ack[Mark done]
  ack --> outboxAck[outbox reminder_ack]
  outboxAck --> sync[POST /sync/batch or /acknowledge]
  sync --> dashAlert[Dashboard missed alert]
```

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
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python ../../scripts/seed_judge_demo.py
uvicorn app.main:app --reload --port 8000

# 3. Elderly PWA (:5173)
cd apps/elderly-app
npm ci
copy .env.example .env            # VITE_API_URL=http://localhost:8000/api/v1
npm run dev

# 4. Caregiver dashboard (:5174)
cd apps/caregiver-dashboard
npm ci
set VITE_API_URL=http://localhost:8000/api/v1
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
| Elderly / Caregiver | `VITE_API_URL` | `http://localhost:8000/api/v1` |

### 6.4 Judge demo logins

| App | Credentials |
|-----|-------------|
| Caregiver :5174 | phone `9876543210` or `demo@smriti.local` / password `SmritiJudge2026` |
| Elderly :5173 | phone `9123456789` / PIN `2468` |

### 6.5 Production deploy (Harshit + Parth)

1. **Postgres:** Supabase or Neon → `DATABASE_URL` → `alembic upgrade head`
2. **API:** Render/Railway/Fly with same env vars + `ALLOWED_ORIGINS` = Vercel URLs
3. **Frontends:** Vercel — root `apps/elderly-app` and `apps/caregiver-dashboard`, set `VITE_API_URL`

### 6.6 Test commands

```bash
cd apps/backend && pytest
cd apps/elderly-app && npx vitest run && npm run build
cd apps/caregiver-dashboard && npm run build
```

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

Each game records: user_id, game_type, difficulty, accuracy, reaction_time, errors, hints_used, session_duration, completed_or_quit → Dexie → POST `/game-sessions` or outbox.

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
| Medium | Path maze accuracy floored at 60% | Removed floor | **FIXED** |
| Medium | Wrong GameSelect sprites | Dedicated icons for arithmetic/path | **FIXED** |
| Medium | Splash ignored localStorage paired flag | `readPairedFlag()` | **FIXED** |

### Still open (teammate polish)

| Issue | Owner |
|-------|-------|
| Background Sync API tag | Ananya |
| Local reminder notifications from Dexie | Ananya |
| Hosted Postgres + API deploy | Harshit |
| Vercel frontends | Parth |
| Bhashini Assamese voice spec | Rehan |
| Assamese community review of `as.json` | Srujna |
| 192/512 PWA icons, self-hosted fonts | Parth |
| `completedOrQuit: "quit"` on back navigation | Anirudh backlog |
| Hints feature (`needHint` i18n unused) | Backlog |
| DPDP legal review | Harshit |

---

## 9. Assamese / voice / STT / TTS reality

| Capability | Assamese UI | Reality |
|------------|-------------|---------|
| On-screen text | Full `as.json` | Works |
| TTS read-aloud | All screens | Browser often lacks `as-IN`; falls back bn/hi/en |
| STT voice naming | Hidden in Assamese mode | English STT only — tap words on screen |
| Judge script line | “Web Speech today; Bhashini Assamese on roadmap” | Say this honestly |

**Files:** `src/voice/useSpeech.ts`, `useListening.ts`, `CompanionVoice.tsx`

**Tier 3 path:** Bhashini API for `as-IN` ASR+TTS — spec owned by Rehan; not built for SIH MVP.

---

## 10. Dexie / offline schema

**DB:** `smriti_elderly` in `apps/elderly-app/src/db/dexie.ts`

| Table | Purpose |
|-------|---------|
| `sessions` | Offline game telemetry |
| `reminders` | Cached reminders + local ack |
| `memoryItems` | Family photo metadata cache |
| `outbox` | Pending writes for sync |
| `paired` | Offline re-login metadata |

**Storage rules:**
- Reminders/sessions/memories → **Dexie only** (never localStorage)
- JWT/userId/paired → `authStorage.ts` (localStorage + sessionStorage)
- Voice toggle → `localStorage` `smriti.voice`

**Outbox kinds:** `game_session`, `reminder_ack` → flush via `POST /sync/batch` when online.

---

## 11. Teammate assignments (manager view)

### Anirudh — integration lead
- [x] Monorepo, 7 games, Dexie, voice, CI, this master doc, P0 bug fixes
- [ ] Merge PR #10 after review; blockers only post-merge

### Harshit — backend / infra (P0 prod)
1. Hosted Supabase/Neon `DATABASE_URL`
2. API deploy with `ALLOWED_ORIGINS`
3. RBAC integration tests
4. Supabase Storage for family photos
5. DPDP consent legal review

### Parth — caregiver dashboard + deploy
1. Vercel deploy elderly + caregiver with prod `VITE_API_URL`
2. Live missed-reminder alerts
3. Chart polish, non-diagnostic copy
4. PWA install icons 192/512

### Ananya — offline / sync
1. Read §10 — **do not fork Dexie schema**
2. Background Sync tag OR document online-flush ceiling
3. Wire `GET /sync/status` + reminder pull on reconnect
4. `reminderScheduler.ts` — local notifications from Dexie
5. E2E: offline game → reminder ack → online batch verify

### Rehan — AI / analytics / voice Tier 3
1. Staircase engine doc for judges
2. Copy audit — zero diagnostic language
3. Dashboard chart labels — personal baseline only
4. Bhashini integration spec (endpoint, cost, fallback)

### Srujna — design / cultural / i18n
1. Design QA vs 56px touch, high contrast
2. Community Assamese review (`as.json`)
3. Verify PNG assets on all game screens
4. Elder playtest coordination (3+ Assamese speakers)

---

## 12. Judge demo script (10 minutes)

**Prep:** Postgres up, `alembic upgrade head`, `python scripts/seed_judge_demo.py`

| Step | Action | Say |
|------|--------|-----|
| 1 | Caregiver login :5174 | “Remote family monitors from Guwahati.” |
| 2 | Add reminder + upload family photo | “Content syncs to her device.” |
| 3 | Elderly splash + voice | “Bhashini Assamese when configured; honest fallback otherwise.” |
| 4 | PIN login → Home | “Date, time, you are at home.” |
| 5 | Memory Match + Arithmetic | “Six PDF cognitive domains, telemetry logged.” |
| 6 | Face recall | “Personal reminiscence — who is this?” |
| 7 | Settings Assamese + voice note | “Honest about English STT limits.” |
| 8 | Mark reminder done offline optional | “Dexie outbox, not localStorage.” |
| 9 | Caregiver refresh charts | “Peace of mind in 30 seconds.” |
| 10 | Show §1 scores | “6/10 overall; 7.5/10 local demo; hosted URL pending.” |

---

## 15. Winning path — what shipped vs teammate P0

| # | Item | Code status | Owner to finish |
|---|------|-------------|-----------------|
| 1 | **Public judge URL** | `render.yaml`, `vercel.json`, `.env.example` | Harshit: Supabase + Render; Parth: Vercel `VITE_API_URL` |
| 2 | **Bhashini Assamese TTS** | `POST /api/v1/voice/assamese-tts`, hybrid `CompanionVoice` | Rehan: add `BHASHINI_API_KEY` + service ID on Render |
| 3 | **Reminder loop** | `reminderScheduler.ts`, live `Alerts.tsx` | Ananya: test notification permission on Android PWA |
| 4 | **Hero journey** | Memory hint, adaptive level on result, face recall demo | Srujna: rehearse + Assamese copy QA |
| 5 | **Offline stunt** | No Google Fonts CDN; `/uploads` CacheFirst; Background Sync tag register | Ananya: airplane-mode rehearsal on phone |
| 6 | **Playtest video** | [`docs/playtest/PLAYTEST.md`](playtest/PLAYTEST.md) template | Srujna: record 60s clip + quote in README |

### Deploy checklist (copy-paste for Harshit/Parth)

```bash
# 1. Supabase → DATABASE_URL
# 2. Render: connect repo, use render.yaml, set env vars
# 3. alembic upgrade head && python scripts/seed_judge_demo.py on prod DB
# 4. Vercel elderly: root apps/elderly-app, VITE_API_URL=https://YOUR-API/api/v1
# 5. Vercel caregiver: root apps/caregiver-dashboard, same VITE_API_URL
# 6. ALLOWED_ORIGINS=https://YOUR-ELDERLY.vercel.app,https://YOUR-CG.vercel.app
# 7. Bhashini keys on API → Settings shows “Assamese voice (Bhashini) is active”
```

---

## 13. Path to 10/10

| Phase | Exit criteria | Owner | Target |
|-------|---------------|-------|--------|
| **A — Demo solid** | P0 bugs fixed, master doc, CI green, PR merged | Anirudh | Done |
| **B — Hosted** | API + Postgres + Vercel URLs work without local Docker | Harshit + Parth | Week 1 |
| **C — Assamese voice honest** | Bhashini keys on prod OR clear UX + community-reviewed copy | Rehan + Srujna | Week 2 |
| **D — Offline real** | Background Sync, notifications, airplane demo on phone | Ananya | Week 2 |
| **E — Elder test** | 3+ Assamese-speaking elders; issues fixed | All | Week 3 |
| **F — Production** | DPDP, RBAC tests, monitoring | Harshit | Post-SIH |

---

## 14. Git / branch policy

- **Main branch:** `main`
- **Feature branches:** short-lived `feature/*` from `main`
- **Latest winning-path PR:** `feature/sih-winning-path` → `main`

**Workflow:** PR → CI green → merge.

---

*Maintained by Anirudh P.S Yadav. Teammates: polish only — see §11.*
