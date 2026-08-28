# 17 — Architecture Decision Records (ADRs)

This document records the key architectural decisions made for Smriti, using a lightweight ADR format. Every significant "why did we choose X over Y?" has an ADR. New ADRs are appended as decisions are made — this is an append-only log, not a document that gets rewritten.

---

## ADR Format Template

```
### ADR-NNN: [Title]

**Status:** Proposed | Accepted | Superseded by ADR-NNN | Deprecated
**Date:** YYYY-MM-DD
**Deciders:** [who made this decision]
**Context:** [what is the situation and what forces are at play]
**Decision:** [what we decided]
**Alternatives considered:** [what else we considered and why we rejected it]
**Consequences:** [what happens because of this decision — good and bad]
```

---

## When to Write an ADR

An ADR is required for any decision that:
- Constrains future development options (hard to reverse)
- Involves a tradeoff between competing concerns (performance vs simplicity, security vs UX)
- Was debated within the team and needs a documented resolution
- A future team member would ask "why did you do it this way?"

An ADR is NOT required for:
- Implementation details that can be changed without affecting the architecture
- Decisions that are obvious given the constraints (e.g., "we used React because the team knows React")

---

## ADR Log

### ADR-001: PWA over Native App

**Status:** Accepted
**Date:** 2026-08-15
**Deciders:** Harshit, full team
**Context:** The problem statement requires a mobile-accessible platform for elderly users. The team needed to decide between a native mobile app (React Native / Flutter), a hybrid app (Capacitor), or a Progressive Web App.
**Decision:** Build as a PWA (React + Vite), installable via browser, with Service Worker for offline support.
**Alternatives considered:**
- **React Native:** Cross-platform native experience. Rejected because: adds a separate build pipeline, requires app-store submission (friction for hackathon judges), and the team has stronger web skills than mobile.
- **Flutter:** Same trade-offs as React Native, plus requires learning Dart.
- **Capacitor wrapper:** Would wrap the web app in a native shell. Deferred as a post-MVP option — we can add it later without rewriting.
**Consequences:**
- (+) Single codebase for web and "app" experience
- (+) No app-store submission friction for SIH judges
- (+) Offline-first via Service Workers is well-supported
- (+) PWA-to-native migration path exists (Capacitor) if app-store distribution becomes necessary
- (-) No access to native APIs beyond what browsers expose (no background geofencing, limited push notifications on iOS)
- (-) PWA install experience is less intuitive than app-store download for non-tech-savvy users (mitigated by caregiver-assisted setup)

---

### ADR-002: Offline-First Architecture (not Offline-Tolerant)

**Status:** Accepted
**Date:** 2026-08-15
**Deciders:** Harshit, Ananya
**Context:** NER connectivity is unreliable (~40% of districts have inconsistent 4G). The elderly app must function fully without internet for extended periods — not just "show a cached page" but actually run games, store results, and deliver reminders.
**Decision:** Offline-first: all core elderly-app functionality (games, reminders, reality orientation) works without any network connection. Data syncs when connectivity is available via an outbox pattern.
**Alternatives considered:**
- **Online-first with graceful degradation:** Rejected because "degraded" mode would need to be so capable (games, reminders, local storage) that it's essentially offline-first anyway — better to design for it from the start.
- **Full offline-only (no server):** Rejected because caregiver monitoring requires a server-side data store.
**Consequences:**
- (+) Elderly app works in zero-connectivity environments — genuine accessibility for NER
- (+) Backend downtime doesn't disrupt the primary user experience
- (-) Sync logic is the most complex part of the system (conflict resolution, idempotency)
- (-) Caregiver dashboard always shows slightly stale data (eventual consistency)
- (-) May be over-engineered if NER connectivity improves faster than expected (see doc 00 §21, self-critique #6)

---

### ADR-003: Rule-Based Adaptive Difficulty (Staircase) over ML

**Status:** Accepted
**Date:** 2026-08-16
**Deciders:** Harshit, Rehan
**Context:** The adaptive difficulty engine needs to adjust game difficulty based on user performance. Options range from simple threshold rules to reinforcement learning.
**Decision:** Use a deterministic staircase algorithm: 3 consecutive strong rounds (≥80% accuracy) → level up; 2 consecutive poor rounds (<50%) → level down; otherwise hold.
**Alternatives considered:**
- **Contextual bandit / RL:** Optimal long-term, but requires training data we don't have yet. Cold-start problem is real — what does the model do for the first 50 users?
- **Bayesian adaptive testing (IRT):** Sophisticated but overkill for 4 game types at 5 difficulty levels.
- **No adaptation (fixed difficulty):** Too simple — users would either plateau or get frustrated.
**Consequences:**
- (+) Fully deterministic and auditable — we can explain every difficulty change
- (+) Zero cold-start problem — works from the first session
- (+) Trivially unit-testable (pure function, no ML dependencies)
- (+) Clean interface designed for future swap to contextual bandit when data exists
- (-) Doesn't cross-inform between game types (attention game performance doesn't affect memory game difficulty)
- (-) May feel "mechanical" after extended use — users might notice the pattern

