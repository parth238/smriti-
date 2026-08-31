# Ananya — Offline & Dexie FAQ

**Last updated:** 2026-08-31 · Branch `feature/phase1-close-gaps`  
**Audience:** Ananya (T3 offline/sync) and anyone flagging storage inconsistencies in Cursor.

---

## TL;DR — follow docs, not the old localStorage hack

| Data | Canonical store | Why |
|------|-----------------|-----|
| Reminders (list + ack state) | **Dexie `reminders` table** | Offline-first per `04-database.md` §4 |
| Game sessions | **Dexie `sessions` table** | Offline play + sync |
| Sync queue | **Dexie `outbox` table** | Ordered flush to `/sync/batch` |
| Family photos metadata | **Dexie `memoryItems` table** | Offline reminiscence |
| Paired user record | **Dexie `paired` table** | Offline re-login lookup |
| JWT access token | **sessionStorage + localStorage** `smriti.access` | Survives tab close / offline re-login |
| User id | **sessionStorage + localStorage** `smriti.userId` | Same |
| Paired flag | **sessionStorage + localStorage** `smriti.paired` | Offline login gate |
| Device id | **localStorage** `smriti.deviceId` | Stable id for `/sync/batch` |
| Last game path | **sessionStorage** `smriti.lastGame` | UI convenience only |
| Language / text size | **localStorage** | UI prefs only |

**Do NOT store reminders in localStorage.** The legacy key `smriti.reminders` was removed 2026-08-31. If you see it in old branches, delete it — use Dexie.

---

## Q1: Ananya made a different Dexie schema; Anirudh's is "halfway" — which is canonical?

**Answer:** Use the schema in `apps/elderly-app/src/db/dexie.ts` (DB name `smriti_elderly`). Do not invent parallel tables.

Doc names in `04-database.md` use Postgres-style suffixes (`reminders_local`, `game_sessions_local`). In code we use shorter Dexie table names that map 1:1:

| Doc name (`04-database.md`) | Code table (`dexie.ts`) | Purpose |
|-----------------------------|-------------------------|---------|
| `game_sessions_local` | `sessions` | Offline game telemetry |
| `reminders_local` | `reminders` | Cached reminder list + local ack |
| `memory_items_local` | `memoryItems` | Cached family photo metadata |
| `sync_outbox` | `outbox` | Pending writes for background sync |
| *(not in doc v1)* | `paired` | Device pairing for offline login |

**Schema versions:** v1 → sessions/outbox/reminders/paired; v2 → `scheduledTime` index on reminders; v3 → `memoryItems`.

If you need new indexes or fields, **add `version(N+1)`** in `dexie.ts` — never rewrite v1 in place on deployed devices.

---

## Q2: Reminders were in localStorage — follow docs or Anirudh's approach?

**Answer:** Follow **docs** (Dexie). The localStorage path was a **pre-API demo fallback** in the deleted `store/demoStore.ts`. It violated `04-database.md` §4 and caused Ananya's confusion.

**Current flow (canonical):**

1. `api/reminders.ts` → `syncReminders()` pulls from `GET /users/{id}/reminders` when online.
2. Response rows are written to **Dexie `reminders`** via `bulkPut`.
3. Offline or API failure → read from Dexie only (`loadRemindersFromCache`).
4. If Dexie is empty and API unreachable → **seed demo rows** into Dexie via `db/reminderSeed.ts` (ids prefixed `demo-`, no server ack).
5. Acknowledge → update Dexie row (`done: 1`), enqueue **`reminder_ack`** outbox item (unless demo id), flush on reconnect.

**Hooks:**

- `hooks/useReminders.ts` — full list screen
- `hooks/useHomeReminder.ts` — next open reminder on home (Dexie only)

**Removed:** `smriti.reminders` localStorage key, `demoStore.loadReminders()`, `markReminderDone()`.

---

## Q3: What goes in localStorage vs sessionStorage vs Dexie?

### Dexie (IndexedDB) — durable app data

Anything that must survive offline and sync later:

- Reminders cache + ack state
- Game sessions + outbox
- Memory item metadata
- Paired user row

Files: `src/db/dexie.ts`, `src/db/syncOutbox.ts`, `src/db/memoryCache.ts`, `src/db/reminderSeed.ts`

### localStorage — small strings that must survive browser restart

- `smriti.access` — JWT (duplicate of session for offline re-login)
- `smriti.userId`
- `smriti.paired` — `"1"` if device was paired online once
- `smriti.deviceId` — UUID for sync batch
- `smriti.lang`, text size prefs

Centralized in: `src/lib/authStorage.ts`

### sessionStorage — tab/session UI state

- Same auth keys as localStorage (tab-scoped copy)
- `smriti.lastGame` — return path after game result
- `smriti.splash`, `smriti.lastSave` — ephemeral UI flags

