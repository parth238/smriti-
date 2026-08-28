# 08 — Auth & Security

## 1. Identity Model

Two distinct principal types, never conflated:
- **Caregiver** — standard email/phone + password account. Full-featured auth (can reset password, has email verification).
- **Elderly user** — simplified identity, **created by a caregiver**, not self-registered. Login is deliberately low-friction: phone number + 4-digit PIN, or a QR-code/session-token handed off by the caregiver on first device setup. This matches real usage — an elderly dementia patient will not manage a password.

## 2. Auth Flow

**Caregiver registration/login**
```
POST /auth/caregiver/register  {name, phone, email, password}
  → password hashed with argon2 (or bcrypt), stored
  → JWT access_token (15 min) + refresh_token (30 days) issued

POST /auth/caregiver/login {phone_or_email, password}
  → same token pair
```

**Elderly user setup (caregiver-mediated)**
```
Caregiver logged in → POST /auth/user/create {full_name, phone?, preferred_language, pin}
  → user record created, caregiver_user_link created (is_primary=true)
  → PIN stored hashed, never plaintext

Elderly device login → POST /auth/user/login {phone or device-linked user_id, pin}
  → JWT access_token issued (long-lived, e.g. 30 days, since re-entering
     a PIN repeatedly is a bad UX for this audience — device is treated as
     semi-trusted once paired by caregiver)
```

**Token refresh**
```
POST /auth/refresh {refresh_token} → new access_token
```
Refresh tokens stored server-side (hashed) so they can be revoked (e.g. caregiver removes a lost device).

## 3. Authorization / Access Control

Role-based, enforced server-side on every request (never trust client-side role claims alone):

| Role | Can do |
|---|---|
| `elderly_user` | Read/write own game sessions, read own reminders, acknowledge reminders, read own reminiscence content |
| `caregiver` | Full CRUD on reminders/memories for **linked** users only; read-only analytics for linked users; cannot read other caregivers' patients |
| (post-MVP) `clinician` | Read-only analytics + export, scoped to explicitly-consented patients |

Every endpoint that takes a `user_id` must verify: (a) if caller is `elderly_user`, `user_id` must equal their own id; (b) if caller is `caregiver`, a `caregiver_user_links` row must exist linking them to that `user_id`. This check lives in a single shared FastAPI dependency (`deps.py::verify_user_access`) — **never duplicated ad hoc per route**, to avoid drift/bugs.

## 4. Password & PIN Security
- Caregiver passwords: minimum 8 chars, hashed with argon2id.
- Elderly PIN: 4-digit, hashed the same way (not "just because it's short" — still hashed, still never logged).
- Rate limiting: 5 failed login attempts → 15-minute lockout, per account.
- No password/PIN ever appears in logs, error messages, or analytics events.

## 5. Data Protection

| Concern | Approach |
|---|---|
| Data in transit | HTTPS/TLS everywhere (Vercel + Render/Railway/Supabase provide this by default) |
| Data at rest | Managed Postgres encryption at rest (Supabase/Neon default); object storage encryption at rest |
| PII minimization | Only collect what's needed for the MVP feature set (no unnecessary demographic fields) |
| Photo/media access | Signed, time-limited URLs from object storage — never public buckets |
| Consent | `consent_given_by` (caregiver id) + `consent_timestamp` recorded on `users` table at creation — required before storing any real (non-test) elderly-user data, per DPDP Act 2023 proxy-consent norms for vulnerable individuals |
| Right to deletion | Caregiver can request full deletion of a linked elderly user's data via dashboard (soft-delete + scheduled hard purge) |

