# 09 — Workflows

## 1. Onboarding Workflow

1. Caregiver installs/opens `caregiver.smriti.in`, registers account.
2. Caregiver creates elderly user profile: name, preferred language, DOB (optional), sets a 4-digit PIN.
3. Caregiver adds initial reminders (medicine times, appointments).
4. Caregiver uploads a few starter family photos with names/relationships (seeds the reminiscence gallery).
5. Caregiver opens the elderly app on the patient's device (or hands off a QR/pairing code), logs in once with phone+PIN — device is now "paired" and stays signed in.
6. Elderly user sees Home screen for the first time: greeting, today's date, first reminder, "Play a game?" prompt.

## 2. Daily Elderly-User Workflow

```
Open app (or app already backgrounded/installed as PWA)
   ↓
Home screen: Reality Orientation
   (day/date/time, "you are at home", next reminder)
   ↓
[Reminder due?] → gentle notification → user acknowledges
   ↓
User taps "Play" → Game Select screen (4 large tiles)
   ↓
Plays a game (15-30 min typical session)
   ↓
Result shown warmly ("Well done!") — never a harsh score
   ↓
Optionally browses Reminiscence gallery
   ↓
Session data saved locally; synced when online
```

## 3. Daily/Weekly Caregiver Workflow

```
Caregiver logs into dashboard
   ↓
Sees Patient Overview: sessions this week, accuracy trend,
reaction-time trend, missed reminders count
   ↓
[Any alerts?] → reviews plain-language notice
   (e.g., "Reaction time higher than usual this week")
   ↓
Adjusts reminders if needed / uploads a new family photo
   ↓
Closes dashboard — no action needed most days
```

## 4. Adaptive Difficulty Workflow (system-level, runs on every session submit)

```
Session submitted (online or via sync)
   ↓
Backend fetches last 5 sessions for (user_id, game_type)
   ↓
Apply staircase rule (doc 02 §4)
   ↓
Update recommended difficulty for next play
   ↓
Response includes next_difficulty → client caches it for next launch
```

## 5. Offline → Online Sync Workflow

```
User plays offline
   ↓
Each session/action → written to IndexedDB sync_outbox
   (client_generated_id assigned locally)
   ↓
Connectivity restored
   ↓
Service Worker background sync triggers
   ↓
POST /sync/batch with queued outbox items
   ↓
Backend processes idempotently (dedupe by client_generated_id)
   ↓
Backend recomputes difficulty + analytics for affected sessions
   ↓
Response returns per-item ack → client marks outbox items "synced",
removes from outbox, pulls down any server-side changes
   (e.g., a reminder the caregiver added while offline)
```

## 6. Reminder Lifecycle

```
Caregiver creates reminder (type, time, recurrence)
   ↓
Stored server-side, synced to elderly device on next connection
   ↓
At scheduled time, local notification fires on device
   (works offline — reminder time + recurrence cached locally,
    scheduling handled by client, not dependent on live push)
   ↓
User acknowledges/dismisses → logged (locally first, synced later)
   ↓
If reminder unacknowledged past a grace window → flagged for
   caregiver's "missed reminder" alert on next sync
```

## 7. Content Upload Workflow (Caregiver → Reminiscence Gallery)

```
Caregiver: Memories tab → "Add Photo"
   ↓
Selects file, fills metadata (name, relationship, year, location)
   ↓
Confirms consent checkbox
   ↓
POST /memory-items (multipart) → file to object storage,
   metadata row to Postgres
   ↓
Item appears in elderly app's gallery on next sync,
   available offline afterward (cached locally)
   ↓
Optionally surfaces as a "Do you remember...?" prompt
   inside the Picture Naming game
```

## 8. Incident/Failure Workflow — Backend Downtime
```
Elderly app: unaffected for core features (offline-first) —
   games/reminders/cached reminiscence continue working
   ↓
Sessions queue locally as usual
   ↓
Caregiver dashboard: shows cached last-known data +
   "Data may be out of date" banner
   ↓
On backend recovery: normal sync resumes automatically,
   no manual intervention needed
```

## 9. Development/Team Workflow (process, not product)

1. Sprint planning against doc 03 tiers (Tier 1 first, always).
2. Each feature ticket references the doc section it implements.
3. Daily standup (async in chat is fine): blockers, what's shipped, what's next.
4. PR → CI → 1-2 reviewers → merge → auto-deploy to staging.
5. Weekly integration check: run the full elderly-app + backend + dashboard flow end-to-end, offline and online, to catch integration drift early — this is the single highest-value recurring task given how many moving offline/sync parts exist.
