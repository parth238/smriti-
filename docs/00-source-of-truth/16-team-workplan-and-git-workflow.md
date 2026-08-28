# 16 — Team Work Plan & Git Workflow (Smriti / SIH26003)

**Purpose of this doc:** This is the single execution playbook for the 6-person team, split into 3 pairs. It tells each pair exactly what to build, in what order, how to use Git/GitHub as a pair and as a team, and gives ready-to-use prompts (for Claude / Claude Code) for every major task. Follow it top to bottom. Every task references the doc(s) it implements — per doc 07 §6, if reality drifts from a doc, fix the doc in the same PR.

**Source of truth for scope:** Doc 00 (§7 MVP) and Doc 03 (Tier 1 only). Do not build Tier 2/3 items until every Tier 1 item on your pair's list is done, reviewed, and demoed once end-to-end.

---

## 0. Team Structure

| Team | Members | Primary surface | Backup/overlap |
|---|---|---|---|
| **Team 1 — Core Platform** | Harshit Divekar + Anirudh P.S Yadav | Backend (FastAPI, DB, Auth, API) + Elderly App shell/games | Reviews Team 2 & 3 backend PRs |
| **Team 2 — Intelligence & Dashboard** | Parth Shrivastav + Mohd Rehan | Caregiver Dashboard (React) + Adaptive Difficulty/Analytics services | Reviews Team 1 API contracts |
| **Team 3 — Offline, Content & Design System** | Ananya + Srujna | Offline sync layer (IndexedDB/Dexie/Service Worker), localization, content packs + UI/UX design system implementation | Reviews Team 1 & 2 UI against design tokens |

**Why this split (not the original 1-per-person mapping in doc 00/06):** pairing forces continuous review, halves "bus factor" risk, and each pair owns one coherent vertical slice end-to-end (schema → API → UI) instead of a horizontal layer, which is what actually gets demoed. Doc 06's ownership table still applies for *file-level* ownership inside each pair's folders — this doc governs *task sequencing and Git process*.

---

## 1. Repository Setup (do this once, Team 1 leads, everyone participates)

### 1.1 Steps — Repo Creation

1. **Harshit** creates the GitHub org/repo: `smriti` (private during dev, can go public near submission if SIH rules allow).
2. Set default branch to `main`. Protect it immediately:
   - Settings → Branches → Add rule for `main`
   - Require pull request before merging
   - Require 1 approval (2 approvals for anything touching `apps/backend/app/api/**` or `auth`) — per doc 07 §6
   - Require status checks to pass (CI) before merge — checks won't exist yet, revisit after §1.4
   - Do not allow force-push, do not allow deletion
3. Add all 6 members as collaborators with **Write** access (not Admin, except Harshit).
4. Create the folder skeleton exactly as in doc 06, with empty `.gitkeep` files where needed, and commit the 14+ docs into `docs/`.
5. Add `.gitignore` (Node + Python + `.env` + `.env.local` + `venv/` + `node_modules/` + `dist/`) — verify `.env` is ignored **before the first real commit**, per doc 12 §8.
6. Add `.env.example` for each app (backend, elderly-app, caregiver-dashboard) using the variable names from doc 12 — placeholder values only.
7. Create `docker-compose.yml` for local Postgres (per doc 11 §2).
8. Push initial skeleton directly to `main` (this one time only — before branch protection makes it awkward). Tag it `v0.0.0-skeleton`.

### 1.2 Branch Naming Convention (doc 06, restated — everyone uses this, no exceptions)

```
feature/<area>-<short-desc>     e.g. feature/backend-auth-jwt
fix/<area>-<short-desc>         e.g. fix/sync-conflict-dedupe
docs/<short-desc>               e.g. docs/update-api-spec
chore/<short-desc>              e.g. chore/ci-pipeline-setup
```
`<area>` values in use: `backend`, `elderly`, `dashboard`, `sync`, `content`, `design`, `infra`.

### 1.3 Standard Pair Workflow (every task, every pair, no exceptions)

