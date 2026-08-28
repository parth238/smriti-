# 02 — System Design

## 1. System Components

| Component | Responsibility |
|---|---|
| **Elderly App (client)** | Render games/reminders/reminiscence; capture telemetry; run offline; apply local rule-based difficulty when offline; queue sync |
| **Caregiver Dashboard (client)** | Auth, reminder CRUD, media upload, analytics visualization, alert display |
| **Auth Service** | Issue/verify JWTs, manage caregiver↔elderly linking, role-based access |
| **Game Service** | Serve game definitions/content packs, receive session results |
| **Reminder Service** | CRUD reminders, compute "next reminder", trigger local notifications |
| **Memory/Reminiscence Service** | CRUD memory items (photos + metadata), serve reminiscence prompts |
| **Sync Service** | Accept batched offline writes, resolve conflicts, return authoritative state |
| **Analytics Engine** | Compute rolling averages, personal baselines, trend deltas; expose via API |
| **Adaptive Difficulty Engine** | Rule-based staircase logic (v1); pluggable for RL later (v2+) |
| **Media Storage** | Store/serve photos, audio, video via signed URLs |
| **Notification System** | Local (in-app/PWA push) reminders; caregiver alert emails/push (post-MVP: SMS fallback) |

## 2. Component Interaction (logical view)

```
Elderly App ──(REST)──> Auth Service ──> Postgres(users, sessions_table)
     │
     ├──(REST)──> Game Service ──> Postgres(game_sessions)
     │                   │
     │                   └──> Adaptive Difficulty Engine (reads recent sessions,
     │                                                     returns next difficulty)
     │
     ├──(REST)──> Reminder Service ──> Postgres(reminders)
     │
     ├──(REST)──> Memory Service ──> Postgres(memory_items) + Object Storage(files)
     │
     └──(REST, batched)──> Sync Service ──> writes to relevant tables

Caregiver Dashboard ──(REST)──> Auth Service
     ├──> Analytics Engine ──> Postgres(game_sessions, performance_metrics)
     ├──> Reminder Service (create/update)
     └──> Memory Service (upload/manage)
```

## 3. Data Flow — A Single Game Session (end to end)

1. Elderly user taps "Play Memory Game" → app requests current difficulty from local cache (or API if online).
2. Game renders using cached/localized content pack (photos, labels).
3. User plays; client records `accuracy`, `reaction_time`, `errors`, `hints_used`, `session_duration` in memory.
4. On completion: result object written to IndexedDB immediately (optimistic), UI shows "Great job!" instantly regardless of connectivity.
5. If online → POST `/game-sessions` fires immediately; local record marked `synced`.
6. If offline → record stays in outbox; Service Worker's Background Sync retries when connection returns.
7. Backend receives session → (a) persists to `game_sessions`, (b) Adaptive Difficulty Engine recomputes next difficulty using last N sessions, (c) Analytics Engine updates rolling stats (async/materialized, not blocking response).
8. Caregiver dashboard queries `/users/{id}/analytics` → sees updated trend on next load.

## 4. Adaptive Difficulty Engine — Design (v1, rule-based)

**Input:** last N=5 rounds' correctness (or accuracy per round) for the current game type + current difficulty level (1–5).

**Rule:**
```
if last 3 rounds are "strong" (accuracy ≥ 80%):
    difficulty = min(difficulty + 1, MAX_LEVEL)
elif last 2 rounds are "poor" (accuracy < 50%):
    difficulty = max(difficulty - 1, MIN_LEVEL)
else:
    difficulty unchanged
```
- Runs **both** server-side (source of truth) and mirrored client-side (so offline play still adapts).
- On sync, server recalculation overrides client guess if they diverge (server wins — see doc 04 sync rules).
- This is intentionally simple, explainable, and requires **zero training data** — satisfies PS requirement (b) honestly.

**v2+ (post-MVP):** Once Track B telemetry (weeks/months of real sessions) exists, this function is replaced by a contextual bandit that also selects *which* game/content to serve next, not just difficulty. Interface contract (`get_next_difficulty(user_id, game_type) -> level`) stays identical so the swap doesn't touch client code.

## 5. Analytics Engine — Design (v1)

