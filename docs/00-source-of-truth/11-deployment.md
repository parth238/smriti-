# 11 — Deployment

## 1. Environments

| Environment | Purpose | URLs |
|---|---|---|
| **Local** | Individual dev machines | `localhost:5173` (elderly-app), `localhost:5174` (dashboard), `localhost:8000` (API) |
| **Staging** | Auto-deployed from `main` branch, used for team testing & demo rehearsal | `staging-app.smriti.vercel.app`, `staging-caregiver.smriti.vercel.app`, `staging-api.smriti.onrender.com` |
| **Production/Demo** | Final SIH-judging build | `app.smriti.in` (or custom Vercel domain), `caregiver.smriti.in`, `api.smriti.in` |

## 2. Local Development Setup

```bash
# clone
git clone https://github.com/<org>/smriti.git && cd smriti

# backend
cd apps/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in local DB URL, JWT secret
docker compose up -d postgres  # local postgres via docker-compose.yml
alembic upgrade head           # run migrations
uvicorn app.main:app --reload --port 8000

# elderly app
cd apps/elderly-app
npm install
cp .env.example .env           # set VITE_API_URL=http://localhost:8000/api/v1
npm run dev

# caregiver dashboard
cd apps/caregiver-dashboard
npm install
cp .env.example .env
npm run dev
```

## 3. CI Pipeline (`.github/workflows/ci.yml`)

Triggered on every PR:
1. Checkout
2. Backend: install deps → `ruff check` → `black --check` → `pytest`
3. Frontend (both apps): `npm ci` → `eslint` → `tsc --noEmit` → `npm run build` (catches build-breaking errors early)
4. Report status checks on PR — merge blocked until green

## 4. CD Pipeline (`.github/workflows/deploy.yml`)

Triggered on merge to `main`:
- **Frontend apps:** Vercel auto-deploys on GitHub integration (no custom action needed beyond connecting the repo) — separate Vercel projects for `apps/elderly-app` and `apps/caregiver-dashboard`, each with its own build command/root directory setting.
- **Backend:** Render/Railway auto-deploys from `apps/backend` on push to `main` (configured via their GitHub integration + `render.yaml` / `railway.toml` specifying build/start commands and root directory).
- Migrations run automatically as a pre-deploy step (`alembic upgrade head`) before the new backend version receives traffic.

## 5. Build Commands (reference)

| App | Build | Start (prod) |
|---|---|---|
| elderly-app | `npm run build` (Vite → `dist/`) | Served statically by Vercel |
| caregiver-dashboard | `npm run build` | Served statically by Vercel |
| backend | — | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

## 6. PWA-Specific Deployment Notes

- `manifest.json` and service worker must be served over **HTTPS** (Vercel provides this by default) — PWA install prompts and offline caching silently fail over plain HTTP.
- Cache versioning: Workbox `precache` manifest is regenerated on every build so users always get fresh app-shell code with a proper cache-bust, while runtime-cached data (photos, content packs) persists across updates.
- Test the "Add to Home Screen" flow explicitly on an actual Android device before the demo — emulator behavior can differ.

## 7. Database Migrations

- Managed via **Alembic** (`apps/backend/app/db/migrations/`).
- Rule: every schema change in doc 04 must ship as an Alembic migration in the same PR — never hand-edit the staging/prod database directly.
- Rollback plan: each migration should have a working `downgrade()`; test rollback locally before merging schema changes close to a demo deadline.

## 8. Demo-Day Checklist

