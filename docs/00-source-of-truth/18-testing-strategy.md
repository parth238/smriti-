# 18 — Testing & Quality Engineering

This document defines Smriti's testing strategy, standards, and quality metrics. It covers the testing pyramid, per-layer testing standards, critical e2e user journeys, and what testing we're deliberately NOT doing at MVP (and when we will).

---

## 1. Testing Philosophy

**Test what matters, at the right level.** A 6-person team building an MVP cannot afford exhaustive testing at every layer — but it also cannot afford to ship a cognitive wellness app for vulnerable users without confidence in correctness. The strategy: heavy unit testing on business logic (cheap, fast, high signal), targeted integration tests on the API contract (the seam between teams), and manual e2e tests on the critical user journeys (the demo-day paths).

**Rule:** If it's a business rule from doc 07 §4, it MUST have a test. These rules are non-violable, and the tests are the enforcement mechanism.

---

## 2. Testing Pyramid

```
        ╱ ╲
       ╱ E2E ╲         ← 5-10 manual journeys (critical paths only)
      ╱ (manual) ╲       Run: weekly integration check + before demo
     ╱─────────────╲
    ╱  Integration   ╲   ← API contract tests (request → response shape)
   ╱  (~30-50 tests)  ╲    Run: CI on every PR
  ╱─────────────────────╲
 ╱      Unit Tests       ╲ ← Business logic, pure functions, services
╱    (~100-200 tests)     ╲   Run: CI on every PR
╱───────────────────────────╲
```

