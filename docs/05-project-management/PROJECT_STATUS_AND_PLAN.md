# Smriti — Project Status & Plan (Master)

**Last updated:** 2026-08-31 · Branch `feature/phase1-close-gaps` · SIH26003  
**Audience:** All six teammates, judges, and future devs  
**This is the ONLY living status/plan doc.** Architecture specs remain in `docs/00-source-of-truth/`. Problem intent: `docs/SIH-2026-problem-statement.pdf`.

---

## 1. Brutally honest current rating

| Lens | Score | What that means |
|------|-------|-----------------|
| **Full PDF vision** (8–12 games, NER voice, RL, geofencing, clinician portal, 8-state packs, clinical validation) | **~28%** | Vertical slice with all 6 PDF cognitive domains + face recall; not the full platform in PDF pages 4–26. |
| **Tier 1 MVP** (`03-features.md`) | **~72%** | Six cognitive games + face recall play end-to-end with telemetry, offline Dexie, dashboard scaffold, Assamese UI, reference art, Web Speech voice — polish and playtest still open. |
| **Judge-demo readiness** | **~75%** | Happy path works locally with seed script; hosted Postgres + Vercel deploy still on Harshit/Parth. |
| **Production readiness** | **~18%** | No real pilot users, no DPDP legal review, no Background Sync, Assamese TTS is browser-dependent. |

**One-line verdict:** Smriti is a **working hackathon MVP** with all six PDF cognitive domains playable, honest AI positioning — not yet the offline-first NER clinical platform the PDF describes.

---

## 2. Anirudh P.S Yadav — foundation built from scratch

Anirudh implemented the working MVP scaffold end-to-end while teammates were not yet on-repo.

| Area | What Anirudh built |
|------|-------------------|
| **Monorepo** | `apps/backend`, `apps/elderly-app`, `apps/caregiver-dashboard`, `packages/content-packs`, Docker Postgres, GitHub Actions CI |
| **Backend** | FastAPI, Alembic schema, JWT auth, game sessions (7 game types), adaptive staircase, analytics, reminders CRUD, memory upload, sync batch, RBAC, pytest suite |
| **Elderly PWA** | Vite PWA :5173 — splash/login/home, **7 games** (6 cognitive + face recall), Dexie offline, Workbox, i18n en/as, companions, Web Speech voice |
| **Caregiver dashboard** | :5174 — sidebar, Recharts, reminders/memories API, patient switcher |
| **Content** | Assamese/English cultural JSON, game PNG sprites, judge seed script |
| **Docs** | This master doc; deleted redundant status files |

**Harshit** owns production backend review and hosted Postgres. **Parth, Rehan, Ananya, Srujna** own refinement (§8).

---

## 3. Canonical tech stack (one stack — no React Native confusion)

| Layer | PDF suggests | **What we ship** | Port |
|-------|-------------|------------------|------|
| Elderly client | React Native | **React 18 PWA** (Vite + Workbox + Dexie) | **5173** |
| Local DB | SQLite | **Dexie / IndexedDB** (`src/db/dexie.ts`) | — |
| Caregiver UI | React/Next.js | **React / Vite** | **5174** |
| Backend | FastAPI | **FastAPI + Python 3.11** | **8000** |
| Server DB | PostgreSQL | **PostgreSQL** (Docker local; Supabase target) | — |
| Voice v1 | AI4Bharat / Bhashini | **Web Speech API** (browser TTS/STT only) | — |
| Voice v3 | Bhashini | **Documented only** — not built | — |
| Adaptive AI | RL / bandits | **Rule-based 3-up/2-down staircase** | — |
| Media | — | **Local uploads → Supabase Storage** (Harshit prod) | — |
| CI | — | **GitHub Actions** — pytest + vitest + tsc + build | — |

### Why PWA instead of React Native (say this once to judges)

1. SIH judges test via URL — zero APK friction.  
2. Offline requirement (PS point g) is met by Service Worker + IndexedDB.  
3. Business logic lives in FastAPI — RN/Capacitor is a shell swap later.  
4. Team web skills >> mobile native for hackathon timeline.

**Do not claim React Native for MVP. Do not claim native Assamese TTS/STT.**

---

## 4. PDF feature checklist (SIH26003)

