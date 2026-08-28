# 01 — Architecture

## 1. Guiding Principles

1. **Offline-first, not offline-tolerant.** The elderly app must be 100% usable with zero connectivity for games, reminders, and reminiscence viewing. Sync is a background concern, never a blocker.
2. **Web-first, app-ready.** Built as a **PWA (Progressive Web App)** so it installs like a native app on Android tablets/phones (the realistic hardware in rural NER), while staying deployable as a normal website for the hackathon demo. A React Native wrapper is a *trivial* later step because business logic lives in a shared API layer, not in native code.
3. **Elderly-friendly by construction.** Every screen: large touch targets, high contrast, minimal simultaneous choices, no deep navigation.
4. **Honest AI.** No component pretends to have intelligence it doesn't have. Rule-based logic is rule-based; ML is only invoked where we have data to justify it.
5. **Separation of concerns.** Elderly app, caregiver dashboard, and backend are independently deployable services talking over a REST API.

## 2. Finalized Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Elderly-facing web app | **React 18 + Vite + TypeScript**, Tailwind CSS | Fast dev, strong PWA tooling, TypeScript catches bugs across a 6-person team |
| Caregiver dashboard | **React + Vite + TypeScript**, Tailwind CSS, Recharts | Shared component library with elderly app where sensible, charts via Recharts |
| Offline layer | **Service Worker (Workbox)** + **IndexedDB (Dexie.js)** | Workbox caches app shell/assets; Dexie stores game sessions, reminders, cached media locally; sync queue pattern |
| PWA install | Web App Manifest + Workbox | Installable on Android home screen, works like a native app |
| Backend API | **FastAPI (Python 3.11+)** | Async, auto-generated OpenAPI docs (doubles as doc 05), same language as the AI/analytics stack |
| Primary database | **PostgreSQL** (hosted on **Supabase** or **Neon** for hackathon speed) | Relational integrity for users/sessions/reminders; Supabase gives us auth + storage + DB in one for MVP speed |
| Local mobile/browser storage | **IndexedDB** via Dexie.js | Structured offline cache + outbox for unsynced writes |
| Media storage | **Supabase Storage** (S3-compatible) or **Cloudflare R2** | Family photos, cultural media (audio/video) kept out of Postgres |
| Auth | **JWT** (access + refresh tokens), issued by FastAPI; optional Supabase Auth to save time | Stateless, works offline once token is cached |
| Adaptive difficulty (v1) | Rule-based staircase, implemented in Python (backend) + mirrored in-app for offline play | No ML dependency for MVP — see doc 00 §5 |
| Analytics (v1) | Python + Pandas, exposed via API endpoints, rendered with Recharts on dashboard | Simple trend statistics, not ML |
| Voice (prototype only) | **Web Speech API** (browser-native, for English/Hindi demo) with roadmap to **AI4Bharat / Bhashini API** for Assamese | Zero infra cost for demo; real NER ASR/TTS is a funded post-MVP track |
| Hosting — frontend | **Vercel** (both React apps) | Free tier, instant PWA-friendly deploys, preview URLs per PR |
| Hosting — backend | **Render** or **Railway** | Simple FastAPI deploys, free/cheap tier sufficient for demo + judging |
| CI/CD | **GitHub Actions** | Lint + test on PR, auto-deploy on merge to `main` |
| Version control | **GitHub** (monorepo) | Single repo, see doc 06 |

## 3. High-Level Architecture Diagram

```
                         ┌─────────────────────────┐
                         │      ELDERLY USER        │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │  Elderly Web App (PWA)    │
                         │  React + TS + Tailwind    │
                         │  ┌──────────────────────┐ │
                         │  │ Service Worker        │ │
                         │  │ (Workbox - app shell) │ │
                         │  └──────────────────────┘ │
                         │  ┌──────────────────────┐ │
                         │  │ IndexedDB (Dexie)      │ │
                         │  │ games/reminders/media  │ │
                         │  │ cache + sync outbox    │ │
                         │  └──────────────────────┘ │
                         └────────────┬─────────────┘
                                      │  REST/HTTPS (when online)
                                      │  queued sync (when offline)
                                      ▼
                         ┌─────────────────────────┐
                         │    FastAPI Backend        │
                         │  Auth · Games · Reminders  │
                         │  Memories · Sync · Analytics│
                         └──────┬───────────┬────────┘
                                │           │
                    ┌───────────▼───┐   ┌───▼─────────────┐
                    │  PostgreSQL    │   │ Object Storage    │
                    │  (Supabase/    │   │ (Supabase/R2)     │
                    │   Neon)        │   │ photos/audio/video│
                    └───────┬────────┘   └───────────────────┘
                            │
                    ┌───────▼────────┐
                    │ Analytics Engine │
                    │ (Pandas trend    │
                    │  computation)    │
                    └───────┬────────┘
                            │
                         ┌───▼─────────────────────┐
                         │  Caregiver Web Dashboard   │
                         │  React + TS + Recharts     │
                         └────────────┬───────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │       CAREGIVER           │
                         └───────────────────────────┘
```

## 4. Offline-First Data Flow

```
              INTERNET AVAILABLE?
                 /            \
              YES              NO
               │                │
        Write directly    Write to IndexedDB
        to FastAPI API    outbox + apply
        + update local    optimistic UI update
        cache
               \                /
                \              /
             Background Sync Manager
             (Service Worker triggers
              sync when connection returns)
                       │
                       ▼
              POST /sync/batch → FastAPI
                       │
                       ▼
                 PostgreSQL (source of truth)
```

Conflict rule: **last-write-wins** per record, timestamped client-side; game session logs are append-only (never edited), so most sync conflicts are structurally impossible.

## 5. Deployment Topology (see doc 11 for full detail)