**Rule of thumb:** If Harshit's API owns the data and it must work offline → Dexie. If it's auth or UI chrome → web storage.

---

## Q4: Outbox kinds — what exists?

Defined in `dexie.ts` as discriminated union on `OutboxItem.kind`:

| `kind` | API type in `/sync/batch` | When enqueued |
|--------|---------------------------|---------------|
| `game_session` | `game_session` | After each completed game (`syncOutbox.enqueueSession`) |
| `reminder_ack` | `reminder_ack` | When user marks reminder done while offline or POST fails |

Flush logic: `db/syncOutbox.ts` → `flushOutbox(token)` tries batch first, falls back to direct POST per item. Triggered by `hooks/useOfflineSync.ts` on `online`, interval, and exponential retry.

**Do not add new kinds without updating:** backend `/sync/batch` handler, `05-api.md` §6, and this doc.

---

## Sync flow (prose diagram)

```
[Elderly plays game offline]
  → saveLocalSession() writes Dexie `sessions`
  → enqueueSession() appends Dexie `outbox` (kind: game_session)

[Elderly marks reminder done offline]
  → db.reminders.update(id, { done: 1 })
  → enqueueReminderAck() appends Dexie `outbox` (kind: reminder_ack)

[Device comes online]
  → useOfflineSync hears "online"
  → flushOutbox(token) reads outbox ordered by createdAt
  → POST /sync/batch { device_id, items: [...] }
  → on ack: delete outbox row; for game_session mark session synced=1

[Caregiver adds reminder while elderly offline]
  → (Ananya TODO) GET /sync/status?since= on reconnect
  → syncReminders() replaces Dexie `reminders` from GET /users/{id}/reminders
  → (Ananya TODO) local Notification API schedule from scheduledTime

[Caregiver uploads family photo]
  → loadFamilyMemories() on reconnect
  → cacheFamilyMemories() writes Dexie `memoryItems`
```

---

## Q5: What should Ananya build next (no conflicts)?

| Task | Status | Your files | Do NOT |
|------|--------|------------|--------|
| Dexie schema v3 + memoryItems | **Done** (Anirudh) | Extend via v4 if needed | Rename tables |
| Outbox game_session + reminder_ack | **Done** | Harden retry/backoff in `syncOutbox.ts` | Move acks to localStorage |
| Workbox precache | **Partial** | `vite.config` / SW polish | Break game PNG paths |
| Background Sync tag | **NOT_STARTED** | Register sync in SW; call `flushOutbox` | Duplicate outbox in SW cache |
| Pull on reconnect | **NOT_STARTED** | Wire `GET /sync/status` + reminder pull | Second reminders cache |
| Local notifications | **NOT_STARTED** | Schedule from Dexie `reminders.scheduledTime` | Store notification state in localStorage |
| E2E offline test | **NOT_STARTED** | Playwright or manual script in `docs/` | |

**Safe extension points for Ananya:**

1. `hooks/useOfflineSync.ts` — add pull after flush
2. `public/` + Workbox — Background Sync registration
3. New file `src/notifications/reminderScheduler.ts` — read Dexie, use Notification API
4. Tests under `apps/elderly-app/src/db/` for outbox ordering

---

## File map (quick reference)

```
apps/elderly-app/src/
  db/
    dexie.ts           ← schema + types (SOURCE OF TRUTH)
    syncOutbox.ts      ← enqueue + flush
    memoryCache.ts     ← memoryItems read/write
    reminderSeed.ts    ← offline demo seeds (Dexie, not localStorage)
  api/
    reminders.ts       ← sync + ack (Dexie-backed)
    memories.ts        ← family photos API + cache
    auth.ts            ← login; uses authStorage for offline paired login
  lib/
    authStorage.ts     ← all smriti.* web storage keys
  store/
    sessionPrefs.ts    ← greeting + lastGame (UI only)
  hooks/
    useOfflineSync.ts  ← online flush loop
    useReminders.ts
    useHomeReminder.ts
```

Docs to keep aligned: `docs/00-source-of-truth/04-database.md` §4, `05-api.md` §6.

---

## Flagging inconsistencies in Cursor

When you find a mismatch, check in order:

1. `04-database.md` §4 — intended design
2. `apps/elderly-app/src/db/dexie.ts` — actual schema
3. Grep `localStorage` in `apps/elderly-app` — should **not** hit reminder data
4. Post in WhatsApp with file path + line; add Q&A here if it's a repeat question

**Resolved 2026-08-31:** Reminders localStorage removed; Dexie canonical; auth keys centralized in `authStorage.ts`; Reminiscence screens split under `screens/reminiscence/`.

**Voice prefs (2026-08-31):** `smriti.voice` in localStorage (`on`/`off`) — UI preference only, not synced. Module: `src/voice/CompanionVoice.tsx`.