| PDF requirement | Status | Notes |
|-----------------|--------|-------|
| (a) Cognitive games — 6 domains | **DONE** | Memory match, attention, sequencing, picture naming, simple arithmetic, hill path maze |
| (b) AI adaptive difficulty | **DONE** | Rule-based staircase backend + client for all games |
| (c) Multilingual + voice | **PARTIAL** | en/as UI; Web Speech TTS on all games; Assamese TTS often falls back |
| (d) Cultural themes / regional language | **PARTIAL** | Assamese pack + Bihu art + family upload API |
| (e) Reminders (medicine, meals, appointments) | **PARTIAL** | API + Dexie + elderly ack + dashboard CRUD; no local Notification API |
| (f) Caregiver dashboard + monitoring | **PARTIAL** | Live API + charts; alerts partial; not deployed prod |
| (g) Offline functionality | **PARTIAL** | Dexie outbox + `/sync/batch` + Workbox; no Background Sync tag |
| (h) Elderly-friendly mobile/tablet UI | **PARTIAL** | 56px targets, 2-screen game picker (max 4 choices); design QA pending |
| Face/name recall game | **DONE** | `face_recall` — family photos + demo fallback |
| Family photos in memory match tiles | **PARTIAL** | Mixed family + cultural sprites in deal logic |
| Full NER voice (Bhashini) | **NOT STARTED** | Tier 3 — §11 |
| RL / decline-detection ML | **NOT STARTED** | Correctly deferred |
| Geofencing / safe-return | **NOT STARTED** | Tier 3 |
| Clinician portal | **NOT STARTED** | Post-MVP |
| DPDP legal review | **NOT STARTED** | Consent in schema; legal review pending |
| Hosted production Postgres | **NOT STARTED** | Docker local; Harshit P0 |

---

## 5. All games status

| Game | Domain | `game_type` | Status |
|------|--------|-------------|--------|
| Memory Match | Memory | `memory_match` | **DONE** — family photo pairs + cultural sprites |
| Attention Tap | Attention + speed | `attention_reaction` | **DONE** — voice + telemetry |
| Daily Sequencing | Executive function | `sequencing` | **DONE** — voice + telemetry |
| Picture Naming | Language/recall | `picture_naming` | **DONE** — optional STT |
| Simple Arithmetic | Calculation | `simple_arithmetic` | **DONE** — adaptive operands, voice, telemetry |
| Hill Path Maze | Visuospatial | `path_maze` | **DONE** — 3×3–5×5 grid, hill theme, hints |
| Who Is This? | Memory / reminiscence | `face_recall` | **DONE** — uploaded family photos |

Each game records: user_id, game_type, difficulty, accuracy, reaction_time, errors, hints_used, session_duration, completed_or_quit, timestamp → Dexie outbox → POST `/game-sessions`.

Game picker: **page 1 = 4 activities, page 2 = 3 more** (elderly max-4-choices rule).

---

## 6. Dexie / offline schema (canonical)

**Source:** `apps/elderly-app/src/db/dexie.ts` (DB name `smriti_elderly`).

| Doc name | Dexie table | Purpose |
|----------|-------------|---------|
| `game_sessions_local` | `sessions` | Offline game telemetry |
| `reminders_local` | `reminders` | Cached reminders + local ack |
| `memory_items_local` | `memoryItems` | Family photo metadata cache |
| `sync_outbox` | `outbox` | Pending writes for background sync |
| *(app)* | `paired` | Offline re-login after first online pair |

**Storage rules:** Reminders/sessions/memories → **Dexie only**. JWT/userId → web storage. Voice toggle → `localStorage` (`smriti.voice` = `on`/`off`).

**Outbox kinds:** `game_session`, `reminder_ack` → flush via `POST /sync/batch` on `online`.

---

## 7. Voice — Web Speech MVP reality

| Tier | Scope | Status |
|------|-------|--------|
| **Tier 2 MVP** | TTS on splash, login, home, **all 7 games**; Settings toggle; companion animation | **Shipped** |
| **Tier 2 stretch** | Intent routing ("When is my medicine?") | Not started — Rehan |
| **Tier 3** | Bhashini Assamese ASR+TTS | Post-SIH |

### Known limits

| Issue | Reality |
|-------|---------|
| Assamese TTS | Browser often lacks `as-IN`; fallback chain `as-IN` → `bn-IN` → `hi-IN` → `en-IN` |
| Assamese STT | No browser Assamese ASR; STT uses `en-IN` when UI is Assamese |
| Double-speak | Fixed — `useSpeakText` dedupes; Home no parallel mount speaks |
| Voice off | Cancels in-flight speech when toggle off |

**Files:** `src/voice/useSpeech.ts`, `useListening.ts`, `CompanionVoice.tsx`

---

## 8. Backend gaps + security