- [ ] Staging environment matches what will be shown (no last-minute unmerged branches)
- [ ] Seed data present: a demo elderly user with a realistic session history (multiple weeks, so trend graphs aren't empty), a few reminders, a stocked reminiscence gallery
- [ ] Offline demo rehearsed: literally turn off WiFi mid-demo, play a game, show it still works, turn WiFi back on, show sync happening
- [ ] Both apps installed as PWAs on a physical Android device as backup, in case venue WiFi fails entirely
- [ ] Backend health-checked 30 minutes before presentation slot
- [ ] Have a local `docker compose up` fallback ready in case hosted staging has issues on judging day

## 9. Monitoring (lightweight, appropriate for pilot scale)

- Backend: basic logging to stdout, captured by Render/Railway's built-in log viewer — no need for a dedicated observability stack at this stage.
- Uptime: a simple `/health` endpoint on the backend, pinged by a free uptime monitor (e.g. UptimeRobot) so the team gets notified if the demo backend goes down before judging.
- Not running a full Grafana/Prometheus stack for MVP — that's Tier 2+ when the overhead is justified by scale.

---

## 10. Release Strategy

| Phase | Strategy | Rollback |
|---|---|---|
| **MVP/SIH** | Push to `main` → auto-deploy to Vercel (frontend) + Render (backend) | Git revert + redeploy; <5 min |
| **Pilot (Tier 1)** | Same auto-deploy, but with a **feature freeze + staging check** 48h before any pilot checkpoint (doc 16 §7) | Same |
| **Tier 2+** | Staged rollout: deploy to staging → smoke test → promote to production. Consider canary deploys (10% → 50% → 100%) if hosting platform supports it (Render doesn't natively; Railway/Fly.io do). | Revert to previous container image |

**Release validation checklist (every deploy to production):**
- [ ] CI green (all tests pass, linting clean)
- [ ] Staging smoke test passed (login, play a game, view dashboard, submit sync batch)
- [ ] No unintended breaking API changes (check OpenAPI diff if available)
- [ ] No new Sentry errors in the first 15 minutes after deploy
- [ ] Spot-check: elderly app still works offline (disconnect network, play a game)

**What we're NOT doing (and why):**
- No blue-green deploys (adds infrastructure cost + complexity at a scale that doesn't justify it).
- No feature flags for gradual rollout (would add code complexity; all Tier 1 features ship to all users).
- No separate release branches (trunk-based development on `main` is simpler for a 6-person team).

---

## 11. SLIs and SLOs

> **Caveat:** These are internal targets, not contractual SLAs. We set them to establish expectations and detect regressions, not to incur financial penalties.

### Service Level Indicators (SLIs)

| SLI | Definition | Measurement |
|---|---|---|
| **Availability** | % of 5-minute intervals where `GET /health` returns 200 | UptimeRobot monitoring |
| **Latency (API p95)** | 95th percentile response time for non-analytics API endpoints | Backend structured logs (`duration_ms`) |
| **Latency (analytics p95)** | 95th percentile response time for `/analytics/*` endpoints | Backend structured logs |
| **Sync success rate** | % of `POST /sync/batch` requests that return full success (all items synced) | Backend logs + `sync_events` table |
| **Error rate** | % of API requests returning 5xx status codes | Backend structured logs |

### Service Level Objectives (SLOs)

| SLO | Target | Measurement window | Consequence of breach |
|---|---|---|---|
| **Availability** | ≥ 99% | Monthly (allows ~7.2 hours downtime/month) | Investigate root cause; if hosting provider, evaluate swap |
| **API latency (p95)** | ≤ 500ms | Weekly | Profile slow endpoints; add indexes or caching |
| **Analytics latency (p95)** | ≤ 2s | Weekly | Acceptable for complex queries; investigate if >2s |
| **Sync success rate** | ≥ 99% | Monthly | Investigate sync failures; check for schema drift |
| **Error rate (5xx)** | ≤ 1% | Weekly | Investigate top error sources; add error handling |

**Honest note:** At pilot scale (200 users, ~2 RPS peak), these SLOs are easily achievable. Their real value is establishing the discipline of measuring them, so when we hit Tier 2+ we already know our baseline.

---

## 12. Incident Response Process

### Severity Levels

| Severity | Definition | Example | Response time |
|---|---|---|---|
| **P1 — Critical** | Production service fully down or data loss occurring | Backend unreachable; database corruption; security breach | **Immediate** (within 15 min of detection) |
| **P2 — Major** | Significant feature degraded; workaround exists | Sync failing for all users; analytics returning wrong data | **Within 1 hour** |
| **P3 — Minor** | Non-critical feature impaired; low user impact | One game type crashing on specific devices; dashboard chart rendering bug | **Within 4 hours** (next business day if after-hours) |
| **P4 — Low** | Cosmetic or minor UX issue | Misaligned text; stale translation string | **Next sprint** |

### Incident Workflow

1. **Detection:** UptimeRobot alert, Sentry error spike, user/caregiver report, or team member notices.
2. **Triage (5 min):** Determine severity level. Assign an **Incident Commander** (IC) — whoever detects it first, unless they escalate.
3. **Communication:** IC posts in team channel: severity, what's broken, who's investigating.
4. **Investigate & fix:** IC coordinates the fix. For P1/P2: all other work stops until resolved.
5. **Resolve & verify:** Deploy fix; verify via the release validation checklist (§10).
6. **Postmortem (P1/P2 only, within 48 hours):**
   - **Blameless** — focus on systems and processes, not individuals.
   - Document: timeline, root cause, impact, what went well, what went poorly, action items.
   - File as a GitHub Issue with the `postmortem` label.
   - Resulting improvements become tasks in the next sprint.

### Escalation Path

| If... | Escalate to... |
|---|---|
| IC can't resolve within response time | Harshit (technical lead) |
| Data loss or security breach confirmed | Harshit + institutional partner (ARDSI/state health dept) |
| Hosting provider issue (outside our control) | Open support ticket with provider; prepare swap to backup provider |

---

## 13. Infrastructure Cost Model

### Current (Tier 0 — Hackathon/Demo)

| Service | Plan | Monthly cost |
|---|---|---|
| Supabase | Free | ₹0 |
| Render (backend) | Free | ₹0 |
| Vercel (2 frontend apps) | Free (Hobby) | ₹0 |
| GitHub | Free | ₹0 |
| UptimeRobot | Free | ₹0 |
| Sentry | Free (developer) | ₹0 |
| **Total** | | **₹0** |

### Tier 1 (Pilot — 200 users)

| Service | Plan | Monthly cost (est.) |
|---|---|---|
| Supabase | Pro ($25/mo) | ~₹2,100 |
| Render (backend) | Starter ($7/mo) | ~₹600 |
| Vercel | Free (Hobby) | ₹0 |
| Domain name | .in domain | ~₹50 (amortized) |
| **Total** | | **~₹2,750/mo** |

### Tier 2 (Regional — 2,000 users)

| Service | Plan | Monthly cost (est.) |
|---|---|---|
| Supabase | Pro + compute addon | ~₹5,000 |
| Render or Railway | Standard ($25/mo) | ~₹2,100 |
| Redis (Upstash or Render Redis) | Free-to-$10 | ~₹850 |
| Cloudflare R2 (media) | Pay-as-you-go | ~₹500 |
| Sentry | Team ($26/mo) | ~₹2,200 |
| **Total** | | **~₹10,650/mo** |

**Funding assumption:** Tier 0-1 costs are negligible and covered by team members. Tier 2+ costs are covered by B2G pilot contracts (₹5-10L/district/year per doc 00 §16). Break-even at ~2 districts.
