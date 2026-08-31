# Smriti — Project Status & Plan (Master)

**Last updated:** 2026-08-31 · Branch `feature/phase1-close-gaps` · Commit `fbc0a53` · SIH26003  
**Audience:** All six teammates, judges, and future devs  
**This is the ONLY living status/plan doc.** Architecture specs remain in `docs/00-source-of-truth/`. Problem intent: `docs/SIH-2026-problem-statement.pdf`.

---

## 1. Brutally honest current rating

| Lens | Score | What that means |
|------|-------|-----------------|
| **Full PDF vision** (8 games, NER voice, RL, geofencing, clinician portal, 8-state packs, clinical validation) | **~20%** | Credible vertical slice, not the platform in PDF pages 4–26. |
| **Tier 1 MVP** (`03-features.md`) | **~55%** | Four games play end-to-end with telemetry, offline Dexie, dashboard scaffold, Assamese UI, reference art, Web Speech voice — not elder-playtest ready. |
| **Judge-demo readiness** | **~65%** | Happy path works locally with seed script; hosted Postgres + Vercel deploy still on Harshit/Parth. |
| **Production readiness** | **~15%** | No real pilot users, no DPDP legal review, no Background Sync, Assamese TTS is browser-dependent. |

**One-line verdict:** Smriti is a **working hackathon MVP scaffold** with honest AI positioning — not yet the offline-first NER cognitive platform the PDF describes.

---

## 2. Anirudh P.S Yadav — foundation built from scratch

Anirudh implemented the working MVP scaffold end-to-end while teammates were not yet on-repo. This is not a stub demo; it is the full vertical slice others now extend.

| Area | What Anirudh built |
|------|-------------------|
| **Monorepo** | `apps/backend`, `apps/elderly-app`, `apps/caregiver-dashboard`, `packages/content-packs`, Docker Postgres, GitHub Actions CI |
| **Backend** | FastAPI, Alembic schema, JWT auth (caregiver + elderly PIN), game sessions, adaptive staircase, analytics engine, reminders CRUD, memory upload, sync batch, RBAC helpers, pytest suite |
| **Elderly PWA** | Vite PWA port 5173, splash/login/home, 4 cognitive games with reference art, Dexie offline (reminders in IndexedDB, not localStorage), Workbox precache, i18n en/as, cultural reminiscence, grandmother/grandfather companions, Web Speech voice |
| **Caregiver dashboard** | Port 5174, sidebar, Recharts analytics, reminders/memories live API + labeled demo fallback, patient switcher, reminder edit |
| **Content** | Assamese/English cultural JSON packs, Manipuri POC pack, offline precache of content + game sprites |
| **Ops** | Judge demo seed script, README deploy section, Vercel configs, this master doc |

**Harshit** owns production backend review and hosted Postgres going forward. **Parth, Rehan, Ananya, Srujna** own refinement on top of this base (§8).

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
| Adaptive AI | RL / bandits | **Rule-based 3-up/2-down staircase** | — |
| CI | — | **GitHub Actions** — pytest + vitest + tsc + build | — |

### Why PWA instead of React Native (say this once to judges)

1. SIH judges test via URL — zero APK friction.  
2. Offline requirement (PS point g) is met by Service Worker + IndexedDB, not native-only.  
3. Business logic lives in FastAPI — RN/Capacitor is a shell swap later (`03-features.md` Tier 3).  
4. Team web skills >> mobile native skills for a 6-person hackathon timeline.

**Do not claim React Native for MVP. Do not claim native Assamese TTS/STT.**

---

## 4. PDF feature checklist (SIH26003)