1. Pull latest `main`: `git checkout main && git pull origin main`
2. Create branch: `git checkout -b feature/<area>-<short-desc>`
3. **Driver/navigator split inside the pair** (recommended, not mandatory): one person writes the first pass, the other reviews/tests locally *before* it becomes a PR — this catches obvious bugs before CI/reviewers see them.
4. Commit style (doc 07): `type(scope): message` — e.g. `feat(auth): add caregiver register endpoint`, `fix(games): correct staircase level-down condition`.
5. Push branch: `git push -u origin feature/<area>-<short-desc>`
6. Open PR against `main`. PR description **must** state which doc section it implements (e.g. "Implements 05-api.md §1 Auth endpoints") — doc 07 §6.
7. Request review from **the other pair member first**, then tag one person from a different team for the required outside approval (2 for backend/auth PRs).
8. Address comments, get approval, **squash-and-merge** (keeps `main` history readable).
9. Delete the branch after merge.
10. If your PR changes behavior not reflected in docs 00–15, update the relevant doc **in the same PR** (doc 07 §6 — non-negotiable).

### 1.4 CI Setup (Team 1, Harshit — do this right after skeleton is pushed)

Create `.github/workflows/ci.yml` per doc 11 §3:
- Backend job: install deps → `ruff check` → `black --check` → `pytest`
- Frontend job (matrix over `elderly-app` and `caregiver-dashboard`): `npm ci` → `eslint` → `tsc --noEmit` → `npm run build`
- Once green once, go back to branch protection settings and mark this workflow as a **required status check**.

**Prompt to use (Claude Code, run from repo root):**
```
Set up GitHub Actions CI for this monorepo per docs/11-deployment.md §3.
Create .github/workflows/ci.yml with two jobs: "backend" (Python 3.11,
ruff check, black --check, pytest, working-directory apps/backend) and
"frontend" (Node 20, matrix over apps/elderly-app and apps/caregiver-dashboard,
npm ci, eslint, tsc --noEmit, npm run build). Trigger on pull_request to main.
Keep it minimal — no deploy step yet, that's a separate workflow.
```

---

## 2. TEAM 1 — Harshit Divekar + Anirudh P.S Yadav (Core Platform)

**Owns:** `apps/backend/**` (all of it initially), `apps/elderly-app/**` (shell, routing, auth screens, game engines).
**Docs to live in:** 01, 02 §4, 04, 05, 06, 08, 12.
**Split inside the pair:** Harshit = backend-heavy (DB, auth, API, services skeleton). Anirudh = frontend-heavy (elderly app shell, game UIs). Both review each other's PRs since the API contract is the seam between you two — talk before either of you changes a request/response shape.

### 2.1 Task Sequence (build in this order — each depends on the previous)

| # | Task | Owner | Branch | Docs |
|---|---|---|---|---|
| 1 | Postgres schema + Alembic migrations (all Tier-1 tables) | Harshit | `feature/backend-db-schema` | 04 |
| 2 | Pydantic `Settings` config loader, fail-fast on missing env | Harshit | `feature/backend-config` | 12 §7 |
| 3 | Auth: caregiver register/login, JWT issue/verify, password hashing | Harshit | `feature/backend-auth-caregiver` | 05 §1, 08 §2 |
| 4 | Auth: elderly user create (caregiver-mediated) + PIN login | Harshit | `feature/backend-auth-elderly` | 05 §1, 08 §2 |
| 5 | `deps.py::verify_user_access` shared authorization dependency | Harshit | `feature/backend-authz-deps` | 08 §3 |
| 6 | Users & caregiver-links CRUD endpoints | Harshit | `feature/backend-users-links` | 05 §2 |
| 7 | Games catalog + game-sessions endpoints (no adaptive logic yet, stub `next_difficulty`) | Harshit | `feature/backend-games-sessions` | 05 §3, 04 |
| 8 | Reminders CRUD + acknowledge endpoint | Harshit | `feature/backend-reminders` | 05 §4 |
| 9 | Elderly app project scaffold: Vite+TS+Tailwind, routing skeleton matching doc 14 sitemap, i18n setup (en.json/as.json stubs) | Anirudh | `feature/elderly-app-scaffold` | 06, 14 §1 |
| 10 | Elderly app: Login screen (phone+PIN) wired to `/auth/user/login` | Anirudh | `feature/elderly-login` | 05 §1, 15 §2 |
| 11 | Elderly app: Home / Reality Orientation screen | Anirudh | `feature/elderly-home` | 09 §2, 15 §2.5 |
| 12 | Elderly app: Game Select screen (4 tiles, routes to game engines) | Anirudh | `feature/elderly-game-select` | 03, 14 §1 |
| 13 | Elderly app: Memory Matching game (playable, posts to local state first) | Anirudh | `feature/elderly-game-memory-match` | 03 |
| 14 | Elderly app: Attention/Reaction game | Anirudh | `feature/elderly-game-attention` | 03 |
| 15 | Elderly app: Sequencing game | Anirudh | `feature/elderly-game-sequencing` | 03 |
| 16 | Elderly app: Picture Naming game | Anirudh | `feature/elderly-game-naming` | 03 |
| 17 | Wire all 4 games' results to `POST /game-sessions` (online path only for now) | Anirudh + Harshit (pairing session) | `feature/elderly-games-api-wire` | 05 §3, 13 §2 |
| 18 | Elderly app: Reminders list screen | Anirudh | `feature/elderly-reminders-screen` | 05 §4, 14 §1 |
| 19 | Elderly app: Settings screen (language toggle, text size, sign out) | Anirudh | `feature/elderly-settings` | 14 §1 |