## 6. Application Security Practices
- Input validation via Pydantic schemas on every backend endpoint (reject malformed payloads before they touch business logic).
- SQL injection: non-issue by construction (SQLAlchemy ORM, no raw string interpolation into queries).
- CORS locked to known frontend origins (`app.smriti.in`, `caregiver.smriti.in`, local dev ports) — not `*`.
- File upload validation: whitelist MIME types (jpg/png/mp3/mp4), max size limits, virus/type-sniffing check before accepting into object storage.
- Secrets (DB URL, JWT signing key, storage keys) — never committed to repo; managed via `.env` locally and platform secret managers in prod (see doc 12).
- Dependency scanning: GitHub Dependabot enabled on the repo.

## 7. Threat Model Notes (specific to this user base)
- **Elderly users are a vulnerable population** — extra caution against any feature that could confuse, distress, or be exploited (e.g., no external links in the elderly app that could lead to phishing; no ability for a stranger to "friend" or message a patient).
- **Caregiver account takeover risk is high-impact** (controls reminders/medicine schedule for a vulnerable person) — caregiver accounts get standard email verification + optional 2FA (stretch goal) and login-attempt alerting.
- **Family disputes / unauthorized access:** the `caregiver_user_links` model supports multiple caregivers per user but every link requires the *existing* primary caregiver (or an admin-verified process) to approve — no self-service claiming of an elderly user's profile by an unverified party.

## 8. Session Handling on the Elderly Device
Because the device may be shared/handed off, and connectivity may be offline for long periods:
- Access token cached in IndexedDB (not localStorage, to align with the rest of the offline data layer) with a long expiry appropriate for a semi-trusted paired device.
- Caregiver can remotely "sign out this device" from the dashboard, which invalidates the refresh token and forces re-pairing.

---

## 9. Named Security Principles

| Principle | Concrete implementation in Smriti |
|---|---|
| **Least privilege** | Elderly users can only access their own data; caregivers only linked patients; every endpoint enforced via `verify_user_access` (§3). No admin role in MVP — no one has blanket access. |
| **Defense in depth** | Auth at API layer (JWT) + authorization at service layer (RBAC + link check) + encryption at storage layer (Supabase managed encryption) + input validation at schema layer (Pydantic). No single layer failing = full compromise. |
| **Zero trust (application-level)** | Every request is authenticated and authorized, even from "internal" dashboard routes. Client is never trusted for role claims — role comes from the server-side token payload, verified on every request. |
| **Fail secure** | If auth verification fails (token expired, malformed, missing), the default is deny (401/403), never a fallback to an unauthenticated state. If consent is not recorded, data is not stored. |
| **Privacy by design** | PII minimization (only fields needed for MVP); no third-party analytics on elderly app; caregiver-proxy consent required before data storage; right to deletion implemented (doc 04 §8). |

---

## 10. OWASP Top 10 Mapping (2021)

| # | OWASP Category | Smriti Mitigation | Status |
|---|---|---|---|
| A01 | Broken Access Control | `verify_user_access` shared dependency enforces caregiver↔patient link on every endpoint; append-only game sessions prevent tampering; RBAC on all routes | ✅ Implemented |
| A02 | Cryptographic Failures | Passwords/PINs hashed with argon2id; TLS in transit (Vercel/Render default); at-rest encryption via managed provider; JWTs signed with HS256 + strong secret | ✅ Implemented |
| A03 | Injection | SQLAlchemy ORM prevents SQL injection; Pydantic validates all input schemas; no raw string interpolation in queries | ✅ Implemented |
| A04 | Insecure Design | Threat model documented (§7, §11); caregiver-mediated onboarding prevents unauthorized elderly profile creation; no direct stranger→patient communication | ✅ Addressed |
| A05 | Security Misconfiguration | CORS restricted to known origins; `.env` files gitignored; Dependabot enabled; default deny on auth; no debug mode in prod | ✅ Implemented |
| A06 | Vulnerable Components | Dependabot scanning; dependency management policy (doc 07 §10); license compliance checks pre-pilot | ✅ Process in place |
| A07 | Authentication Failures | Rate limiting (5 attempts → 15min lockout); argon2id hashing; long-lived tokens only on paired devices with caregiver-revokable refresh tokens | ✅ Implemented |
| A08 | Software/Data Integrity | Alembic migrations version-controlled; CI required before merge; no unsigned/unverified third-party scripts loaded client-side | ✅ Implemented |
| A09 | Logging/Monitoring Failures | Structured logging with request_id (doc 02 §10); auth failures logged; Sentry for unhandled exceptions; PII never logged | ⚠️ Partial — basic monitoring, no SIEM |
| A10 | Server-Side Request Forgery | Not applicable — backend does not make user-controlled outbound requests in MVP | N/A |

