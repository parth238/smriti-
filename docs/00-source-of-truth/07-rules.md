# 07 — Rules (Coding, Design, Content, Business)

## 1. Coding Standards

**General**
- TypeScript strict mode ON in both frontend apps. No `any` without a `// TODO justify` comment.
- Python: type hints mandatory in FastAPI route signatures and service functions. `black` + `ruff` for formatting/linting.
- All API responses match the Pydantic schema exactly — no ad-hoc dict returns.
- Every PR must pass CI (lint + tests) before merge — no exceptions, no "I'll fix it later."
- Commit style: `type(scope): message` — e.g. `feat(games): add memory-match staircase difficulty`, `fix(sync): dedupe on client_generated_id`.

**Frontend**
- Functional components + hooks only. No class components.
- One component = one file. Shared logic → custom hooks, not copy-paste.
- All user-facing strings go through the i18n layer (`en.json`/`as.json`) — **never hardcode English text in a component.** This is non-negotiable given the localization mission.
- Every screen must be tested in both light conditions with a phone-sized viewport (elderly users are on phones/tablets, not desktops) — desktop is a secondary target.

**Backend**
- Business logic lives in `services/`, not in route handlers. Routes stay thin: parse → call service → return.
- Database access only through SQLAlchemy models — no raw SQL except in migration scripts.
- Every mutating endpoint must be idempotent-safe or explicitly documented why not.

## 2. Design Rules (Elderly-Facing UI) — non-negotiable

1. **Font size minimum 18px body, 24px+ for primary actions.** Support OS-level text scaling.
2. **Touch targets ≥ 48x48px**, generous spacing between them (no accidental mis-taps).
3. **High contrast:** WCAG AA minimum (4.5:1 for text). No light-gray-on-white patterns.
4. **Max 2 taps to reach any core feature** from the home screen.
5. **No more than 4 primary choices visible on any single screen.**
6. **No jargon, no icons without text labels.** An icon-only button is a bug, not a feature, for this audience.
7. **Every action gets clear, immediate feedback** (visual + optional sound) — elderly users need confirmation that a tap registered.
8. **Never punish errors harshly.** Wrong answers in games get gentle correction, never a red "WRONG" buzzer — this is a wellbeing app, not a test.
9. **Consistent navigation position** — back/home button always in the same place, every screen.
10. Caregiver dashboard can use denser, more conventional UI patterns — it's a different audience (working-age, tech-comfortable).

## 3. Content Rules (Reminiscence & Localization)

- All cultural content must be sourced/verified with a real regional reference (community input, ARDSI Guwahati if partnered) — no generic AI-generated "Indian culture" stock imagery. Authenticity is the whole point of this feature.
- Every piece of shared cultural content needs a `source` field recorded internally (who provided it, for attribution/permission tracking).
- Family photo uploads require caregiver consent confirmation checkbox before upload completes.
- Never auto-caption or auto-tag a personal photo using AI without caregiver review — a wrong tag ("this is your husband") could genuinely distress a dementia patient.

## 4. Business / Product Rules (from doc 00 — repeated here because they must never be violated)

1. **Never present the app as a diagnostic tool.** No screen, alert, or copy may say or imply "you have dementia" or give a risk percentage.
2. **All performance comparisons are against the user's own personal baseline, never population norms or "normal" ranges.**
3. **Alerts to caregivers use plain, cautious language** — e.g. "Reaction time is higher than usual this week" not "Cognitive decline detected."
4. **Language/content scope for MVP is Assamese + English only.** Do not let scope creep add more languages before these two are done well.
5. **Games count stays at 4 for MVP.** Do not add a 5th game until all 4 are polished, localized, and tested with an actual elderly user if possible.
6. **Every feature must map to a PS requirement or an explicit MVP goal (doc 00 §7)** — if it doesn't, it goes to Tier 2/3 (doc 03), not into the sprint.

## 5. Data & Privacy Rules
- No PII in logs (no phone numbers, names in application logs — use user_id only).
- No third-party analytics/tracking SDKs on the elderly app.
- Caregiver-proxy consent must be recorded before any real (non-test) user data is stored — see doc 08.
- Media uploads scanned for basic validity (file type/size) before storage; no executable/script uploads accepted.

## 6. Git & Review Rules
- No direct pushes to `main`. All changes via PR with at least 1 reviewer approval (2 for `apps/backend/app/api` and anything touching auth).
- PR description must state which doc(s) it implements (e.g. "Implements 05-api.md §3 Games endpoints").
- If a PR changes behavior not reflected in these docs, the docs must be updated in the same PR.

---

## 7. Code Review Checklist

Every PR reviewer must check the following. Not every item applies to every PR — but the reviewer should *consider* each one and only skip items that are genuinely irrelevant, not items that are inconvenient.

### Architecture
- [ ] Does this change respect the layering rule? (business logic in `services/`, routes stay thin, no cross-module direct DB access)
- [ ] Is there a new dependency introduced? If yes, is it justified and does it meet license/security requirements?
- [ ] Does this change affect any API contract? If yes, is the API doc (05) updated in the same PR?
- [ ] Does this change introduce a new table/column? If yes, is the DB doc (04) updated and an Alembic migration included?

