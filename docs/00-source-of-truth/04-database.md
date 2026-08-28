# 04 — Database Design

**Engine:** PostgreSQL. **Client-side mirror:** IndexedDB (subset of tables relevant to offline play — `game_sessions_local`, `reminders_local`, `memory_items_local`, plus a `sync_outbox` table).

## 1. Entity-Relationship Overview

```
users ──┬──< caregiver_user_links >──┬── caregivers
        │                             │
        ├──< game_sessions            │
        ├──< reminders                │
        ├──< memory_items ────────────┤ (uploaded_by = caregiver_id)
        ├──< performance_metrics
        └──< alerts

games ──< game_sessions
sync_events (audit/log of offline sync batches)
```

## 2. Tables

### `users` (elderly patients)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| full_name | text | |
| phone_number | text, unique, nullable | primary login identifier, optional if caregiver-managed only |
| preferred_language | text | e.g. `as` (Assamese), `en` |
| date_of_birth | date, nullable | |
| profile_photo_url | text, nullable | |
| home_location_lat/lng | numeric, nullable | for future reality-orientation / geofencing (Tier 3) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `caregivers`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| full_name | text | |
| phone_number | text, unique | |
| email | text, nullable | |
| password_hash | text | bcrypt/argon2 |
| created_at | timestamptz | |

### `caregiver_user_links`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| caregiver_id | UUID FK → caregivers.id | |
| user_id | UUID FK → users.id | |
| relationship | text | e.g. "daughter", "son", "community health worker" |
| is_primary | boolean | primary caregiver gets default alert routing |
| created_at | timestamptz | |

### `games` (static/config table — game catalog)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| game_type | text, unique | `memory_match`, `attention_reaction`, `sequencing`, `picture_naming` |
| display_name | jsonb | `{ "en": "...", "as": "..." }` |
| cognitive_domain | text | memory / attention / executive_function / language / etc. |
| min_difficulty | int | default 1 |
| max_difficulty | int | default 5 |

### `game_sessions` (the core telemetry table — append-only)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| game_id | UUID FK → games.id | |
| difficulty | int | |
| accuracy | numeric(5,2) | percentage |
| reaction_time_ms | int | average per session |
| errors | int | |
| hints_used | int | |
| session_duration_sec | int | |
| completed_or_quit | text | `completed` / `quit` |
| client_generated_id | UUID | idempotency key for offline sync dedup |
| synced_at | timestamptz, nullable | null until server ack |
| played_at | timestamptz | client-recorded actual play time (may predate sync) |
| created_at | timestamptz | server insert time |

*Append-only: no UPDATE/DELETE in normal operation — this is what makes offline sync conflict-free for this table.*

### `reminders`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| created_by_caregiver_id | UUID FK → caregivers.id | |
| type | text | `medicine` / `hydration` / `meal` / `appointment` / `custom` |
| title | jsonb | localized text |
| scheduled_time | time / timestamptz | recurring or one-off |
| recurrence_rule | text, nullable | simple RRULE-lite (`daily`, `weekly`, `once`) |
| is_active | boolean | |
| last_acknowledged_at | timestamptz, nullable | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `memory_items` (reminiscence content)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id, nullable | null = shared cultural-pack content, not personal |
| uploaded_by_caregiver_id | UUID FK → caregivers.id, nullable | |
| media_url | text | points to object storage |
| media_type | text | `photo` / `audio` / `video` |
| category | text | `personal` / `cultural` |
| title | jsonb | localized |
| description | text, nullable | |
| people_tagged | text[], nullable | e.g. `["Daughter", "Son", "Husband"]` |
| year | int, nullable | |
| location | text, nullable | |
| prompt_text | jsonb, nullable | e.g. "Do you remember who this is?" |
| created_at | timestamptz | |

### `performance_metrics` (materialized/aggregated — refreshed periodically or on-write)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| game_type | text, nullable | null = overall |
| period | text | `7d` / `30d` |
| avg_accuracy | numeric | |
| avg_reaction_time_ms | int | |
| completion_rate | numeric | |
| baseline_avg_accuracy | numeric, nullable | computed from first 2 weeks of use |
| baseline_avg_reaction_time_ms | int, nullable | |
| computed_at | timestamptz | |

### `alerts`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| caregiver_id | UUID FK → caregivers.id | |
| type | text | `missed_reminder` / `performance_deviation` |
| message | text | plain-language, never a diagnostic claim |
| severity | text | `info` / `notice` |
| is_read | boolean | |
| created_at | timestamptz | |