---

## 11. Formal Threat Model (STRIDE)

| Threat | Asset | Attack scenario | Mitigation | Residual risk |
|---|---|---|---|---|
| **S — Spoofing** | Elderly user identity | Attacker obtains elderly user's phone + PIN and logs in | PIN is hashed (not guessable from DB); rate limiting prevents brute force; caregiver can revoke device session remotely | Low — 4-digit PIN is inherently weak, but the attack surface requires physical device access |
| **S — Spoofing** | Caregiver identity | Attacker compromises caregiver email/password | argon2id hashing; email verification; optional 2FA (stretch); login-attempt alerting | Medium — no MFA in MVP |
| **T — Tampering** | Game session data | Malicious client sends fabricated session data to inflate/deflate metrics | Sessions are append-only; `client_generated_id` prevents replays; server recomputes analytics from raw data. Motivation is low (no competitive/financial incentive to cheat). | Low |
| **R — Repudiation** | Reminder acknowledgment | User/caregiver disputes whether a reminder was acknowledged | `last_acknowledged_at` timestamp recorded; sync outbox provides local evidence; audit trail (doc 04 §9) | Low |
| **I — Information Disclosure** | Elderly user PII (name, phone, photos) | Database breach or exposed API | Encryption at rest; signed/time-limited media URLs; PII never in logs; RBAC prevents cross-patient data access | Medium — managed provider breach is outside our control |
| **I — Information Disclosure** | Cross-patient data leakage | Caregiver A queries Patient B's data (not linked) | `verify_user_access` checks link existence on every request; no "list all patients" endpoint for non-admin roles | Low |
| **D — Denial of Service** | Backend API | Volumetric attack or abuse of /sync/batch | Rate limiting on auth endpoints; Render/Railway basic DDoS protection; acceptable risk at pilot scale | Medium — no WAF at MVP |
| **E — Elevation of Privilege** | Elderly user gains caregiver access | Modify JWT claims client-side | JWT signature verification on every request; role embedded in signed token, not a client-side flag | Low |

---

## 12. Breach Notification Process

> **Note:** This process should be reviewed by a legal professional before any real user data is stored. The below is a reasonable engineering-level starting point, not legal advice.

**If a data breach affecting real user PII is suspected or confirmed:**

1. **Detect & contain (0-2 hours):** Identify the breach vector; revoke compromised credentials/tokens; if a database breach, rotate secrets and restrict access immediately.
2. **Assess scope (2-12 hours):** Determine which users' data was affected; which data types (PII, health-adjacent data, photos).
3. **Internal escalation (within 4 hours):** Notify all team leads (Harshit) + any institutional partner (ARDSI, state health dept).
4. **Regulatory notification (within 72 hours):** Under DPDP Act 2023, notify the Data Protection Board of India if personal data of Indian residents is affected.
5. **User/caregiver notification (within 72 hours):** Notify affected caregivers via email/SMS with: what happened, what data was affected, what steps we've taken, what they should do (e.g., change password).
6. **Post-incident review (within 2 weeks):** Blameless postmortem; root cause analysis; update security controls; file an ADR documenting the incident and changes.

---

## 13. Business Continuity Plan

