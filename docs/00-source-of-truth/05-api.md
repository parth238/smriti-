# 05 — API Specification

**Base URL (dev):** `http://localhost:8000/api/v1`
**Base URL (prod):** `https://api.smriti.in/api/v1`
**Format:** REST + JSON. **Auth:** Bearer JWT in `Authorization` header (except `/auth/*`).
**Live docs:** FastAPI auto-generates Swagger at `/docs` and ReDoc at `/redoc` — this file is the human-readable companion, keep both in sync.

## 1. Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/caregiver/register` | Create caregiver account (name, phone, email, password) |
| POST | `/auth/caregiver/login` | Returns `{access_token, refresh_token}` |
| POST | `/auth/user/create` | Caregiver creates an elderly user profile + links it (PIN-based simple login for elderly) |
| POST | `/auth/user/login` | Elderly login via phone + PIN (or caregiver-assisted QR/code) |
| POST | `/auth/refresh` | Exchange refresh token for new access token |
| POST | `/auth/logout` | Invalidate refresh token |

## 2. Users & Linking

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/{user_id}` | Get elderly user profile |
| PATCH | `/users/{user_id}` | Update profile (name, language, photo) |
| GET | `/caregivers/{caregiver_id}/patients` | List elderly users linked to this caregiver |
| POST | `/caregiver-links` | Link a caregiver to a user (relationship, is_primary) |
| DELETE | `/caregiver-links/{link_id}` | Unlink |

## 3. Games

| Method | Endpoint | Description |
|---|---|---|
| GET | `/games` | List available game catalog (localized names, domains) |
| GET | `/games/{game_type}/next-difficulty?user_id=` | Returns current recommended difficulty (adaptive engine) |
| POST | `/game-sessions` | Submit a completed session `{user_id, game_id, difficulty, accuracy, reaction_time_ms, errors, hints_used, session_duration_sec, completed_or_quit, client_generated_id, played_at}` |
| GET | `/users/{user_id}/game-sessions?limit=&game_type=` | Session history |

**Sample request — POST `/game-sessions`:**
```json
{
  "user_id": "uuid",
  "game_id": "uuid",
  "difficulty": 3,
  "accuracy": 78.5,
  "reaction_time_ms": 3400,
  "errors": 2,
  "hints_used": 1,
  "session_duration_sec": 145,
  "completed_or_quit": "completed",
  "client_generated_id": "uuid-client-side",
  "played_at": "2026-08-28T09:15:00+05:30"
}
```
**Response:**
```json
{
  "id": "uuid",
  "next_difficulty": 3,
  "synced_at": "2026-08-28T09:15:02+05:30"
}
```

## 4. Reminders

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/{user_id}/reminders` | List active reminders |
| POST | `/reminders` | Create reminder (caregiver only) |
| PATCH | `/reminders/{id}` | Edit |
| DELETE | `/reminders/{id}` | Deactivate |
| POST | `/reminders/{id}/acknowledge` | Elderly user dismisses/confirms a reminder |
| GET | `/users/{user_id}/reminders/next` | Returns the next upcoming reminder (for home-screen display) |

## 5. Reminiscence / Memories

| Method | Endpoint | Description |
|---|---|---|
| GET | `/memory-items?user_id=&category=` | List memory items (personal + shared cultural pack) |
| POST | `/memory-items` | Upload new item (multipart: file + metadata) — caregiver only |
| PATCH | `/memory-items/{id}` | Edit metadata |
| DELETE | `/memory-items/{id}` | Remove |
| GET | `/memory-items/cultural-pack?language=as` | Get the shared cultural content pack for a language/region |

## 6. Sync

| Method | Endpoint | Description |
|---|---|---|
| POST | `/sync/batch` | Accepts an array of queued offline writes (sessions, reminder acks); processes idempotently via `client_generated_id`; returns per-item status |
| GET | `/sync/status?user_id=&since=` | Returns server-side changes since a given timestamp, for client to pull down (e.g. new reminders set by caregiver while offline) |

**Sample `/sync/batch` request:**
```json
{
  "device_id": "device-uuid",
  "items": [
    {"type": "game_session", "payload": { "...": "..." }},
    {"type": "reminder_ack", "payload": {"reminder_id": "uuid", "acknowledged_at": "..."}}
  ]
}
```

## 7. Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/{user_id}/analytics?period=7d` | Rolling accuracy/reaction-time/completion stats |
| GET | `/users/{user_id}/analytics/baseline` | Personal baseline values |
| GET | `/users/{user_id}/analytics/trend?metric=accuracy&days=90` | Time series for charting |

**Sample response — `/analytics?period=7d`:**
```json
{
  "period": "7d",
  "avg_accuracy": 78.2,
  "avg_reaction_time_ms": 3200,
  "completion_rate": 0.91,
  "sessions_count": 5,
  "baseline_comparison": {
    "reaction_time_delta_pct": 18.0,
    "note": "Reaction time is 18% higher than this user's personal baseline over the selected period."
  }
}
```

## 8. Alerts

| Method | Endpoint | Description |
|---|---|---|
| GET | `/caregivers/{caregiver_id}/alerts?unread=true` | List alerts across linked patients |
| POST | `/alerts/{id}/mark-read` | Mark alert read |

## 9. Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "accuracy must be between 0 and 100",
    "field": "accuracy"
  }
}
```
Standard HTTP codes: `400` validation, `401` unauthenticated, `403` unauthorized (e.g. caregiver not linked to user), `404` not found, `409` conflict (duplicate `client_generated_id` handled idempotently, not an error), `422` schema error, `500` server error.

## 10. Rate Limiting & Idempotency

- `POST /game-sessions` and `/sync/batch` are idempotent on `client_generated_id` — safe to retry on flaky connections.
- Basic rate limiting on auth endpoints (5 attempts/min) to prevent brute force on elderly PIN login.
