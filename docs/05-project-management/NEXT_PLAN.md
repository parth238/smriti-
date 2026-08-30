# NEXT PLAN: SIH 2026 demo (as of 2026-08-30)

This is the living phase plan. Rehan owns the original execution skeleton. Anirudh P.S Yadav (TEAM 1, Elderly UI) updated it to match the repo after PR 5 merged the SIH stack to `main`, then Rehan merged T2-AI-001/002/003 as PRs 6, 7, and 8.

**Covering note:** Anirudh landed backend, infra, dashboard scaffold, Dexie/outbox, the first staircase, and a cultural JSON pack so the SIH loop can be shown. Rehan then owned and extended the analytics files (verified in `apps/backend` on `main`: errors, hints, duration, completion, `game_type` filter, extra tests). Folder owners did not change. Covering is not a handoff. Each owner must take their files, review them, and finish the gaps below.

**How to read status:** DONE means the code is in this branch and behaves as described. PARTIAL means a start exists and must not be rewritten from scratch. NOT STARTED means do not claim it in the pitch.

Canonical feature tiers remain `docs/00-source-of-truth/03-features.md`. Voice/STT is not MVP.

---

## How to run (local demo)

Ports from `docs/05-project-management/TOOLING_VERSIONS.md`.

```bash
docker compose up -d postgres

cd apps/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

```bash
cd apps/elderly-app
npm ci
npm run dev
```

Elderly PWA: `http://localhost:5173`

```bash
cd apps/caregiver-dashboard
npm ci
npm run dev
```

Caregiver desk: `http://localhost:5174`

API docs: `http://localhost:8000/docs`

There is no linked-demo seed script yet. Create a caregiver (`POST /api/v1/auth/caregiver/register`), then an elderly profile (`POST /api/v1/auth/user/create`), then sign in on 5173 with that phone + PIN. Until that script exists, the dashboard may still show a labeled demo fallback.

---

## Phase 0: Now (this PR / already demoable)

What is already on `main` (PR 5 stack plus Rehan PRs 6-8). Owners still must review covering work that is not theirs.

### Infra and backend (covering Harshit)

- Monorepo, Node 20 / Python 3.11 pin, GitHub Actions CI, Docker Postgres 16 (`T0-INF-001`, `T0-INF-003`).
- SQLAlchemy models + Alembic `0001` / `0002` (`T1-BE-002`).
- JWT: caregiver register/login, elderly PIN login, refresh, logout, rate limit (`T1-BE-003`).
- Role check `verify_user_access` on game and analytics routes (RBAC started, not a full audit).
- `POST /game-sessions` with `client_generated_id` idempotency, session list, next-difficulty.
- `/me`, `/me/patients`, 7-day analytics vs personal baseline, trend points (Rehan PRs 6-8 added errors, hints, duration, and optional `game_type`).
- **Not done:** reminder CRUD, memory upload, `/sync/batch`, live Supabase project (`T0-INF-002`). Verified: `apps/backend/app/api/router.py` still mounts only auth, me, patients, games, analytics. `reminders` and `memory_items` tables exist; those routers do not.

### Elderly PWA 5173 (Anirudh's own slice, plus covering)

- Splash companion walk, PIN login with grandmother sit, home (clock, hills, next reminder), settings, en/as i18n, gamosa line.
- Four games routed and scoring into Dexie outbox: Memory Match and Attention have flip/bloom/difficulty depth. Sequencing (tea steps) and Picture Naming are wired and persist, with less visual craft.
- Reminders and reminiscence screens exist. Reminders are local `demoStore` / localStorage, not the API. Family photo upload is empty on purpose.
- Honest offline PIN: unpaired devices do not fake success. Previously paired devices may reopen offline.
- Dexie tables: sessions, outbox, reminder cache, paired user. Outbox flushes game sessions to `POST /game-sessions` on `online` (`T3-OS-001` / `003` partial, covering Ananya).
- Workbox via `vite-plugin-pwa`. Not a finished background-sync engine. No install prompt yet (that is Tier 2 in doc 03).
- Rule-based staircase hook + backend `adaptive_difficulty.py` and `get_difficulty_summary` (`T2-AI-001` DONE on `main` via PR 7; Anirudh covered the start, Rehan owned tests and extension). Not ML.

### Caregiver dashboard 5174 (scaffold covering Parth)