Computed metrics (all per user, per game_type where relevant):
- 7-day rolling accuracy average, 30-day rolling accuracy average
- Average reaction time + reaction-time delta vs personal baseline
- Error-rate change, completion rate (completed vs quit sessions)
- **Personal baseline** = first 2 weeks of usage (rolling, recalculated) — nothing is compared to population norms, only to the individual's own history, avoiding any implied diagnostic claim.

Output examples surfaced to caregiver: *"Memory-game reaction time is 18% higher than this user's normal baseline over the last 7 days."* Never a risk score, never a diagnosis.

## 6. Non-Functional Requirements

| Attribute | Target |
|---|---|
| Offline availability | 100% of core elderly-app features (games, reminders, cached reminiscence) work with zero connectivity |
| Sync latency | < 5s after connectivity restored, for a typical day's queued sessions |
| Page load (3G, cached PWA) | < 2s to interactive |
| Accessibility | WCAG AA contrast minimum, tap targets ≥ 48px, font scaling support |
| Data privacy | DPDP Act 2023 aligned; caregiver-proxy consent flow for cognitively vulnerable users |
| Availability (backend, demo/pilot scale) | Best-effort single-region managed hosting; no HA requirement for MVP |
| Scalability | Designed to comfortably handle a pilot of hundreds of users; horizontal scaling deferred (see doc 03 "not in MVP") |

## 7. Failure Modes & Handling

| Failure | Handling |
|---|---|
| No connectivity during play | Full local play, optimistic UI, queued sync |
| Sync conflict (edited on two devices) | Last-write-wins by server timestamp; sessions are append-only so this mainly affects reminders/profile edits |
| Media upload fails mid-transfer | Resumable upload where possible; retry queue on caregiver dashboard |
| Backend downtime | Elderly app unaffected (offline-first); caregiver dashboard shows cached last-known data with a "stale data" indicator |
| Corrupted local IndexedDB | App detects and gracefully re-hydrates from server on next successful connection; never silently loses unsynced sessions without warning |

---

## 8. Performance Budget Table

| Path | Type | Budget | Measurement |
|---|---|---|---|
| Elderly app — cold start (3G, uncached) | User-facing | < 3s to interactive | Lighthouse, real device |
| Elderly app — warm start (cached PWA) | User-facing | < 1s to interactive | Lighthouse |
| Game load (after selecting a game) | User-facing | < 500ms to playable | In-app timing |
| Game result screen render | User-facing | < 200ms after last interaction | In-app timing |
| Reminder notification display | User-facing | < 100ms from scheduled time | Client-side scheduling precision |
| `POST /game-sessions` (online) | API | < 300ms p95 | Backend APM / manual timing |
| `POST /sync/batch` (10 items) | API | < 1s p95 | Backend timing |
| `GET /analytics?period=7d` | API | < 500ms p95 | Backend timing |
| `GET /memory-items` (paginated, 20 items) | API | < 400ms p95 | Backend timing |
| Analytics recomputation (after session) | System | < 5s (async, non-blocking) | Background job timing |
| Offline → online sync drain | System | < 5s for a typical day's queue (~10-20 items) | End-to-end timing |

**Enforcement:** Performance budgets for user-facing paths are tracked in CI via Lighthouse CI (stretch goal) or manual spot-checks during weekly integration tests (MVP).

---

## 9. Reliability Patterns

| Pattern | Implementation | Where |
|---|---|---|
| **Idempotency** | `client_generated_id` on game sessions and sync items; `INSERT ON CONFLICT DO NOTHING` | Backend: `sync.py`, `games.py` |
| **Retry with backoff** | Service Worker Background Sync retries failed sync with exponential backoff (Workbox default: 1 attempt, then re-queued for next sync event) | Client: Service Worker |
| **Timeouts** | API client timeout: 10s for standard requests, 30s for media uploads; backend route timeout: 30s (Render/Railway default) | Client: API client config; Backend: server config |
| **Circuit breaker** | Not implemented for MVP. Appropriate at Tier 2+ when we add external API dependencies (Bhashini, SMS gateway). | Roadmap |
| **Bulkheads** | Not implemented for MVP. At Tier 3+, separate analytics query pool from transactional pool (connection pooling via PgBouncer). | Roadmap |
| **Graceful degradation** | Elderly app: full offline functionality when backend is down. Caregiver dashboard: cached last-known data + "stale data" indicator. Voice demo: falls back to text-only if Web Speech API unavailable. | Client: both apps |
| **Dead letter queue** | Sync outbox items that fail 5 consecutive sync attempts are flagged (not deleted) and surfaced as a "sync issue" indicator in the elderly app. | Client: `useOfflineSync.ts` |
| **Health checks** | `GET /health` endpoint returns 200 + DB connectivity check; used by UptimeRobot for external monitoring. | Backend: `main.py` |