### 2.2 Step-by-Step — Task 1 (example of the level of detail to apply to every task)

1. `git checkout main && git pull && git checkout -b feature/backend-db-schema`
2. `cd apps/backend && python -m venv venv && source venv/bin/activate`
3. `pip install fastapi sqlalchemy alembic psycopg2-binary pydantic-settings argon2-cffi python-jose`
4. `pip freeze > requirements.txt`
5. Write SQLAlchemy models under `app/models/` for every table in doc 04 §2 exactly as specified (column names, types, nullability, FKs).
6. `alembic init app/db/migrations`, configure `alembic.ini` + `env.py` to read `DATABASE_URL` from settings.
7. `alembic revision --autogenerate -m "initial schema"`, review the generated migration by hand (autogenerate misses some constraints — check unique/indexes from doc 04 §3 are present).
8. `docker compose up -d postgres && alembic upgrade head`
9. Verify tables exist: `psql $DATABASE_URL -c '\dt'`
10. Write a rollback test: `alembic downgrade -1 && alembic upgrade head` — must succeed cleanly (doc 11 §7).
11. Commit, push, open PR. Tag Anirudh for review + one Team 2/3 member for the required second approval (auth-adjacent).

**Prompt to use (Claude Code):**
```
Implement the Postgres schema from docs/04-database.md §2 as SQLAlchemy models
under apps/backend/app/models/ (one file per entity: user.py, caregiver.py,
game.py, game_session.py, reminder.py, memory_item.py, performance_metric.py,
alert.py, sync_event.py — plus a caregiver_user_link.py association model).
Match column names, types, nullability, and FKs exactly as specified in the doc.
Then set up Alembic under apps/backend/app/db/migrations, generate the initial
migration, and add the indexes listed in doc 04 §3. Do not add any table or
column not in the doc — flag anything ambiguous instead of guessing.
```

### 2.3 Step-by-Step — Task 3 (Auth) — apply same rigor

1. Branch from latest `main` (Task 1 & 2 must be merged first).
2. `pip install python-jose[cryptography] passlib argon2-cffi`
3. `app/core/security.py`: `hash_password`, `verify_password` (argon2id), `create_access_token`, `create_refresh_token`, `decode_token` — per doc 08 §2, §4.
4. `app/schemas/auth.py`: Pydantic request/response models matching doc 05 §1 exactly.
5. `app/api/v1/auth.py`: implement `/auth/caregiver/register`, `/auth/caregiver/login` per the flow diagram in doc 13 §1.
6. Rate limiting middleware/dependency: 5 attempts/min per doc 05 §10 and doc 08 §4 — use a simple in-memory or Redis-free sliding window for MVP (document the limitation).
7. Write `pytest` tests: register success, duplicate email rejected, login wrong password rejected, login success returns token pair, token decodes correctly.
8. Ensure **no password ever appears in logs** — grep your own diff for `print(` / logger calls before opening the PR.
9. PR requires **2 approvals** (auth-touching, per doc 07 §6).

**Prompt to use:**
```
Implement caregiver auth per docs/08-auth-security.md §2 and docs/05-api.md §1.
Add POST /auth/caregiver/register and POST /auth/caregiver/login to
apps/backend/app/api/v1/auth.py. Passwords hashed with argon2id via
app/core/security.py. Issue JWT access_token (15 min, from settings) and
refresh_token (30 days, stored server-side hashed per doc 08 §2). Add rate
limiting: 5 failed attempts/min → 15 min lockout per account (doc 08 §4).
Write pytest tests for: successful register, duplicate email/phone rejection,
wrong-password login rejection, successful login token shape. Never log
raw passwords or tokens.
```