- Vite, left sidebar, Inter, Recharts, gamosa line.
- Login hits the API. If the API is down, it opens with **labeled demo**, not silent fake live data.
- Overview / Analytics / Sessions can load live sessions and 7-day charts when a caregiver is linked. Fallback is labeled demo.
- Reminders, Memories, Alerts pages still render `src/data/demo.ts`. No create/edit that hits an API.
- No multi-patient switcher UI (sitemap lists it as Tier 2; even a one-patient picker still needs polish).

### Content (covering Srujna / Ananya)

- `packages/content-packs/assamese` and `english` JSON (Assam items + Hornbill as a named NER festival).
- Palette (`gamosa-red`, `tea-garden`, `mist-blue`, `rice-white`) lives in each app's Tailwind config. `packages/ui` does not exist.
- Assets are motifs/scenes in code, not a verified photo pack. Do not call this community-signed cultural research.

### Judge path that already works if accounts are linked

Splash walk → PIN with companion sit → one game (prefer Memory Match or Attention) → result → caregiver Overview/Analytics updates from the API (or shows a labeled demo if unlinked).

That loop is the win. Protect it. Do not break it with rewrites.

---

## Phase 1: Close the honesty loop (win the demo)

Finish play → persist → caregiver chart. Then reminders/memories that are real. Then a 10-minute judge script.

Do not start Phase 2 until this list is solid.

### Remaining product gaps

1. Reminder CRUD API + elderly mark-done that syncs.
2. Memory / reminiscence upload API + caregiver UI (family photos with name, relationship, year, location).
3. Linked demo accounts script (known caregiver + grandmother PIN) so judges never hit an empty database.
4. Sequencing and Picture Naming visual craft (same care as Memory Match / Attention).
5. Dashboard: take over remaining demo pages; reminder/memory management; no diagnostic copy.
6. Multi-patient switcher polish if more than one linked person exists.
7. Assamese playtest with a real elder (not a teammate only).
8. Ten-minute judge walkthrough written and rehearsed.

### Owners (Phase 1)

**Harshit (backend / infra)**
- Take `apps/backend/` as yours. Review auth, models, Alembic, rate limit, CORS.
- Remaining APIs: reminders, memories/storage signed URLs, sync batch (or formally adopt the current per-session POST as the MVP sync).
- Env and prod: Supabase or a hosted Postgres, Render/Railway, secrets. Local Docker is only the current path.
- Do not silently revert Anirudh's schema without a migration and a team note.

**Anirudh (elderly UX)**
- Polish splash, PIN, home, Memory Match, Attention.
- Deepen Sequencing and Naming (hooks + motion + 56px targets).
- Keep i18n complete on elderly screens. Help Ananya rather than owning the pipeline forever.
- PWA: keep offline honest (mist-blue note). Install prompt is Phase 2 (doc 03 Tier 2).
- Stop covering other folders unless a Phase 1 blocker has no owner available.

**Parth (caregiver dashboard is his)**
- Take over `apps/caregiver-dashboard/`. Do not throw away the sidebar, Recharts, or labeled live/demo split.
- Replace Reminders / Memories / Alerts demo data with API calls once Harshit lands those routes.
- Chart polish. Patient picker if needed. Copy: personal baseline only, never diagnosis.
- Dashboard hosting on Vercel remains yours.

**Rehan (adaptive + analytics)**
- T2-AI-001/002/003 are on `main` (PRs 6, 7, 8): staircase + `get_difficulty_summary`, personal baseline on accuracy/reaction/errors/hints/duration/completion, analytics JSON with optional `game_type`. Not ML.
- Remaining: review Parth's dashboard copy so nothing reads as a diagnosis. Schedule KT-AI. Do not jump to RL, XGBoost, or population norms. ADR-002 still holds.

**Ananya (Dexie / outbox / SW)**
- Own `apps/elderly-app/src/db/` and the Workbox config. Do not rewrite Anirudh's start. Extend it.
- Full Dexie schema for reminders, memories, and sync metadata, not only game sessions.
- Outbox kinds beyond `game_session`. Retry/backoff. Conflict story for `client_generated_id`.
- Workbox polish. Background Sync API if the browser allows it; otherwise document the `online` flush as the MVP path.
- Reminder client scheduling (local notifications / due-time UI), still offline-safe.
- i18n pipeline ownership (catalogs, missing-key test). Strings already exist as `en.json` / `as.json`.

**Srujna (design + culture)**
- QA both apps against `docs/00-source-of-truth/15-ui-ux-design.md` (56px elderly targets, contrast, depth ≤ 2).
- Figma / token handoff. Prefer `packages/ui` over duplicated Tailwind copies, without a visual rewrite mid-demo.
- Verify cultural pack: no generic AI stock as "Assam". Motifs in code are a stand-in until real assets land.
- Motion and accessibility pass (gamosa line as loading signature, reduce-motion).
- Remaining screens that still feel scaffolded (dashboard density, naming/sequencing craft with Anirudh).

