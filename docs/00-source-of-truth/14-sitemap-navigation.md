# 14 — Sitemap & Navigation / Full Workflow

## 1. Elderly App — Sitemap

```
/ (Home / Reality Orientation)
│  - Today's date, day, time, greeting, "you are at home"
│  - Next reminder card
│  - Big buttons: [Play a Game] [My Memories] [Reminders]
│
├── /login
│     - Phone/PIN entry (caregiver-assisted first-time setup)
│
├── /games                         (Game Select)
│     - 4 large tiles: Memory Match | Attention | Sequencing | Naming
│     │
│     ├── /games/memory-match      (Game Play screen)
│     │     └── /games/memory-match/result   (Result / encouragement screen)
│     ├── /games/attention-reaction
│     │     └── /games/attention-reaction/result
│     ├── /games/sequencing
│     │     └── /games/sequencing/result
│     └── /games/picture-naming
│           └── /games/picture-naming/result
│
├── /reminders                     (Today's Reminders list)
│     - Large cards per reminder, [Done] button
│
├── /memories                      (Reminiscence Gallery)
│     ├── /memories/personal       (Family photos)
│     └── /memories/cultural       (Bihu, Hornbill, festivals, local content)
│
└── /settings                      (minimal — language toggle, text size, sign out)
```

**Navigation rule (from doc 07):** every screen below Home is reachable in **≤ 2 taps** from Home, and every screen has a consistent, large "Back" control in the same screen position.

## 2. Elderly App — Navigation Flow Diagram

```
                    ┌─────────────┐
                    │    Login     │  (one-time, caregiver-assisted)
                    └──────┬──────┘
                           ▼
                    ┌─────────────┐
        ┌──────────▶│    Home      │◀──────────┐
        │           │ (Reality     │            │
        │           │  Orientation)│            │
        │           └──┬───┬───┬──┘            │
        │              │   │   │                │
        │      ┌────────┘   │   └────────┐       │
        │      ▼             ▼            ▼       │
        │  ┌────────┐   ┌─────────┐  ┌──────────┐│
        │  │ Games   │   │Reminders│  │ Memories ││
        │  │ Select  │   └────┬────┘  └────┬─────┘│
        │  └───┬────┘        │            │      │
        │      ▼             │            │      │
        │  ┌────────┐         │            │      │
        │  │ Play a  │         │            │      │
        │  │ Game    │         │            │      │
        │  └───┬────┘         │            │      │
        │      ▼             │            │      │
        │  ┌────────┐         │            │      │
        │  │ Result  │         │            │      │
        │  └───┬────┘         │            │      │
        └──────┴──────────────┴────────────┴──────┘
              (Back / Home always returns here)
```

## 3. Caregiver Dashboard — Sitemap

```
/login
/register

/                                  (Overview / Patient list — if multiple linked)
│
├── /patients/:id                  (Patient Overview)
│     - This week's snapshot: sessions, accuracy, reaction time, missed reminders
│
├── /patients/:id/analytics        (Detailed Analytics)
│     - Accuracy trend chart, reaction-time trend chart, completion rate,
│       personal baseline comparison
│
├── /patients/:id/sessions         (Session History — raw list, filterable by game)
│
├── /patients/:id/reminders        (Reminder Management)
│     - List, [+ Add Reminder], edit/delete
│
├── /patients/:id/memories         (Reminiscence Content Management)
│     - Grid of uploaded photos, [+ Add Photo] with metadata form
│
├── /patients/:id/alerts           (Alerts feed for this patient)
│
├── /alerts                        (Cross-patient alert inbox, if managing multiple)
│
└── /settings                      (Caregiver profile, linked patients, sign out)
```

## 4. Caregiver Dashboard — Navigation Flow Diagram

```
        ┌───────────┐
        │  Login /   │
        │  Register  │
        └─────┬─────┘
              ▼
        ┌───────────┐
        │  Patient   │   (skipped if only 1 linked patient — goes straight in)
        │  Overview  │
        └─┬──┬──┬──┬─┘
          │  │  │  │
   ┌──────┘  │  │  └──────┐
   ▼         ▼  ▼         ▼
┌───────┐ ┌───────┐ ┌────────┐ ┌────────┐
│Analytics│ │Sessions│ │Reminders│ │Memories│
└───────┘ └───────┘ └────────┘ └────────┘
   │
   ▼
┌───────┐
│ Alerts │  (also reachable via top-nav bell icon from any screen)
└───────┘
```

## 5. Full Cross-System Workflow (the whole product, one glance)

```
CAREGIVER                         BACKEND                         ELDERLY USER
    │                                │                                  │
    │ 1. Register + create           │                                  │
    │    elderly profile ───────────▶│                                  │
    │                                │──── creates user + link ────────▶│ (paired via code)
    │ 2. Set reminders,              │                                  │
    │    upload photos ─────────────▶│──── synced to device ───────────▶│
    │                                │                                  │
    │                                │◀──── plays games daily ──────────│ 3. Daily engagement
    │                                │      (works offline, syncs       │    loop: games,
    │                                │       when connected)            │    reminders, memories
    │                                │                                  │
    │◀──── views trends, alerts ─────│◀──── telemetry accumulates ──────│
    │ 4. Monitors weekly,            │      (accuracy, reaction time,   │
    │    adjusts reminders,          │       errors — builds personal   │
    │    adds new memories ─────────▶│       baseline over time)        │
    │                                │                                  │
    └──────────── ongoing weekly/daily loop, indefinitely ──────────────┘
```

## 6. Screen Inventory Summary (for design/build tracking, ties to doc 03 Tier 1)

| # | Screen | App | Tier |
|---|---|---|---|
| 1 | Login (elderly) | Elderly | 1 |
| 2 | Home / Reality Orientation | Elderly | 1 |
| 3 | Game Select | Elderly | 1 |
| 4–7 | 4x Game Play screens | Elderly | 1 |
| 8–11 | 4x Game Result screens | Elderly | 1 |
| 12 | Reminders list | Elderly | 1 |
| 13 | Memories — Personal | Elderly | 1 |
| 14 | Memories — Cultural | Elderly | 1 |
| 15 | Settings (minimal) | Elderly | 1 |
| 16 | Login/Register | Caregiver | 1 |
| 17 | Patient Overview | Caregiver | 1 |
| 18 | Analytics | Caregiver | 1 |
| 19 | Session History | Caregiver | 1 |
| 20 | Reminder Management | Caregiver | 1 |
| 21 | Memories Management | Caregiver | 1 |
| 22 | Alerts | Caregiver | 1 |
| 23 | Voice demo overlay | Elderly | 2 |
| 24 | Multi-patient switcher | Caregiver | 2 |