### 2.4 Team 1 Checkpoints

- **Checkpoint 1A (end of backend Tasks 1–5):** Can register a caregiver, log in, get a token, and a protected route rejects an invalid token. Demo this to the whole team on a sync call before proceeding.
- **Checkpoint 1B (end of backend Tasks 6–8):** Full Postman/Swagger (`/docs`) walkthrough — caregiver creates an elderly user, links it, creates a reminder, submits a fake game session. Share the `/docs` URL with Team 2 (they need it to build against).
- **Checkpoint 1C (end of frontend Tasks 9–12):** Elderly app runs locally, login screen successfully hits the real backend, Home screen renders reality-orientation data.
- **Checkpoint 1D (end of Task 17):** One full loop works online: elderly user plays a game in the browser → session lands in Postgres → visible via `/users/{id}/game-sessions`. **This is the single most important integration checkpoint for the whole project** — do not proceed to offline work (Team 3) integration until this is solid.

---

## 3. TEAM 2 — Parth Shrivastav + Mohd Rehan (Intelligence & Dashboard)

**Owns:** `apps/caregiver-dashboard/**`, `apps/backend/app/services/adaptive_difficulty.py`, `apps/backend/app/services/analytics_engine.py`, `apps/backend/app/api/v1/analytics.py`, `apps/backend/app/api/v1/alerts.py`.
**Docs to live in:** 02 §4–§5, 03 (Analytics/Alerts rows), 05 §3/§7/§8, 12 §5–§6, 15 §3.
**Split inside the pair:** Rehan = adaptive difficulty + analytics engine (Python/backend service logic). Parth = dashboard UI (React/Recharts). Same seam-awareness rule as Team 1 — the analytics API response shape is the contract between you two.

**Dependency:** Cannot meaningfully start until Team 1's Checkpoint 1B is done (needs real auth + game_sessions table to build against). Until then: scaffold the dashboard UI with mock data, and write the adaptive-difficulty logic as pure functions with unit tests (no DB dependency needed for this part — doc 02 §4's rule is deterministic and testable in isolation).

### 3.1 Task Sequence

| # | Task | Owner | Branch | Docs |
|---|---|---|---|---|
| 1 | Adaptive difficulty engine — pure function `get_next_difficulty()`, unit-testable, config from doc 12 §5 constants | Rehan | `feature/backend-adaptive-difficulty` | 02 §4, 12 §5 |
| 2 | Wire adaptive difficulty into `POST /game-sessions` response + `GET /games/{type}/next-difficulty` | Rehan (pairs with Harshit for the wiring PR) | `feature/backend-difficulty-wire` | 05 §3, 13 §2 |
| 3 | Analytics engine — rolling 7d/30d accuracy, reaction-time delta vs baseline, completion rate (Pandas) | Rehan | `feature/backend-analytics-engine` | 02 §5, 12 §6 |
| 4 | Analytics API endpoints (`/analytics`, `/analytics/baseline`, `/analytics/trend`) | Rehan | `feature/backend-analytics-api` | 05 §7 |
| 5 | Alerts: scheduled job for missed reminders + performance-deviation alert generation, alerts API | Rehan | `feature/backend-alerts` | 05 §8, 13 §7, 07 §4 (plain-language rule!) |
| 6 | Caregiver dashboard scaffold: Vite+TS+Tailwind+Recharts, sidebar nav per doc 14 §3 | Parth | `feature/dashboard-scaffold` | 06, 14 §3 |
| 7 | Dashboard: Login/Register screens | Parth | `feature/dashboard-auth` | 05 §1 |
| 8 | Dashboard: Patient Overview screen | Parth | `feature/dashboard-patient-overview` | 14 §3 |
| 9 | Dashboard: Analytics screen — accuracy + reaction-time trend charts with **dashed baseline reference line** (doc 15 §3.3, doc 07 §4 rule #2) | Parth | `feature/dashboard-analytics-ui` | 02 §5, 15 §3 |
| 10 | Dashboard: Session History table | Parth | `feature/dashboard-sessions` | 14 §3 |
| 11 | Dashboard: Reminder Management (create/edit/delete) | Parth | `feature/dashboard-reminders` | 05 §4, 14 §3 |
| 12 | Dashboard: Alerts feed + notice-card styling (Marigold border, never red — doc 15 §3.4) | Parth | `feature/dashboard-alerts-ui` | 05 §8, 15 §3.4 |

### 3.2 Step-by-Step — Task 1 (Adaptive Difficulty, build this first, no dependencies)

1. `git checkout main && git pull && git checkout -b feature/backend-adaptive-difficulty`
2. Create `apps/backend/app/services/adaptive_difficulty.py`.
3. Define constants exactly as in doc 12 §5 (`STRONG_ACCURACY_THRESHOLD=80`, `POOR_ACCURACY_THRESHOLD=50`, `ROUNDS_TO_LEVEL_UP=3`, `ROUNDS_TO_LEVEL_DOWN=2`, `MIN_DIFFICULTY=1`, `MAX_DIFFICULTY=5`) — import from `core/config.py`, don't hardcode.
4. Implement `get_next_difficulty(recent_sessions: list[SessionAccuracy], current_difficulty: int) -> int` exactly matching the rule in doc 02 §4.
5. Write exhaustive `pytest` unit tests: 3 strong rounds → level up (capped at MAX); 2 poor rounds → level down (floored at MIN); mixed rounds → unchanged; empty history → unchanged at current level.
6. No DB/API code in this PR — keep it a pure, framework-free function so it's trivially swappable for v2 (per doc 02 §4's explicit interface-stability note).
7. PR, 1 review from Parth, merge.