| Scenario | Impact | Continuity action |
|---|---|---|
| **Backend hosting (Render/Railway) outage** | Caregiver dashboard stale; sync delayed | Elderly app unaffected (offline-first). Caregiver dashboard shows cached data + "stale" indicator. Redeploy to alternative provider (Railway ↔ Render) using the same Docker image. RTO: 2-4 hours. |
| **Supabase outage (Postgres + storage)** | Full backend read/write failure | Elderly app unaffected for core features. Backend returns 503. Switch to Neon (backup DB provider) using DB dump restore. RTO: 4-8 hours. RPO: last daily backup. |
| **GitHub outage** | No deploys, no CI, no code changes | All developers have local clones. Deploy from local using direct push to hosting provider. No code loss risk. RTO: immediate for existing deployments. |
| **Key team member unavailable** | Specialized knowledge loss | Pairing model (doc 16) ensures 2 people know every area. Docs are the backup — a new person should be able to follow doc 16's step-by-step for any task. |
| **Vercel outage (frontend hosting)** | Both web apps inaccessible for new users | Existing installed PWAs continue working offline. Redeploy to Netlify or Cloudflare Pages (static hosting is fungible). RTO: 1-2 hours. |

---

## 14. Vulnerability Management

| Severity | Patch SLA | Workflow |
|---|---|---|
| **Critical** (RCE, auth bypass, data exposure) | **24 hours** | Immediate `fix/security-*` branch; deploy hotfix; notify team; postmortem within 48h |
| **High** | **48 hours** | Same branch/review process; can wait for standard CI if safe |
| **Medium** | **1 week** | Standard PR process |
| **Low** | **Next sprint** | Batched with regular dependency updates |

**Scanning coverage:**
- Dependencies: Dependabot (GitHub-native, always-on)
- Container images: (Tier 2+) Trivy or Snyk scan in CI
- Secrets in code: (pre-commit hook) `detect-secrets` or `trufflehog` — run before first real commit with any environment variable
- SAST: (Tier 2+) CodeQL on PR via GitHub Actions

---

## 15. Access Governance

**Admin access:**
- At MVP, Harshit is the only person with direct database access (Supabase dashboard admin).
- No team member should access production data directly during normal operations — all access is via API with standard auth.
- Direct DB access is justified only for: incident investigation, data migration, backup verification.

**Break-glass procedure:**
1. Situation requiring direct production DB access arises (e.g., investigating a sync corruption).
2. Requesting developer messages the team channel with: what they need to access, why, and estimated duration.
3. Harshit grants temporary Supabase dashboard access (or runs the query himself).
4. Access revoked after the investigation is complete (same day).
5. All queries run during break-glass are documented in a post-incident note.

**Offboarding SLA:**
If a team member leaves (unlikely during SIH, but plan for it):
1. Remove GitHub collaborator access within 24 hours.
2. Rotate any secrets they had direct access to (JWT secret, Supabase keys) within 48 hours.
3. Revoke Supabase/Render/Vercel dashboard access within 24 hours.
4. Review and reassign their doc/code ownership (doc 06 ownership table).

---

## 16. Security Roadmap

| Phase | Security investments | Trigger |
|---|---|---|
| **MVP (now)** | JWT auth, argon2id hashing, RBAC, rate limiting, Pydantic validation, CORS locking, Dependabot, signed media URLs, caregiver-proxy consent, PII-free logging | Default |
| **Pilot (Tier 1)** | Email verification for caregivers, secrets-in-code scanning (pre-commit), backup restore test, breach notification process documented and reviewed | Before real user data is stored |
| **Tier 2** | Optional 2FA for caregivers (TOTP via authenticator app), RLS policies in Supabase as defense-in-depth, container image scanning in CI, CodeQL SAST | First paid contract or >500 users |
| **Tier 3** | SOC 2 Type I readiness assessment, formal penetration test by external party, WAF (Cloudflare), dedicated security logging (SIEM), regular access reviews | B2G contract requirement |