- `app.smriti.in` (or Vercel subdomain) → Elderly PWA
- `caregiver.smriti.in` → Caregiver dashboard
- `api.smriti.in` → FastAPI backend
- Postgres + Storage → managed by Supabase/Neon (single region: Mumbai/ap-south-1 closest to NER users)

## 6. Why a Web App First Is the Right Call

- One React codebase serves both "web app" and "installable PWA" — judges can test it via a link, no APK install friction during evaluation.
- Business logic (games, sync, adaptive difficulty, API contracts) is 100% reusable if the team later wraps it in React Native or Capacitor for app-store distribution — this is explicitly planned as a non-rewrite path (see doc 03, Post-MVP extensions).
- PWAs support offline-first natively via Service Workers — this **is** the mandatory "offline functionality" requirement (PS point g), not a workaround.

---

## 7. Scalability Growth Tiers

| Tier | Users (elderly) | Trigger to next tier | Infrastructure change needed |
|---|---|---|---|
| **Tier 0 — Hackathon/Demo** | 1-10 (test accounts) | SIH judging complete | None — current free-tier hosting |
| **Tier 1 — Pilot** | 50-200 | Successful SIH demo + pilot agreement | Upgrade Supabase to Pro plan (dedicated Postgres); move backend to Render paid tier for reliability |
| **Tier 2 — Regional** | 200-2,000 | Pilot retention >50% at 3 months + second state deployment | Add connection pooling (PgBouncer); add Redis for rate limiting + session cache; consider read replica for analytics queries |
| **Tier 3 — State-scale** | 2,000-10,000 | B2G contracts with 3+ states | Separate analytics workload from transactional DB (read replica or materialized view refresh); CDN for media assets; consider multi-AZ deployment |
| **Tier 4 — National** | 10,000+ | Expansion beyond NER | Microservices extraction (analytics engine first); Kubernetes or managed container orchestration; multi-region (Mumbai + Kolkata for NER latency); dedicated observability stack |

**Honest note:** Tier 4 is speculative. We should not architect for it today — that's the premature-complexity trap. But we should avoid decisions at Tier 0-1 that make Tier 2-3 structurally impossible (e.g., coupling all services into one process, storing media in the database).

---

## 8. Disaster Recovery

| Metric | Current (MVP/Pilot) | Target (Tier 2+) |
|---|---|---|
| **RTO (Recovery Time Objective)** | 4-8 hours (manual redeploy from GitHub) | <1 hour (automated failover) |
| **RPO (Recovery Point Objective)** | 24 hours (Supabase daily backup) | <1 hour (continuous WAL archiving) |

**Honest assessment:** At MVP scale, a few hours of downtime is acceptable because the elderly app works offline — backend downtime doesn't disrupt the primary user experience. The caregiver dashboard shows stale data but remains readable. Full DR automation is a Tier 2+ investment.

**Backup strategy:**
- **Postgres:** Supabase/Neon managed daily backups (included). Point-in-time recovery available on Pro plans.
- **Object storage:** Supabase Storage/R2 provides built-in redundancy. No additional backup needed at MVP scale.
- **Application code:** GitHub is the backup — all code, migrations, and docs are version-controlled.
- **Tested restore:** Before pilot launch, perform one full restore from backup to a fresh Postgres instance to verify the process works. Document the steps.

---

## 9. Capacity Estimates (Tier 1 Pilot — 200 elderly users)

| Resource | Estimate | Assumption |
|---|---|---|
| **Game sessions/day** | ~400-600 | 200 users × 2-3 sessions/day average |
| **Game sessions/month** | ~12,000-18,000 | — |
| **Database rows (game_sessions) at 6 months** | ~75,000-100,000 | Append-only, no deletes |
| **Database size (Postgres, 6 months)** | ~50-100 MB | Each session row ~1KB |
| **Media storage** | ~5-10 GB | ~200 users × 10-20 family photos (avg 500KB/photo) + cultural pack (~500MB) |
| **API requests/day** | ~2,000-4,000 | Game sessions + sync batches + reminder checks + analytics queries |
| **API requests/second (peak)** | ~1-2 | NER users are distributed across time zones; no viral spike risk |
| **Bandwidth** | ~5-10 GB/month | Mostly media downloads on first sync; subsequent access from cache |

**Conclusion:** All numbers comfortably within free/low-cost tiers of Supabase, Render, and Vercel. No scaling concern at Tier 1. The first constraint to hit at Tier 2 will likely be Postgres connection limits (Supabase free tier: 60 connections), solvable with PgBouncer.

---

## 10. Sync vs Async Communication Decision Table

| Operation | Sync/Async | Rationale |
|---|---|---|
| Auth (login, token refresh) | **Sync** | Must block until token is issued; cannot proceed without auth |
| Game session submission (online) | **Sync** | Client needs `next_difficulty` in response; low latency acceptable |
| Game session submission (offline → sync batch) | **Async** | Queued in outbox, processed on reconnect; eventual consistency acceptable |
| Analytics recomputation after session | **Async** | Expensive query; should not block game-session POST response; materialized or computed on a short delay |
| Reminder creation (caregiver → server) | **Sync** | Caregiver needs confirmation; simple CRUD |
| Reminder delivery (server → elderly device) | **Async** | Pulled on next sync or push; client-side scheduling handles local timing |
| Media upload (photo → object storage) | **Sync** (upload), **Async** (processing/caching) | Upload must complete for confirmation; thumbnail generation / elderly-device caching happens asynchronously |
| Alert generation (missed reminder, performance deviation) | **Async** | Scheduled job / background worker; not triggered inline during user actions |
| Sync batch processing | **Sync** (per-request), items processed **sequentially** | Batch endpoint responds synchronously with per-item status; internal processing is sequential to preserve ordering |