| PDF requirement | Status | Notes |
|-----------------|--------|-------|
| (a) Cognitive games (memory, attention, routine, pattern) | **PARTIAL** | 4 games play: memory match, attention/reaction, sequencing, picture naming |
| (b) AI adaptive difficulty | **DONE** | Rule-based staircase in backend + mirrored client |
| (c) Multilingual + voice | **PARTIAL** | en/as UI strings; Web Speech TTS/STT (Assamese TTS often falls back to bn/hi/en) |
| (d) Cultural themes / regional language | **PARTIAL** | Assamese pack + Bihu art + family upload API; community QA not done |
| (e) Reminders (medicine, meals, appointments) | **PARTIAL** | API + Dexie cache + elderly ack + dashboard CRUD; no local Notification API offline |
| (f) Caregiver dashboard + monitoring | **PARTIAL** | Live API + charts; missed-reminder alerts partial; not deployed to prod URL |
| (g) Offline functionality | **PARTIAL** | Dexie outbox + `/sync/batch` + Workbox precache; no Background Sync tag |
| (h) Elderly-friendly mobile/tablet UI | **PARTIAL** | Large targets, minimal nav; design QA vs doc 15 not signed off |
| React Native mobile app | **NOT STARTED** | We ship PWA per §3 — documented choice, not a bug |
| SQLite on device | **N/A (aligned)** | IndexedDB via Dexie — same offline-first intent |
| 8–12 game templates / 6 domains | **NOT STARTED** | 4 of 6 MVP games; arithmetic + maze are Tier 2 stretch |
| Family photos in memory match tiles | **NOT STARTED** | API + Dexie cache exist; tiles use NER sprites + optional family photos in deal logic |
| Full NER voice (Bhashini) | **NOT STARTED** | Tier 3 roadmap — see §7 |
| RL / decline-detection ML | **NOT STARTED** | Correctly deferred per doc 00 §5 |
| Geofencing / safe-return | **NOT STARTED** | Tier 3 |
| Clinician portal | **NOT STARTED** | Post-MVP |
| DPDP legal review | **NOT STARTED** | Consent fields in schema; legal review pending |
| Hosted production Postgres | **NOT STARTED** | Docker local only; Harshit P0 |

---

## 5. Dexie / offline schema (canonical)

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
| Language, text size, voice toggle | **localStorage** | UI prefs (`smriti.voice` = `on`/`off`) |
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

---

## 6. Voice — Web Speech MVP reality

| Tier | Scope | Status |
|------|-------|--------|
| **Tier 2 MVP** | Web Speech TTS on splash, login, home, all 4 games; Settings toggle; companion-speaking CSS; optional STT in Picture Naming | **Shipped** |
| **Tier 2 stretch** | Intent routing ("When is my medicine?" → read next reminder from Dexie) | Not started — Rehan spec |
| **Tier 3** | Bhashini / AI4Bharat Assamese ASR+TTS | Post-SIH; needs API keys + latency testing |

### Known bugs / limitations (honest)

| Issue | Reality | Fix path |
|-------|---------|----------|
| Assamese TTS | Web Speech often has no `as-IN` voice; we try `as-IN` → `bn-IN` → `hi-IN` → `en-IN` | Bhashini Tier 3 |
| Assamese STT | **No browser Assamese ASR**; STT uses `en-IN` even when UI is Assamese | Bhashini Tier 3 |
| Double-speak | Fixed 2026-08-31: Home and games no longer fire parallel mount + nudge speaks | — |
| Voice off | Cancels in-flight speech when toggle off | Fixed 2026-08-31 |
| Companion animation | `isSpeaking` resets on cancel; mouth animation tied to actual TTS state | Fixed 2026-08-31 |

**Files:** `src/voice/useSpeech.ts`, `useListening.ts`, `CompanionVoice.tsx`

**Do not demo Assamese voice as native quality. Say: "Web Speech today, Bhashini Assamese on roadmap."**

---

## 7. Backend gaps (honest)

| Gap | Priority | Owner |
|-----|----------|-------|
| Hosted Supabase/Neon `DATABASE_URL` | **P0** | Harshit |
| RBAC integration tests on reminders/memories/sync | P1 | Harshit |
| Register endpoint rate limiting | P1 | **Fixed 2026-08-31** — IP + phone keys |
| Consistent JSON error shape on 422 validation | P1 | **Fixed 2026-08-31** |
| Background Sync / pull-on-reconnect | P1 | Ananya |
| Cloud media storage (Supabase Storage) | P2 | Harshit |
| DPDP legal review of consent flows | P2 | Harshit |

