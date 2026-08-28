# ARCHITECTURE DECISION LOG (ADR)

*Record all major architectural deviations, library selections, or scope changes here.*

| ID | Date | Decision | Reason | Owner | Affected Teams |
|---|---|---|---|---|---|
| ADR-001 | 2026-08-28 | Enforce Idempotency via `client_generated_id` | Crucial for preventing duplicate rows during unstable offline network sync retries. | Harshit / Ananya | Team 1, Team 3 |
| ADR-002 | 2026-08-28 | MVP Machine Learning ban | Team 2 is strictly constrained to a rule-based staircase algorithm to avoid scope creep and regulatory diagnostic risk. | Rehan | Team 2 |
