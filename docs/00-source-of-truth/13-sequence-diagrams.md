# 13 — Sequence Diagrams

All diagrams in Mermaid syntax — render directly on GitHub, or paste into mermaid.live for a visual.

## 1. Elderly User Login (Device Pairing)

```mermaid
sequenceDiagram
    participant C as Caregiver Dashboard
    participant B as Backend (FastAPI)
    participant D as DB (Postgres)
    participant E as Elderly App (device)

    C->>B: POST /auth/user/create {name, language, pin}
    B->>D: INSERT users, caregiver_user_links
    D-->>B: user_id
    B-->>C: {user_id, pairing_code}
    C->>E: Caregiver enters pairing_code on device (in person)
    E->>B: POST /auth/user/login {user_id/phone, pin}
    B->>D: verify hashed pin
    D-->>B: match OK
    B-->>E: {access_token, refresh_token}
    E->>E: store tokens in IndexedDB (long-lived, paired device)
```

## 2. Play a Game — Online

```mermaid
sequenceDiagram
    participant U as Elderly User
    participant E as Elderly App
    participant B as Backend
    participant AD as Adaptive Difficulty Engine
    participant D as DB

    U->>E: Tap "Memory Match"
    E->>B: GET /games/memory_match/next-difficulty?user_id=
    B->>AD: compute recommended difficulty
    AD->>D: fetch last 5 sessions
    D-->>AD: session history
    AD-->>B: difficulty = 3
    B-->>E: {difficulty: 3}
    E->>U: renders game at level 3
    U->>E: completes game (accuracy, reaction_time, etc.)
    E->>B: POST /game-sessions {...}
    B->>D: INSERT game_sessions
    B->>AD: recompute next difficulty
    B->>D: UPDATE performance_metrics (async)
    B-->>E: {id, next_difficulty, synced_at}
    E->>U: "Well done!" + local cache updated
```

## 3. Play a Game — Offline, Then Sync

```mermaid
sequenceDiagram
    participant U as Elderly User
    participant E as Elderly App
    participant L as IndexedDB (local)
    participant SW as Service Worker
    participant B as Backend
    participant D as DB

    Note over E: No connectivity
    U->>E: completes game
    E->>L: write session (local difficulty rule applied)
    E->>U: "Well done!" (optimistic, instant)
    E->>L: append to sync_outbox

    Note over SW: Connectivity restored
    SW->>SW: Background Sync event fires
    SW->>B: POST /sync/batch {items: [session,...]}
    B->>D: INSERT (idempotent on client_generated_id)
    B->>D: recompute difficulty + analytics
    B-->>SW: {per-item ack, synced_at}
    SW->>L: mark outbox items synced, clear outbox
    SW->>E: pull down server changes (new reminders, etc.)
```

## 4. Caregiver Views Analytics

```mermaid
sequenceDiagram
    participant CG as Caregiver
    participant CD as Caregiver Dashboard
    participant B as Backend
    participant AE as Analytics Engine
    participant D as DB

    CG->>CD: Open Patient Overview
    CD->>B: GET /users/{id}/analytics?period=7d
    B->>AE: compute rolling stats
    AE->>D: query game_sessions (last 7d), baseline
    D-->>AE: raw session rows
    AE->>AE: compute avg_accuracy, avg_reaction_time, deltas
    AE-->>B: metrics object
    B-->>CD: {avg_accuracy, reaction_time_delta_pct, ...}
    CD->>CG: renders trend chart + plain-language note
```

## 5. Reminder Creation → Delivery → Acknowledgment

```mermaid
sequenceDiagram
    participant CG as Caregiver
    participant CD as Caregiver Dashboard
    participant B as Backend
    participant D as DB
    participant E as Elderly App
    participant U as Elderly User

    CG->>CD: Create reminder (Medicine, 8:00 PM, daily)
    CD->>B: POST /reminders {...}
    B->>D: INSERT reminders
    B-->>CD: 201 Created

    Note over E: Next sync (online or already synced)
    E->>B: GET /users/{id}/reminders
    B->>D: SELECT active reminders
    D-->>B: reminders list
    B-->>E: reminders (cached locally in IndexedDB)

    Note over E: Client-side scheduler fires at 8:00 PM (works offline)
    E->>U: Local notification "Medicine time"
    U->>E: Tap "Done"
    E->>E: write ack to IndexedDB (+ sync_outbox if offline)
    E->>B: POST /reminders/{id}/acknowledge (immediate or on sync)
    B->>D: UPDATE last_acknowledged_at
```

## 6. Caregiver Uploads a Reminiscence Photo

```mermaid
sequenceDiagram
    participant CG as Caregiver
    participant CD as Caregiver Dashboard
    participant B as Backend
    participant S as Object Storage
    participant D as DB
    participant E as Elderly App

    CG->>CD: Select photo + fill metadata + confirm consent
    CD->>B: POST /memory-items (multipart)
    B->>S: upload file
    S-->>B: media_url
    B->>D: INSERT memory_items {media_url, metadata}
    B-->>CD: 201 Created

    Note over E: Next sync
    E->>B: GET /memory-items?user_id=
    B->>D: SELECT items (personal + cultural pack)
    D-->>B: rows
    B-->>E: items list
    E->>E: cache media locally for offline viewing
```

## 7. Missed Reminder → Caregiver Alert

```mermaid
sequenceDiagram
    participant Scheduler as Backend Scheduled Job
    participant D as DB
    participant B as Backend
    participant CD as Caregiver Dashboard
    participant CG as Caregiver

    Scheduler->>D: find reminders past due + unacknowledged (grace window elapsed)
    D-->>Scheduler: list of overdue reminders
    Scheduler->>D: INSERT alerts {type: missed_reminder, message}
    Note over CD: Caregiver opens dashboard
    CD->>B: GET /caregivers/{id}/alerts?unread=true
    B->>D: SELECT alerts
    D-->>B: alerts list
    B-->>CD: alerts
    CD->>CG: shows notice "Medicine reminder at 8 PM was not acknowledged"
```