| Gap | Priority | Owner |
|-----|----------|-------|
| Hosted Supabase/Neon `DATABASE_URL` | **P0** | Harshit |
| RBAC integration tests | P1 | Harshit |
| Register rate limiting | P1 | **DONE** |
| Background Sync / pull-on-reconnect | P1 | Ananya |
| Cloud media (Supabase Storage) | P2 | Harshit |
| DPDP legal review | P2 | Harshit |

| Security | Status |
|----------|--------|
| JWT prod guard | ✓ |
| RBAC elderly vs caregiver | ✓ |
| CORS | ✓ |
| Upload magic-byte validation | ✓ |
| Login + register rate limit | ✓ |

---

## 9. Step-by-step per teammate

### Anirudh — integration lead
- [x] Monorepo, 7 games, Dexie, voice, docs cleanup  
- [ ] Merge after team review; bugfixes when blocked only  

### Ananya — offline / sync
1. Read §6 — do not fork Dexie schema.  
2. Background Sync tag OR document online-flush ceiling.  
3. Wire `GET /sync/status` + reminder pull on reconnect.  
4. `reminderScheduler.ts` — local notifications from Dexie.  
5. E2E: offline game → reminder ack → online batch verify.  

### Rehan — AI / analytics / voice Tier 3
1. KT-AI: staircase engine doc.  
2. Audit copy — zero diagnostic language.  
3. Dashboard chart labels — personal baseline only.  
4. Bhashini integration spec (Tier 3).  

### Srujna — design / cultural / i18n
1. Design QA vs `15-ui-ux-design.md`.  
2. Community Assamese review (`as.json`).  
3. Verify PNG assets on all game screens.  
4. Companion pose polish if playtest feedback.  

### Parth — caregiver dashboard
1. Deploy Vercel with hosted `VITE_API_URL`.  
2. Live missed-reminder alerts.  
3. Chart polish + non-diagnostic copy.  

### Harshit — backend / infra
1. **P0:** Hosted Postgres + Alembic.  
2. RBAC integration tests.  
3. API deploy with `ALLOWED_ORIGINS`.  

---

## 10. Judge demo script (10 minutes)

**Prep:** Postgres up, `alembic upgrade head`, `python scripts/seed_judge_demo.py`.

| Step | Action | What to say |
|------|--------|-------------|
| 1 | Caregiver :5174 login | "Remote son monitors mother from Guwahati." |
| 2 | Add reminder + upload family photo | "Content syncs to her device." |
| 3 | Elderly :5173 splash + voice welcome | "Web Speech today, Bhashini Assamese on roadmap." |
| 4 | PIN login → Home reality orientation | "Date, time, you are at home." |
| 5 | Play Memory Match + Arithmetic | "Six cognitive domains, telemetry logged." |
| 6 | Face recall with uploaded photo | "Personal reminiscence — who is this?" |
| 7 | Settings voice off/on | "User control over audio." |
| 8 | Mark reminder done (offline optional) | "Dexie outbox, not localStorage." |
| 9 | Caregiver refresh charts | "Peace of mind in 30 seconds." |
| 10 | Show §1 rating | "~72% Tier 1 MVP, ~28% full PDF — honest." |

**Logins:** Caregiver `9876543210` / `SmritiJudge2026` · Elderly `9123456789` / PIN `2468`

---

## 11. Phase 2/3 deferred

| Item | Phase |
|------|-------|
| Bhashini / AI4Bharat Assamese voice | Phase 3 |
| RL adaptive difficulty | Phase 3 |
| Decline-detection ML | Phase 3 — no diagnostic claims in MVP |
| Geofencing / safe-return | Phase 3 |
| Clinician portal | Post-SIH |
| 8-state NER content depth | Phase 2 |
| Background Sync API tag | Phase 2 — Ananya |
| Real 60+ elder playtest | Phase 2 |

---

## 12. CI / test commands

```bash
cd apps/backend && pytest
cd apps/elderly-app && npx vitest run && npm run build
cd apps/caregiver-dashboard && npm run build
curl http://localhost:8000/health
```

---

## 13. Related docs

| Doc | Purpose |
|-----|---------|
| `docs/00-source-of-truth/` | Permanent architecture specs |
| `task-registry.yaml` | Machine-readable task board |
| `TOOLING_VERSIONS.md` | Node 20, Python 3.11 |
| `NEXT_PLAN.md` | Redirect stub → this file |
| `DEVELOPMENT_CHECKLIST.md` | Redirect stub → this file |

*Maintained by Anirudh P.S Yadav.*