---

### ADR-004: Postgres over Document Store (MongoDB)

**Status:** Accepted
**Date:** 2026-08-16
**Deciders:** Harshit
**Context:** Need a primary data store for user profiles, game sessions, reminders, and analytics. The data model is relational (users → caregivers → sessions → metrics, with clear FK relationships).
**Decision:** PostgreSQL (managed via Supabase).
**Alternatives considered:**
- **MongoDB:** Flexible schema, popular with startups. Rejected because: our data model is inherently relational; joins between users/sessions/analytics are core queries; the team has stronger SQL experience; document stores make RBAC enforcement harder.
- **SQLite (embedded):** Would simplify deployment but doesn't support concurrent connections for a multi-user backend.
- **Supabase-native Auth + RLS:** Considered using Supabase Auth as primary. Rejected because: we want auth logic in our own FastAPI code (not locked into Supabase Auth); self-implementing gives more control and portability.
**Consequences:**
- (+) Strong typing, referential integrity, and ACID guarantees
- (+) Excellent ecosystem (SQLAlchemy, Alembic, psycopg2)
- (+) Trivially portable to any managed Postgres provider (Neon, RDS, etc.)
- (-) Schema changes require migrations (not a real downside — migrations are a feature, not a bug)

---

### ADR-005: FastAPI over Django/Flask

**Status:** Accepted
**Date:** 2026-08-16
**Deciders:** Harshit
**Context:** Need a Python backend framework for the REST API.
**Decision:** FastAPI.
**Alternatives considered:**
- **Django + DRF:** Full-featured but heavy — ORM, admin, template engine, etc. We only need the API layer and want to use SQLAlchemy directly.
- **Flask:** Lighter, but lacks built-in async support, auto-generated OpenAPI docs, and native Pydantic integration.
**Consequences:**
- (+) Built-in OpenAPI docs (`/docs` endpoint) — crucial for team collaboration and SIH demo
- (+) Pydantic schemas for request/response validation — catches errors at the boundary
- (+) Async support for future performance needs
- (+) Dependency injection system maps cleanly to our auth/RBAC pattern
- (-) Smaller ecosystem than Django (fewer ready-made packages)

---

### ADR-006: IndexedDB (Dexie.js) over SQLite-WASM for Client Storage

**Status:** Accepted
**Date:** 2026-08-17
**Deciders:** Ananya, Harshit
**Context:** The elderly app needs structured local storage for offline game sessions, reminders, and media references.
**Decision:** IndexedDB via Dexie.js wrapper.
**Alternatives considered:**
- **SQLite-WASM (via wa-sqlite or sql.js):** Full SQL support in the browser. Rejected because: adds ~500KB to bundle size; OPFS (Origin Private File System) support is inconsistent across mobile browsers; Dexie.js is simpler and sufficient for our access patterns.
- **localStorage:** Too limited (5MB, string-only, no indexing).
**Consequences:**
- (+) Native browser API — no additional bundle size beyond Dexie wrapper (~25KB)
- (+) Well-supported across all target browsers
- (+) Dexie.js provides a clean, Promise-based API
- (-) Not a relational database — queries are limited compared to SQL
- (-) No cross-tab locking (acceptable — elderly app is single-tab by design)

---

### ADR-007: Monorepo over Polyrepo