**What we're deliberately NOT doing (and why):**
- No distributed tracing (single-service backend, no inter-service calls at MVP).
- No chaos engineering (team of 6, pilot scale — would be irresponsible overhead).
- No active-active failover (single-region, managed hosting — honest about our scale).

---

## 10. Observability Plan

### MVP (Tier 0-1)

| Layer | Tool | What's captured |
|---|---|---|
| **Application logs** | `stdout` → Render/Railway built-in log viewer | Structured JSON logs (Python `logging` with `structlog`); request_id, user_id (never PII), endpoint, status_code, duration_ms |
| **Uptime monitoring** | UptimeRobot (free tier) | `GET /health` every 5 min; email/Slack alert on failure |
| **Error tracking** | Sentry (free tier, backend only for MVP) | Unhandled exceptions with stack traces; opt-in on frontend later |
| **Client-side analytics** | Custom events written to `game_sessions` + `sync_events` tables | Session telemetry IS our analytics — no separate analytics SDK on the elderly app (doc 07 §5) |
| **Performance** | Manual Lighthouse audits during weekly integration check | Track TTI (Time to Interactive) trend over time |

### Tier 2+ (when to upgrade)

| Trigger | Upgrade |
|---|---|
| >500 active users or first paid contract | Add Grafana Cloud (free tier: 10K metrics) for dashboards; add structured log shipping |
| External API integration (Bhashini) | Add distributed request tracing (OpenTelemetry) |
| >2,000 users | Dedicated observability stack: Grafana + Loki (logs) + Prometheus (metrics) + Tempo (traces) |

**Logging rules (enforced from day 1):**
- Every request gets a `request_id` (UUID, generated in middleware).
- Log: `request_id`, `user_id`, `endpoint`, `method`, `status_code`, `duration_ms`, `error_code` (if any).
- Never log: phone numbers, names, PINs, tokens, photo URLs, or any PII field (doc 07 §5).
- Log levels: `ERROR` for unhandled exceptions, `WARNING` for expected-but-notable conditions (sync conflict, rate limit hit), `INFO` for standard request lifecycle, `DEBUG` for development only (disabled in staging/prod).

---

## 11. Caching Strategy

| Layer | Cache | What's cached | TTL / Invalidation | Tenant isolation |
|---|---|---|---|---|
| **Browser (elderly app)** | Service Worker (Workbox) | App shell (HTML/JS/CSS), PWA assets | Versioned precache manifest — invalidated on every build | N/A (single user per device) |
| **Browser (elderly app)** | IndexedDB (Dexie) | Game sessions, reminders, memory items, difficulty settings | Persistent until sync + explicit clear; reminders refreshed on every sync | Single user per device by design |
| **Browser (elderly app)** | Runtime cache (Workbox) | Media files (photos, audio from reminiscence) | Cache-first, stale-while-revalidate; max 200 items, LRU eviction | Single user per device |
| **Browser (caregiver dashboard)** | React state / SWR or React Query | Analytics data, session history, alerts | Stale-while-revalidate; re-fetch on focus; 30s stale time for analytics, 5min for session history | Per-caregiver auth token scopes data |
| **Server (backend)** | In-memory (Python `functools.lru_cache` or simple dict) | Game catalog (static, rarely changes); adaptive difficulty constants | App-lifetime cache; invalidated on restart | N/A (config data, not user data) |
| **Server (Tier 2+)** | Redis | Rate limiting counters; session token blacklist; computed analytics snapshots | Rate limits: sliding window TTL; analytics: 5min TTL, invalidated on new session write | Key prefix: `user:{user_id}:*` |
| **CDN (Tier 3+)** | Vercel Edge / Cloudflare | Cultural content pack assets (public, not user-specific) | Long TTL (24h), cache-bust on content pack version update | N/A (public content) |

**Critical rule:** User-specific data (game sessions, reminders, photos) is **never** cached in a shared/public layer. Only static, non-user-specific assets (app shell, cultural pack media, game definitions) go through CDN/edge caching.