**Shape rationale:** Heavy base of unit tests because business logic (adaptive difficulty, analytics computation, auth, sync idempotency) is the highest-risk code AND the easiest to test in isolation. Integration tests cover the API contract (the team's primary collaboration seam). E2E is manual because automated browser testing is expensive to set up and maintain for a 6-person team — the weekly integration check (doc 16 §5) serves this purpose.

---

## 3. Unit Testing Standards

### Backend (Python — pytest)

**Naming convention:** `test_<module>_<behavior>.py` — e.g., `test_adaptive_difficulty_level_up_after_three_strong.py` or grouped in `test_adaptive_difficulty.py` with descriptive test function names.

**Test function naming:**
```python
# Good — describes the behavior being tested
def test_level_up_after_three_consecutive_strong_rounds():
def test_level_stays_when_mixed_performance():
def test_no_level_below_minimum():

# Bad — describes the implementation, not the behavior
def test_get_next_difficulty():
def test_function_returns_int():
```

**Mocking rules:**
- **Mock at the boundary, not the internals.** Mock the database session, not individual SQLAlchemy model methods.
- **Never mock the thing you're testing.** If you're testing the adaptive difficulty engine, don't mock the staircase logic.
- **Prefer fakes over mocks** for simple dependencies (e.g., an in-memory dict instead of a mock Redis).

**Determinism:**
- No tests that depend on current time (`datetime.now()`) — inject time as a parameter or use `freezegun`.
- No tests that depend on random values — seed random generators or mock them.
- No tests that depend on external services — all external calls mocked/faked.

**Coverage target:** No hard coverage percentage target (chasing numbers leads to bad tests). Instead: every function in `app/services/` and `app/core/` must have at least one happy-path test and one error-path test. Routes (`app/api/`) are covered by integration tests.

### Frontend (TypeScript — Vitest)

**What to unit test:**
- Utility functions (date formatting, score calculations, language string lookups)
- Custom hooks with complex logic (`useOfflineSync`, `useAdaptiveDifficulty`)
- State management logic (if using Zustand/Redux)

**What NOT to unit test:**
- Simple presentational components (a Card that renders children) — waste of effort at this scale.
- Components that are essentially API-response renderers — covered by integration/e2e.

**Determinism:** Same rules as backend — no time-dependent, random-dependent, or network-dependent unit tests.

---

## 4. Integration Testing Standards

### Backend API Tests (pytest + httpx TestClient)

**Scope:** Each API endpoint gets at least one integration test that:
1. Sends a real HTTP request to the FastAPI test client
2. Hits a real (test) database (SQLite in-memory or test Postgres via Docker)
3. Verifies the response status code, shape (Pydantic model), and key data fields

**What to test per endpoint:**

| Test type | Example |
|---|---|
| **Happy path** | `POST /auth/caregiver/register` with valid data → 201 + token |
| **Auth enforcement** | Same endpoint without token → 401 |
| **Authorization** | Caregiver A tries to access Caregiver B's patient → 403 |
| **Validation** | Missing required field → 400 with specific `error_code` |
| **Idempotency** | `POST /sync/batch` with same `client_generated_id` twice → second call is a no-op, not an error |
| **Pagination** | `GET /users/{id}/game-sessions?page=1&per_page=10` returns correct page metadata |

**Database setup/teardown:**
- Each test function gets a fresh database transaction that is **rolled back** after the test — no test data leaks between tests.
- Seed data (test users, caregivers, games) created in a shared `conftest.py` fixture.

### Contract Testing (stretch goal, Tier 2+)

At Tier 2, if the team grows or frontend/backend development decouples significantly, consider adding contract tests (Pact or a simple OpenAPI diff check in CI) to catch API shape drift between what the frontend expects and what the backend actually returns.

---

## 5. Critical End-to-End User Journeys

These are the paths that must work for the SIH demo and pilot. They are tested **manually** during the weekly integration check (doc 16 §5) and during the demo-day rehearsal (doc 16 §7).

### Journey 1: Caregiver Onboarding → Patient Setup
1. Open caregiver dashboard → Registration screen
2. Register with email + password → Dashboard loads
3. "Add Patient" → Enter patient name, phone, create PIN → Patient linked
4. Verify: patient appears in dashboard patient list

### Journey 2: Elderly User Login → Game → Result
1. Open elderly app on a separate device/browser
2. Enter phone + PIN → Home screen with Reality Orientation
3. Tap a game tile → Game loads
4. Play through the game → Result screen with warm completion language
5. Verify: result screen shows (no score headline, warm message)
6. Verify: session saved locally (check IndexedDB if online; check sync outbox if offline)

### Journey 3: Offline Play → Reconnect → Sync
1. Disconnect network (airplane mode / DevTools offline)
2. Play 2-3 games → Results show normally
3. Verify: results in IndexedDB `sync_outbox`
4. Reconnect network
5. Wait ≤5s → outbox drains automatically
6. Verify: sessions appear in Postgres (check via API or dashboard)

### Journey 4: Caregiver Views Analytics
1. After Journey 2/3 creates some sessions
2. Open caregiver dashboard → Select patient → Analytics
3. Verify: trend chart shows accuracy/reaction-time data with personal baseline dashed line
4. Verify: tooltip shows plain-language note (not clinical jargon)
5. Verify: NO population "normal range" band displayed (ADR-010)

### Journey 5: Reminder Lifecycle
1. Caregiver creates a reminder (e.g., "Medicine at 8 PM") via dashboard
2. Reminder appears in elderly app reminders list (after sync)
3. At scheduled time, reminder displays prominently on elderly app
4. Elderly user taps "Done" → acknowledgment recorded
5. Verify: caregiver dashboard shows reminder as acknowledged

### Journey 6: Language Toggle
1. Elderly app → Settings → Toggle language to Assamese
2. Navigate through all screens → Verify all text is in Assamese (no JSON key fallbacks visible)
3. Toggle back to English → Verify no broken strings

### Journey 7: Demo-Day Centerpiece (Offline → Online Full Loop)
This is Journey 3 but performed **on the actual demo device**, in front of the team, at least twice before demo day. See doc 16 §7 and doc 11 §8 for the full checklist.

---

## 6. Risk-Based Testing Policy

| Risk level | What it means | Testing requirement |
|---|---|---|
| **Critical** | Failure causes data loss, security breach, or violates a doc 07 §4 business rule | Unit test + integration test + manual e2e journey. No exceptions. |
| **High** | Failure degrades a core feature (games, sync, reminders) | Unit test + at least one integration test |
| **Medium** | Failure degrades a secondary feature (analytics chart rendering, settings screen) | Unit test for logic; visual check during weekly integration |
| **Low** | Failure is cosmetic or affects edge cases | Test if convenient; don't block a PR for it |

**Mapping to code areas:**

| Code area | Risk level | Rationale |
|---|---|---|
| Auth/security (`core/security.py`, `api/v1/auth.py`) | Critical | Wrong auth = data exposure |
| Adaptive difficulty (`services/adaptive_difficulty.py`) | Critical | Wrong difficulty = bad user experience for vulnerable users |
| Sync batch processing (`api/v1/sync.py`) | Critical | Data loss risk |
| Game session recording | High | Core feature; data integrity |
| Analytics computation | Medium | Affects caregiver dashboard; not user-facing to elderly |
| Reminder CRUD | High | Direct impact on medication adherence |
| UI component rendering | Low-Medium | Important for UX, but not data-integrity critical |

---

## 7. What Testing We're NOT Doing (and When We Will)

| Testing type | Status | Why not now | When to add |
|---|---|---|---|
| **Automated browser e2e (Playwright/Cypress)** | ❌ Not doing | Setup + maintenance cost for 6 people; manual weekly checks are sufficient at this scale | Tier 2 (>500 users) or when the team grows beyond 6 |
| **Performance/load testing** | ❌ Not doing | Peak load is ~2 RPS — no meaningful load to test against | Tier 2 (>500 users); use k6 or Locust |
| **Security penetration testing** | ❌ Not doing | Cost + expertise; OWASP mapping (doc 08 §10) is the current defense | Tier 3 (first B2G contract); hire external firm |
| **Chaos engineering** | ❌ Not doing | Single-instance, managed hosting — not enough infrastructure to break | Tier 3+ (multi-instance, multi-service) |
| **Visual regression testing (Percy/Chromatic)** | ❌ Not doing | Design system is new; too many intentional visual changes during MVP | After design system stabilizes (post-pilot) |
| **Contract testing (Pact)** | ❌ Not doing | Team is co-located and communicating; API drift is caught in integration tests | Tier 2 (if frontend/backend teams decouple) |
| **AI evaluation pipeline** | ❌ Not doing | No ML in v1; rule-based difficulty is tested via unit tests | V2 (when contextual bandit is introduced) |
| **Accessibility automated testing (axe-core)** | ⚠️ Stretch | Manual contrast checks + WCAG compliance checks in doc 15; axe-core in CI would catch regressions | Add to CI after MVP if time permits; mandatory at Tier 1 |

---

## 8. Flaky Test Policy

A flaky test is one that sometimes passes and sometimes fails without code changes. Flaky tests are a tax on the team — they slow down CI, erode trust in the test suite, and waste time investigating phantom failures.

**Policy:**
1. If a test fails intermittently, it is marked with `@pytest.mark.skip(reason="FLAKY: [description]")` or `test.skip()` immediately — don't let it block other PRs.
2. A GitHub Issue is filed with the `flaky-test` label, including: which test, how often it fails, suspected cause.
3. The issue must be resolved within 1 sprint (fix the root cause, not just retry logic).
4. **Zero tolerance for flaky tests in CI** — either fix it, skip it with documentation, or delete it. Never leave a test that "usually passes" as a required check.

---

## 9. Quality Metrics

| Metric | How measured | Target (MVP) | Purpose |
|---|---|---|---|
| **CI pass rate** | GitHub Actions success/failure ratio | >95% of PR runs pass on first attempt | Catches broken builds and regressions |
| **Test count** | `pytest --collect-only`, `vitest --reporter=verbose` | No target — quality over quantity | Awareness of coverage depth |
| **Time to green** | CI job duration | <5 min for backend, <3 min for frontend | Fast feedback loop; slow CI = developers skip it |
| **Escaped bugs** | Bugs found in weekly integration check or by users | <3 per sprint at MVP | Effectiveness of lower-level testing |
| **Flaky test count** | GitHub Issues with `flaky-test` label | 0 unresolved at any time | Test suite reliability |

---

## 10. Defect Management

**Bug classification:**

| Severity | Definition | SLA |
|---|---|---|
| **S1 — Blocker** | Core feature broken for all users; data loss; security issue | Fix within 24 hours |
| **S2 — Critical** | Core feature broken for some users; workaround exists | Fix within current sprint |
| **S3 — Major** | Non-core feature broken; cosmetic issue with significant UX impact | Fix within next sprint |
| **S4 — Minor** | Cosmetic; low-frequency edge case; minor UX imperfection | Fix when convenient |

**Bug lifecycle:**
1. Discovered → GitHub Issue created with `bug` label + severity tag (`S1`/`S2`/`S3`/`S4`)
2. Triaged (within 24h) → assigned to owning team (doc 06 ownership map)
3. Fixed → PR opened referencing the issue
4. Verified → reviewer confirms fix; issue closed
5. For S1/S2: postmortem filed (doc 11 §12)

**Regression tracking:** Every bug fix PR must include a test that would have caught the bug — this prevents regression. If the bug can't be unit-tested (e.g., a visual glitch), document it in the PR description with a manual verification step.