**Status:** Accepted
**Date:** 2026-08-15
**Deciders:** Harshit, full team
**Context:** The project has 3 deployable units (elderly app, caregiver dashboard, backend) plus shared content packs. Need to decide repository structure.
**Decision:** Single monorepo with folder-based separation (`apps/elderly-app`, `apps/caregiver-dashboard`, `apps/backend`, `packages/content-packs`).
**Alternatives considered:**
- **Polyrepo (separate repos per app):** Rejected because: 6-person team doesn't need repo-level isolation; cross-repo PRs are painful; shared types/schemas are harder to maintain.
**Consequences:**
- (+) Single PR can update backend API + both frontend consumers — atomic contract changes
- (+) Shared CI pipeline, single source of truth for docs
- (+) Simplifies onboarding (one `git clone`)
- (-) CI runs all checks even when only one app changed (acceptable at this scale)

---

### ADR-008: No Third-Party Analytics SDK on Elderly App

**Status:** Accepted
**Date:** 2026-08-17
**Deciders:** Harshit, Ananya
**Context:** Product analytics (how users interact with the app) is valuable but introduces privacy, performance, and compliance risks for the elderly app specifically.
**Decision:** No third-party analytics SDK (Google Analytics, Mixpanel, etc.) on the elderly app. Behavioral data is captured through game sessions and sync events — our own data, in our own database.
**Alternatives considered:**
- **Privacy-focused analytics (Plausible, Fathom):** Less invasive, but still a third-party SDK on a device used by a cognitively vulnerable person — hard to justify under DPDP Act's special category protections.
- **Custom client-side event tracking:** Could add a lightweight event system. Deferred — game sessions already capture the engagement data we need for MVP.
**Consequences:**
- (+) DPDP Act compliance is simpler — no third-party data processors for elderly user data
- (+) No performance impact from analytics SDK on low-end devices
- (+) Demonstrates "honest AI" principle — we don't track what we don't need
- (-) No click-level product analytics (heatmaps, funnel analysis) for the elderly app
- (-) Harder to diagnose UX issues without session recordings — mitigated by in-person user testing during pilot

---

### ADR-009: Caregiver-Proxy Consent Model (not Direct Elderly Consent)

**Status:** Accepted
**Date:** 2026-08-18
**Deciders:** Harshit
**Context:** Under DPDP Act 2023, individuals with cognitive impairment may not be able to provide informed consent for data processing. A legal guardian or caregiver must consent on their behalf.
**Decision:** The caregiver provides consent during elderly user account creation. Consent is recorded with the caregiver's identity and timestamp. The elderly user never sees a consent/privacy screen.
**Alternatives considered:**
- **Direct consent from elderly user:** Rejected — asking a dementia patient to read and accept a privacy policy is both legally insufficient and ethically inappropriate.
- **No consent recording:** Rejected — DPDP Act requires documented consent for health-adjacent data.
**Consequences:**
- (+) Legally defensible consent mechanism for a vulnerable population
- (+) Elderly user onboarding is frictionless (no legal-language barriers)
- (-) Relies on the caregiver being the legitimate guardian — we cannot verify this technically (accepted risk at pilot scale)
- (-) If DPDP Act regulations add specific requirements for health data consent (possible future rulemaking), we may need to update the flow

---

### ADR-010: Personal Baseline Only (No Population Norms)

**Status:** Accepted
**Date:** 2026-08-17
**Deciders:** Harshit, Rehan
**Context:** The analytics engine computes performance trends. A critical design question: should the dashboard show how a user compares to "normal" population ranges, or only to their own historical baseline?
**Decision:** Personal baseline only. Never show population norms, percentiles, or "normal range" bands.
**Alternatives considered:**
- **Population norms (age-matched, MMSE-correlated):** Rejected because: (a) we don't have Indian elderly population norms for our specific game battery; (b) showing "your mother is below normal" is clinically irresponsible without diagnostic context; (c) this directly violates our "no diagnosis" business rule (doc 07 §4 rule 2).
**Consequences:**
- (+) No risk of being interpreted as a diagnostic comparison
- (+) Trend against personal baseline is genuinely more useful for caregivers ("is she changing?" not "is she normal?")
- (+) Simpler analytics — no external normative dataset to source and maintain
- (-) Caregivers may ask "but is this good or bad?" and we can't answer in absolute terms — by design