### Security quick pass

| Area | Status |
|------|--------|
| JWT prod guard (weak secret rejected) | ✓ |
| RBAC elderly vs caregiver | ✓ |
| CORS via `ALLOWED_ORIGINS` | ✓ |
| Upload magic-byte validation | ✓ |
| Login rate limit (5 attempts / 15 min lockout) | ✓ |
| Register rate limit | ✓ (2026-08-31) |
| DPDP legal review | ⚠ pending |
| HTTPS at deploy | ⚠ required |

---

## 8. Step-by-step plan per teammate (in order)

### Anirudh — integration lead

- [x] Monorepo scaffold, 4 games, Dexie, voice module, reference art, this doc  
- [ ] Merge `feature/phase1-close-gaps` after team review  
- [ ] Unblock only when asked — others own their lanes now  

### Ananya — offline / sync / notifications

1. Read §5 (Dexie schema — do not fork).  
2. Implement Background Sync tag OR document online-flush as MVP ceiling in PR.  
3. Wire `GET /sync/status` + `syncReminders()` pull on reconnect in `useOfflineSync.ts`.  
4. Build `reminderScheduler.ts` — schedule local notifications from Dexie `scheduledTime`.  
5. Write manual E2E script: play game offline → mark reminder → go online → verify batch ack.  
6. Harden outbox retry/backoff in `syncOutbox.ts`.

### Rehan — AI / analytics / voice Tier 3

1. KT-AI session: document staircase engine (`apps/backend/app/services/adaptive_difficulty.py`).  
2. Audit all user-facing copy — zero diagnostic language (doc 07 §4).  
3. Review dashboard chart labels with Parth — personal baseline only, no population norms.  
4. Write Bhashini integration spec: endpoints, fallback, latency budget, Assamese test phrases.  
5. Optional: intent router spec for "When is my medicine?" using Dexie reminders.

### Srujna — design / cultural content / i18n

1. Design QA vs `15-ui-ux-design.md` — 56px tap targets, palette, no sidebar on elderly app.  
2. Community review of Assamese strings (`as.json`) and cultural JSON packs.  
3. Verify all games use PNG assets in `public/assets/games/` — no generic SVG where PNG exists.  
4. Refine companion poses if needed; replace Home nav Motif SVGs with final art (stretch).  
5. Family photo tiles inside Memory Match (stretch, needs API wiring).

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

## 9. Judge demo script (15 minutes)

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
| 9 | All | Show this doc §1 rating table | "We are ~55% of Tier 1 MVP, ~20% of full PDF — honest, not overselling AI." |

**Fallback if API down:** Elderly app still plays games offline; dashboard shows labeled demo data.

**Demo logins:**

| App | Login |
|-----|-------|
| Caregiver (5174) | phone `9876543210` or email `demo@smriti.local`, password `SmritiJudge2026` |
| Elderly (5173) | phone `9123456789`, PIN `2468` |

---

## 10. CI / test commands

```bash
# Backend
cd apps/backend && pytest

# Elderly frontend
cd apps/elderly-app && npx vitest run && npm run build

# Caregiver dashboard
cd apps/caregiver-dashboard && npm run build
```

GitHub Actions: `.github/workflows/ci.yml` — runs on PR/push to `main`.

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

## 12. Related docs (do not duplicate status here)

| Doc | Purpose |
|-----|---------|
| `docs/00-source-of-truth/` | Permanent architecture, features, API specs |
| `task-registry.yaml` | Machine-readable task board (aligned to §1 ratings) |
| `TOOLING_VERSIONS.md` | Node 20, Python 3.11 pin |
| `NEXT_PLAN.md` | Redirect stub → this file |

---

*Maintained by Anirudh P.S Yadav. Update §1 when completion % shifts by ≥5 points or a Tier 1 item ships.*