### Security
- [ ] No secrets, tokens, PINs, or PII in logs, error messages, or comments
- [ ] Auth/authorization checks present on every new endpoint (`verify_user_access` dependency used)
- [ ] Input validation via Pydantic schema (never raw request body access)
- [ ] No new `*` CORS origins, no new public S3/storage buckets

### Performance
- [ ] No N+1 queries (especially in list endpoints — use `joinedload` or explicit `IN` queries)
- [ ] No unbounded result sets (all list endpoints paginated or limited)
- [ ] For frontend: no unnecessary re-renders, no large images loaded without lazy loading

### Correctness
- [ ] Tests added or updated for the changed behavior
- [ ] Edge cases considered (empty inputs, null fields, offline scenarios for client code)
- [ ] For games: does the result screen follow doc 07 §2 (no harsh scoring) and doc 15 §2.5 (warm language)?

### Complexity
- [ ] Could this be simpler? (The "is this clever or is this clear?" test)
- [ ] Is this change scoped correctly, or does it bundle unrelated changes?

---

## 8. Technical Debt Process

**Classification:**

| Category | Definition | Example |
|---|---|---|
| **Deliberate-prudent** | Known shortcut taken with a clear plan to fix | "Using in-memory rate limiting instead of Redis — migrate at Tier 2" |
| **Deliberate-reckless** | Known shortcut taken without a plan | "Skipping tests because we're in a hurry" — **not acceptable** |
| **Accidental** | Discovered after the fact | A missed index causing slow queries |

**Tracking:** Technical debt is tracked as GitHub Issues with the `tech-debt` label. Each issue must include:
- What the debt is (specific, not vague)
- Why it was introduced (the decision context)
- What the fix looks like
- When it should be fixed (which growth tier or trigger)

**Remediation cadence:** Every 2 weeks (or after every major milestone), the team reviews the `tech-debt` issue list and decides which items to address in the next sprint. At minimum: every `deliberate-prudent` debt item must have a trigger condition that, when hit, forces remediation.

**Rule:** No PR may introduce `deliberate-reckless` debt. If a shortcut is needed under time pressure, it must be classified as `deliberate-prudent` with a documented trigger for fixing it — otherwise, find a simpler approach that doesn't require the shortcut.

---

## 9. Error Handling Standards

### Backend (Python / FastAPI)

**Exception hierarchy:**
```python
class SmritiError(Exception):
    """Base exception for all Smriti application errors."""
    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"

class ValidationError(SmritiError):
    status_code = 400
    error_code = "VALIDATION_ERROR"

class AuthenticationError(SmritiError):
    status_code = 401
    error_code = "AUTHENTICATION_ERROR"

class AuthorizationError(SmritiError):
    status_code = 403
    error_code = "AUTHORIZATION_ERROR"

class NotFoundError(SmritiError):
    status_code = 404
    error_code = "NOT_FOUND"

class ConflictError(SmritiError):
    status_code = 409
    error_code = "CONFLICT"

class RateLimitError(SmritiError):
    status_code = 429
    error_code = "RATE_LIMIT_EXCEEDED"
```

**Rules:**
- Every route handler uses a global exception handler that catches `SmritiError` subclasses and returns the standard error format (doc 05 §9).
- Unexpected exceptions (not `SmritiError`) are caught, logged with full stack trace + `request_id`, and returned as a generic 500 with no internal details exposed.
- **Retryable vs non-retryable:** `429` (rate limit) and `503` (service unavailable) are retryable with backoff. `400`, `401`, `403`, `404`, `409` are non-retryable — the client should not blindly retry these.

### Frontend (React / TypeScript)

- API errors mapped to user-friendly messages via an error-message dictionary (never show raw API error strings to the elderly user).
- Network errors (offline, timeout) caught and handled gracefully — optimistic UI + sync queue, not an error modal.
- Elderly app: error states use warm, reassuring language ("Something didn't work. Don't worry — try again." Never: "Error 500: Internal Server Error").
- React Error Boundaries around each major screen to prevent a crash in one game from taking down the entire app.

---

## 10. Dependency Management Policy

**Pinning:**
- Backend: `requirements.txt` with exact versions (`==`), not ranges. Update deliberately via a `chore/update-deps` PR.
- Frontend: `package-lock.json` committed. Do not run `npm update` without reviewing changelogs.

**Security updates:**
- GitHub Dependabot enabled (doc 08 §6).
- **Critical/High severity** vulnerabilities: patch within 48 hours. Create a `fix/security-*` branch, update the affected dependency, run full CI, merge with 2 approvals.
- **Medium severity:** patch within 1 week.
- **Low severity:** batch into the next regular dependency update cycle (bi-weekly).

**License compliance:**
- Only dependencies with MIT, Apache 2.0, BSD, or ISC licenses accepted without review.
- Any GPL, AGPL, or "source-available" license requires explicit team discussion and an ADR before adoption.
- Run a license audit (`pip-licenses` for Python, `license-checker` for npm) before the first pilot deployment. Document results.

**New dependency addition rule:** Adding a new dependency requires a brief justification in the PR description: what it does, why we need it (vs. building it ourselves or using an existing dep), and what its maintenance/community health looks like (last release date, number of maintainers, download count).