**Prompt to use:**
```
Implement apps/backend/app/services/adaptive_difficulty.py per docs/02-system-design.md §4
and the constants in docs/12-config.md §5. Function signature:
get_next_difficulty(recent_sessions: list[float], current_difficulty: int) -> int
where recent_sessions is a list of accuracy percentages, most recent last.
Rule: if the last 3 rounds are all >= STRONG_ACCURACY_THRESHOLD, increase
difficulty by 1 (capped at MAX_DIFFICULTY). Elif the last 2 rounds are both
< POOR_ACCURACY_THRESHOLD, decrease by 1 (floored at MIN_DIFFICULTY). Else
unchanged. Keep this function pure/framework-free — no DB or FastAPI imports —
per the doc's note that this interface must stay stable when swapped for a
contextual bandit in v2. Write exhaustive pytest unit tests covering all three
branches plus edge cases (empty history, fewer than 3 sessions available).
```

### 3.3 Step-by-Step — Task 9 (Analytics UI, the highest-risk-of-drift task)

1. Branch from `main` (needs Task 4 merged — real analytics API available).
2. `npm install recharts`
3. Build `TrendChart.tsx` in `components/charts/` — a reusable line chart component: takes `data`, `metricKey`, `baselineValue`.
4. **Critical rule check before opening PR (doc 07 §4 rule #2 + doc 15 §3.3):** the chart must show a *dashed baseline reference line* using the user's own historical baseline — never a population "normal range" band. Re-read doc 15 §3.3 and doc 02 §5 before writing the copy under the chart.
5. Tooltip copy must be plain-language ("18% higher than usual"), never clinical phrasing — pull the exact `note` field the backend already generates (doc 05 §7 sample response) rather than reformatting it client-side, to avoid copy drift between backend and frontend.
6. Colors: Tea Garden for the trend line, Gamosa Red reserved only for the deviation-highlight line (doc 15 §3.3) — pull these as CSS variables/tokens, don't hardcode hex in the component.
7. PR, tag Srujna for a design-system compliance review (color/token usage) in addition to Rehan's functional review.

**Prompt to use:**
```
Build the Caregiver Dashboard Analytics screen per docs/14-sitemap-navigation.md §3
and docs/15-ui-ux-design.md §3. Use Recharts. Fetch GET /users/{id}/analytics?period=7d
and GET /users/{id}/analytics/trend?metric=accuracy&days=90. Render two trend
line charts (accuracy, reaction time) with the personal baseline as a dashed
reference line — never a population range. Use color tokens: Tea Garden
(#4B6E58) for the main trend line, Gamosa Red (#A8342A) only for a
deviation-from-baseline highlight, per doc 15 §3.3. Surface the backend's
`note` field verbatim in a tooltip/caption rather than writing new copy —
it's already worded per doc 07 §4's plain-language rule. Base body text 15px,
Inter typeface, per doc 15 §3.1.
```

### 3.4 Team 2 Checkpoints

- **Checkpoint 2A:** Adaptive difficulty unit tests all pass, function reviewed and merged, before touching any API wiring.
- **Checkpoint 2B:** Dashboard scaffold + login work against Team 1's real auth endpoints (not mocks) — confirms Team 1↔Team 2 contract match. Do this the same day Team 1 hits Checkpoint 1B.
- **Checkpoint 2C:** Full dashboard demo — log in as caregiver, see a patient's real trend charts (seeded from a few dozen fake sessions Rehan scripts via `/game-sessions` in a loop), create/edit a reminder, see an alert. Cross-check every alert/tooltip string against doc 07 §4 before calling this checkpoint done — this is the rule most likely to get accidentally violated under time pressure.

---

## 4. TEAM 3 — Ananya + Srujna (Offline, Content & Design System)

**Owns:** `apps/elderly-app/src/db/**` (Dexie/IndexedDB), `apps/elderly-app/src/serviceWorker.ts`, `apps/elderly-app/src/hooks/useOfflineSync.ts`, `apps/backend/app/api/v1/sync.py`, `packages/content-packs/**`, the design-token implementation (Tailwind config, shared component styling) across both frontend apps.
**Docs to live in:** 01 §2/§4, 02 §7, 04 §4–§5, 05 §6, 09 §5/§7, 10 §5, 15 (all).
**Split inside the pair:** Ananya = offline sync engineering (Dexie, Service Worker, sync API). Srujna = design system implementation + content pack authoring (works closely with Anirudh/Parth since her output *becomes* their component styling).

**Dependency:** Srujna's design-token work (Tailwind config, color/type tokens) should start **immediately** in parallel with Team 1 — it's a pure-frontend, no-backend-dependency task and everyone else needs it early to avoid restyling work later. Ananya's sync work depends on Team 1's Checkpoint 1D (needs a working online game-session flow to build the offline mirror of).

### 4.1 Task Sequence

| # | Task | Owner | Branch | Docs |
|---|---|---|---|---|
| 1 | Tailwind config with full design-token set (colors, type scale, spacing) for both apps, per doc 15 §2.1/§2.2/§3 | Srujna | `feature/design-tokens-setup` | 15 |
| 2 | Gamosa-motif SVG asset (loading indicator + card-border accent), a few weight/color variants | Srujna | `feature/design-gamosa-motif` | 15 §2.5, §4 |
| 3 | Shared component library pass: Button, Card, Modal, Toast, Input, Language toggle — styled to spec | Srujna | `feature/design-shared-components` | 15 §4 |
| 4 | Cultural content pack v1 (Assamese): `strings.json`, `cultural-media.json` — Bihu, Hornbill, local landmarks/food, sourced + `source` field recorded per item (doc 07 §3) | Srujna (content), Ananya (schema/loader) | `feature/content-assamese-pack` | 06, 10 §5, 07 §3 |
| 5 | i18n wiring: `en.json`/`as.json` fully populated for all Tier-1 screens, language-toggle hook | Srujna + Anirudh (shared PR) | `feature/i18n-assamese-strings` | 03, 06 |
| 6 | Dexie schema setup (`game_sessions_local`, `reminders_local`, `memory_items_local`, `sync_outbox`) | Ananya | `feature/offline-dexie-schema` | 04 §4 |
| 7 | Optimistic local-write flow: game session writes to Dexie instantly, UI shows result before sync | Ananya | `feature/offline-optimistic-writes` | 02 §3, 13 §3 |
| 8 | Service Worker (Workbox) setup: app-shell precaching + Background Sync registration | Ananya | `feature/offline-service-worker` | 01 §2, 11 §6 |
| 9 | `POST /sync/batch` backend endpoint — idempotent on `client_generated_id` | Ananya (pairs with Harshit) | `feature/backend-sync-batch` | 05 §6, 04 §3 |
| 10 | `GET /sync/status` backend endpoint — pull server-side changes since timestamp | Ananya | `feature/backend-sync-status` | 05 §6 |
| 11 | `useOfflineSync` hook — orchestrates outbox flush on reconnect, pulls down server changes | Ananya | `feature/offline-sync-hook` | 09 §5 |
| 12 | Media caching for reminiscence content (offline-viewable after first sync) | Ananya | `feature/offline-media-cache` | 09 §5, §7 |
| 13 | Reminiscence gallery screens (Personal + Cultural) wired to content pack + memory-items API | Srujna + Anirudh (shared PR) | `feature/elderly-reminiscence-gallery` | 05 §5, 14 §1 |

### 4.2 Step-by-Step — Task 1 (Design Tokens — start this on Day 1, no dependencies)

1. `git checkout main && git pull && git checkout -b feature/design-tokens-setup`
2. In both `apps/elderly-app/tailwind.config.ts` and `apps/caregiver-dashboard/tailwind.config.ts`, define the color palette from doc 15 §2.1 as named theme colors (`rice-white`, `deep-hill`, `gamosa-red`, `tea-garden`, `mist-blue`, `marigold`) — **exact hex values**, not approximations.
3. Add the type scale from doc 15 §2.2 as custom `fontSize` tokens (`display`, `h1`, `h2`, `body-lg`, `body`, `button-label`) with correct weight/line-height pairs.
4. Elderly app: set `body` as the **default** text size (18px is the floor, `body-lg` 22px is the actual default per doc 15 §2.2 — read that carefully, it's a common misread).
5. Dashboard: base body 15px, Inter typeface, per doc 15 §3.1 — a **different** scale from the elderly app, intentionally.
6. Add spacing scale on an 8px base unit.
7. Write a one-page `docs/design-tokens-usage.md` (quick internal reference) so Anirudh/Parth don't have to re-read doc 15 in full every time — link back to doc 15 as source of truth.
8. PR, request review from Srujna's pair (Ananya) + one member each from Team 1 and Team 2 (they're the consumers).

**Prompt to use:**
```
Set up Tailwind design tokens for both apps/elderly-app and
apps/caregiver-dashboard per docs/15-ui-ux-design.md §2.1, §2.2, and §3.
Elderly app: exact colors rice-white(#FBF9F4), deep-hill(#1E2A2F),
gamosa-red(#A8342A), tea-garden(#4B6E58), mist-blue(#7C93A3),
marigold(#E0A542). Type scale as custom fontSize tokens matching the
table in §2.2 exactly (display 40px/700, h1 32px/600, h2 26px/600,
body-lg 22px/400 as the default body size, body 18px/400 as the
minimum floor, button-label 24px/600). Dashboard uses the same color
tokens but Inter typeface, 15px base body, 20-28px headings, per §3.1.
8px spacing base unit for both. Do not invent any color or size not
listed in the doc.
```

### 4.3 Step-by-Step — Task 9 (Sync Batch endpoint — highest-risk task, pairs across teams)

1. Requires doc 04 schema (Team 1 Task 1) and a stable `game_sessions`/`reminders` shape merged first.
2. Branch, schedule a 30-min pairing call with Harshit before writing code — this endpoint touches his tables.
3. `apps/backend/app/api/v1/sync.py`: accept the batch shape from doc 05 §6 sample request.
4. Implementation: for each item, dispatch by `type` (`game_session` / `reminder_ack`) to the matching service function; **reuse** the same insert logic Task 1/8 (Team 1) already wrote for the online path — do not duplicate business logic per doc 07 §1 (Backend rule: business logic lives in `services/`, routes stay thin).
5. Idempotency: `INSERT ... ON CONFLICT (client_generated_id) DO NOTHING`-equivalent via SQLAlchemy, return `409`-as-success-not-error per doc 05 §9 (duplicate is not an error).
6. Log a `sync_events` row per batch (doc 04 `sync_events` table) — `status: success/partial/failed`, `batch_size`.
7. Write tests: full batch success, partial failure (one bad item, rest succeed, correct per-item status array returned), replayed batch (same `client_generated_id` twice) is a no-op the second time.
8. PR needs 2 approvals (touches core data tables) — Harshit + Ananya's usual reviewer.

**Prompt to use:**
```
Implement POST /sync/batch per docs/05-api.md §6 and docs/04-database.md
(sync_events table). Accept {device_id, items: [{type, payload}]} where
type is "game_session" or "reminder_ack". Reuse the existing service
functions from app/services/ used by the online POST /game-sessions and
POST /reminders/{id}/acknowledge endpoints — do not duplicate insert logic
in this route, per docs/07-rules.md §1 (routes stay thin, business logic
in services/). Process idempotently on client_generated_id (a duplicate
is not an error, per doc 05 §9 — return success with a note it was
already synced). Log one row to sync_events per batch call with status
success/partial/failed and batch_size. Return a per-item status array in
the response. Write pytest tests: full success, partial failure with
mixed item types, and idempotent replay of an already-synced batch.
```

### 4.4 Team 3 Checkpoints

- **Checkpoint 3A (Task 1–3 done, Day 1–2):** Design tokens merged, shared components render correctly in Storybook or a quick test page — share screenshots with the whole team before Anirudh/Parth start building real screens against them, to avoid rework.
- **Checkpoint 3B (Task 4–5 done):** Language toggle switches every Tier-1 screen's text between English and Assamese with no missing-key fallbacks showing raw JSON keys.
- **Checkpoint 3C (Task 6–8 done):** Turn off WiFi in devtools, play a game in the elderly app, confirm the result screen still shows instantly and the session appears in the Dexie `sync_outbox` (inspect via browser devtools → Application → IndexedDB).
- **Checkpoint 3D (Task 9–11 done):** Turn WiFi back on, confirm the outbox drains automatically within ~5s (doc 02 §6 NFR), session appears in Postgres, and a reminder created by the caregiver *while the elderly device was offline* appears after reconnect. **This is the demo-day centerpiece** (doc 11 §8) — rehearse it explicitly, more than once.

---

## 5. Cross-Team Sync Cadence (so you stay in sync, not just each pair internally)

| Cadence | What | Who |
|---|---|---|
| **Daily async standup** (chat, doc 09 §9) | Each pair posts: shipped yesterday / doing today / blockers | All 6 |
| **Every merge to `main` touching a shared contract** (API shape, DB schema, design tokens) | Post a one-line note in the team channel: "merged X, changes Y contract, heads up to Team Z" | The merging pair |
| **Weekly integration check (doc 09 §9 step 5 — the single highest-value recurring task)** | Run the full elderly-app + backend + dashboard flow end-to-end, offline **and** online, together on a call | All 6, ideally same room/call |
| **Checkpoint demos** (listed per team above) | Whoever hits the checkpoint demos live to the other 4 before moving on | Triggering pair + everyone else watching |

## 6. Master Checkpoint Timeline (use this as your top-level progress tracker)

```
[ ] Repo skeleton + CI green                         (Team 1, Day 0)
[ ] Design tokens merged                              (Team 3, Day 1-2)
[ ] Checkpoint 1A — backend auth works                (Team 1)
[ ] Checkpoint 1B — full API surface demoable in /docs (Team 1)  ─┬─ unblocks Team 2 & 3 real integration
[ ] Checkpoint 2A — adaptive difficulty tested         (Team 2)   │
[ ] Checkpoint 2B — dashboard auth works against real API (Team 2)◀┘
[ ] Checkpoint 1C — elderly app shell + login          (Team 1)
[ ] Checkpoint 1D — one full online game-session loop  (Team 1)  ─┬─ unblocks offline mirror work
[ ] Checkpoint 3C — offline write + outbox confirmed   (Team 3)  ◀┘
[ ] Checkpoint 2C — full dashboard demo w/ real trends (Team 2)
[ ] Checkpoint 3D — offline → online sync demo         (Team 3)  ← demo-day centerpiece
[ ] Weekly integration check passes end-to-end, offline + online (All)
[ ] Doc 11 §8 demo-day checklist fully ticked           (All)
```

## 7. Final Merge / Demo-Readiness Protocol (last 48–72 hours)

1. **Feature freeze** — no new `feature/*` branches merge to `main` after this point; only `fix/*` for bugs found in rehearsal.
2. Full team runs doc 11 §8's Demo-Day Checklist together, item by item, out loud on a call.
3. Seed data: Team 2 (Rehan) scripts a realistic multi-week session history + a stocked reminiscence gallery (Srujna's content) into staging, per doc 11 §8.
4. Rehearse the offline demo **twice**, on the actual device that will be used, not just a laptop emulator (doc 11 §6, §8).
5. Tag the final commit: `git tag v1.0.0-sih-demo && git push origin v1.0.0-sih-demo`.
6. Each pair does a final self-review: re-read doc 07 §4 (business rules) and doc 15 §2.5/§3.4 (tone rules) against their own screens one more time — these are the rules most likely to have quietly drifted under deadline pressure, and they're also the ones judges will notice first (a stray "WRONG" buzzer or a raw risk percentage undermines the whole pitch).