### `sync_events` (audit log)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| device_id | text | |
| batch_size | int | records synced in this batch |
| status | text | `success` / `partial` / `failed` |
| synced_at | timestamptz | |

## 3. Indexes (minimum set)
- `game_sessions(user_id, played_at)` — for trend queries
- `game_sessions(client_generated_id)` unique — idempotent sync
- `reminders(user_id, scheduled_time, is_active)`
- `memory_items(user_id, category)`
- `caregiver_user_links(caregiver_id)`, `(user_id)`

## 4. Client-Side (IndexedDB via Dexie) Mirror

```js
db.version(1).stores({
  game_sessions_local: '++localId, client_generated_id, synced, played_at',
  reminders_local: 'id, scheduled_time',
  memory_items_local: 'id, category',
  sync_outbox: '++id, table_name, payload, created_at'
});
```
Sync outbox pattern: every offline write appends a row here; background sync worker POSTs the outbox in order, marks entries synced/cleared on server ack.

## 5. Data Retention & Privacy Notes
- PII (name, phone, photos) encrypted at rest (managed by hosting provider, e.g. Supabase's encryption) + access controlled via RBAC.
- Caregiver-proxy consent recorded at account creation (`consent_given_by`, `consent_timestamp` — add to `users` table before storing any real user data, even in a pilot).
- No third-party analytics SDKs collecting elderly-user data (DPDP Act 2023 alignment).

---

## 6. Data Ownership Map

Every piece of data has exactly one owning module. Cross-module access is read-only via API, never direct table access.

| Data entity | Owning module | Write access | Read access |
|---|---|---|---|
| `users` | Auth Service | Auth Service (create), Users API (update profile) | All services (via `user_id` FK) |
| `caregivers` | Auth Service | Auth Service | Caregiver Dashboard, Alerts |
| `caregiver_user_links` | Auth Service | Auth Service, Users API | All services (authorization check) |
| `games` | Game Service | Admin/seed only (static config) | Game Service, Adaptive Difficulty |
| `game_sessions` | Game Service | Game Service, Sync Service (on behalf of Game Service) | Analytics Engine (read), Adaptive Difficulty (read) |
| `reminders` | Reminder Service | Reminder Service, Sync Service (acks only) | Elderly App (read), Caregiver Dashboard (CRUD via API) |
| `memory_items` | Memory Service | Memory Service | Elderly App (read), Caregiver Dashboard (CRUD via API) |
| `performance_metrics` | Analytics Engine | Analytics Engine (materialized/computed) | Caregiver Dashboard (read-only) |
| `alerts` | Alert System | Alert scheduled job | Caregiver Dashboard (read + mark-read) |
| `sync_events` | Sync Service | Sync Service | Admin/debugging only |

---

## 7. Multi-Tenancy Statement

**Smriti is single-tenant at MVP.** All elderly users' data lives in the same Postgres database and same schema. Isolation is enforced at the **application layer** (RBAC + `verify_user_access` dependency in doc 08 §3), not at the database layer.

**Why this is acceptable:**
- All users are served by one organization (the Smriti team / pilot partner). There is no B2B multi-organization scenario at MVP.
- Row-level security (RLS) via Supabase policies is available as a defense-in-depth layer but is not the primary isolation mechanism.

**When to revisit (Tier 3+):** If Smriti is deployed by multiple independent organizations (e.g., different state health departments each running their own instance), consider schema-per-tenant or row-level security policies enforced at the database layer.

---

## 8. Data Lifecycle Policy

| Phase | Policy | Implementation |
|---|---|---|
| **Creation** | All data created via validated Pydantic schemas; `created_at` timestamped server-side; consent recorded before any real user data (doc 08 §5) | Backend: schema validation + middleware |
| **Active use** | Data served via API with RBAC checks; `updated_at` maintained on every mutation; game sessions are append-only (no updates) | Backend: ORM hooks |
| **Soft delete** | Caregiver-requested deletion: `is_deleted=true` flag + `deleted_at` timestamp; data hidden from all API responses immediately; user can be "undeleted" within 30 days if the deletion was accidental | Backend: query filters exclude `is_deleted=true` |
| **Hard delete (purge)** | 30 days after soft delete, a scheduled job permanently removes the user's data from all tables + associated media from object storage | Backend: scheduled cleanup job |
| **Archival** | Game sessions older than 12 months moved to a `game_sessions_archive` table (same schema) to keep the hot table performant | Tier 2+: Postgres partitioning or manual archival job |
| **Legal hold** | If a legal or regulatory hold is requested (unlikely at MVP scale but possible for a health-adjacent app), soft-delete and hard-purge are suspended for the affected user | Backend: `legal_hold` flag on `users` table |

**Right to deletion flow (DPDP Act 2023):**
1. Caregiver requests deletion via dashboard → `DELETE /users/{user_id}` (authenticated, must be primary caregiver).
2. Backend soft-deletes the user + all linked data.
3. Confirmation email/notification to caregiver.
4. 30-day grace period → hard purge by scheduled job.
5. Object storage media deleted in the same purge job.

---

## 9. Formal Audit Trail

The current schema provides partial auditability (append-only `game_sessions`, `sync_events` log). For full audit coverage at Tier 2+:

| What's audited (MVP) | Mechanism |
|---|---|
| Game session history | `game_sessions` table — append-only, never edited/deleted |
| Sync operations | `sync_events` table — batch-level audit |
| Reminder acknowledgments | `last_acknowledged_at` on `reminders` + sync outbox ack records |

| What needs enhancement (Tier 2+) | Proposed mechanism |
|---|---|
| Who changed a reminder (created/edited/deleted) | Add `audit_log` table: `{id, table_name, record_id, action (create/update/delete), actor_id, actor_role, old_values (jsonb), new_values (jsonb), timestamp}` |
| Who accessed patient data | API-level access logging (structured logs with `request_id`, `user_id`, `endpoint`) — already covered by observability plan (doc 02 §10) |
| Consent events | Dedicated `consent_events` table: `{user_id, consented_by, consent_type, timestamp, ip_address}` |

---

## 10. Consistency Model

| Data | Consistency level | Rationale |
|---|---|---|
| `users`, `caregivers`, `caregiver_user_links` | **Strong** | Auth decisions depend on these; stale data = wrong access decisions |
| `game_sessions` | **Eventually consistent** | Offline play means sessions may arrive hours/days late; append-only, so no conflict risk |
| `reminders` | **Eventually consistent** (elderly device ↔ server) | New reminders created by caregiver arrive on elderly device at next sync; client-side scheduling compensates |
| `performance_metrics` | **Eventually consistent** | Materialized/computed asynchronously after session write; dashboard tolerates 5-10s staleness |
| `alerts` | **Eventually consistent** | Generated by scheduled job; caregiver sees them on next dashboard visit |
| `memory_items` | **Eventually consistent** (upload ↔ elderly device availability) | New photos available to elderly user at next sync; cached locally after first download |

**Conflict resolution rule (restated from doc 01 §4):** Last-write-wins by server timestamp. Game sessions are append-only (conflict-free). Reminders and profile edits use server timestamp as tiebreaker — the most recent writer wins. This is acceptable because (a) concurrent editing of the same reminder by two caregivers is extremely rare, and (b) the consequence of a "wrong" winner is a reminder time being off by a few minutes, not data loss.

---

## 11. Backup & Recovery Strategy

| Component | Backup method | Frequency | Retention | Restore tested? |
|---|---|---|---|---|
| **Postgres (Supabase)** | Managed daily snapshots (Supabase Pro: point-in-time recovery) | Daily (auto) | 7 days (free), 30 days (Pro) | **Must test before pilot launch** — restore to a fresh instance, verify all tables + data |
| **Object storage (Supabase/R2)** | Provider-managed redundancy (3x replication) | Continuous | Indefinite | N/A — provider SLA covers durability |
| **Application code** | GitHub (full history) | Every push | Indefinite | Verified by every deploy (clone + build + run) |
| **Alembic migrations** | Part of application code (GitHub) | Every push | Indefinite | Verified by `alembic upgrade head` on every deploy |
| **Environment config** | Platform secret managers (Vercel, Render) | Platform-managed | N/A | Documented in doc 12; `.env.example` is the template |

**Restore runbook (to be tested pre-pilot):**
1. Provision a fresh Postgres instance (Supabase dashboard → Restore from backup, or create new + import dump).
2. Verify all tables present: `\dt` should match doc 04 §2 table list.
3. Verify row counts against the backup timestamp.
4. Update `DATABASE_URL` in backend environment.
5. Redeploy backend; verify `/health` returns 200.
6. Spot-check: log in as test caregiver, verify linked patient's session history is intact.