### Phase 1 exit

Judges can: install-or-browser 5173, watch the companion, PIN, play one game, see the score, open 5174, and see that same session on a chart labeled live. Reminders can be created by a caregiver and marked done by the elder. Nobody claims ML or Assamese STT.

---

## Phase 2: Stretch for SIH wow (only if Phase 1 is solid)

Tier 2 in `docs/00-source-of-truth/03-features.md` and Web Speech API in `docs/00-source-of-truth/10-integrations.md`.

| Stretch | What it is | What it is not |
|---|---|---|
| Voice demo (STT/TTS) | Browser Web Speech API, English/Hindi, "When is my medicine?" → spoken answer. Hook path already specified as `useVoice.ts`. Feature flag `VITE_ENABLE_VOICE_DEMO`. | Not MVP. Not Assamese ASR. Not Bhashini. Offline: hide voice, keep text. |
| PWA install prompt | Add-to-home-screen for judges on Chrome/Edge. | Not a native store build (Tier 3). |
| Manipuri pack | Second folder under `packages/content-packs/` to prove pack architecture. | Not a product language until English + Assamese are playtested. |
| Caregiver email/push | Missed-reminder notice beyond the dashboard. | Not required to win the demo. |
| Anomaly banner | "Reaction time +18% vs their usual week" already has a cautious note in analytics. | Not a diagnosis. |

### Knowledge transfer (KT)

KT is a team process, not a product feature. Schedule recorded 30-minute sessions so covering work does not stay tribal knowledge.

| Session | From → to | Cover |
|---|---|---|
| KT-BE | Anirudh → Harshit | Auth, Alembic, game-sessions idempotency, analytics routes, `.env.example` |
| KT-DASH | Anirudh → Parth | Dashboard shell, live vs labeled demo, Recharts payload, patient id in session |
| KT-DEXIE | Anirudh → Ananya | Dexie schema, outbox flush, Workbox plugin, what is intentionally unfinished |
| KT-AI | Anirudh → Rehan | Staircase constants, `next_difficulty` walk, personal baseline, test files |
| KT-UX | Anirudh → Srujna | Elderly tokens, companion, gamosa line, i18n keys, cultural JSON vs real assets |

**KT checklist**

- [ ] Recording stored where the team can replay it (unlisted video or call recap).
- [ ] Owner can run the slice locally without Anirudh.
- [ ] Owner's next task in `TEAM_STATUS.md` is theirs, not "Anirudh covering".
- [ ] One-pager KT deck for mentors: problem, honest MVP, judge path, what is later.

---

## Phase 3: Post-SIH / material later

Pitch these. Do not build them on this branch.

- RL / contextual bandit personalization.
- Decline-detection ML (XGBoost / speech features).
- Full NER voice: Assamese ASR/TTS via Bhashini or AI4Bharat (doc 03 Extension 3; doc 10 Tier 3).
- Speech-based cognitive research (pause, rate, word-finding).
- Clinician portal, IRB study, geofencing, 8-state packs, native wrappers, Kubernetes.

---

## Creative suggestions that help win (marked by phase)

| Idea | Phase |
|---|---|
| Judge path: splash walk → PIN with grandmother sit → one game → result → caregiver chart updates | 0-1 (protect this) |
| Gamosa line as the loading signature (already in the design language) | 0-1 |
| Honest offline in mist-blue. Never fake PIN success on an unpaired device | 0-1 (already true on elderly login) |
| Labeled "demo / not live truth" on the dashboard when the API is empty | 0-1 (already true) |
| KT one-pager for mentors | 2 (process) |
| STT stretch: "When is my medicine?" via Web Speech API (EN/HI) | 2 |
| Assamese STT/TTS via Bhashini | 3 |
| Manipuri pack as architecture proof only | 2, after EN+AS |
| Hornbill / Bihu as named culture, not generic stock | 1 (Srujna verifies) |

---

## What not to do

- Do not mark reminder or memory APIs complete. Models exist. Routes do not.
- Do not call the staircase "AI/ML" in the pitch. It is a 3-up / 2-down rule.
- Do not ship Assamese voice. Docs place Web Speech in Tier 2 and Bhashini in Tier 3.
- Do not add a second language UI until Assamese is playtested.
- Do not rewrite folders Anirudh scaffolded. Extend them.
- Do not commit `.env`.
