# INTEGRATION CHECKLIST

Use this to track cross-team system integration points. Snapshot 2026-08-30. PARTIAL is not a pass.

| Task ID | Owner | Status | Checkpoint | Expected result | Actual result | Notes |
|---------|-------|--------|------------|-----------------|---------------|-------|
| INT-001 | Harshit + Anirudh | PARTIAL | CP-INT | Elderly login works | PIN login hits `/auth/user/login` when API is up | Unpaired offline does not fake success. No hosted URL yet. |
| INT-002 | Anirudh + Harshit | PARTIAL | CP-INT | Games write to DB | Dexie outbox → `POST /game-sessions` when online | Needs linked accounts. No seed script. |
| INT-003 | Ananya + Harshit | PARTIAL | CP-INT | Dexie sync resolves | Game sessions only. Idempotent `client_generated_id` | No `/sync/batch`. Reminders/memories not queued. |
| INT-004 | Rehan + Parth | PARTIAL | CP-INT | Analytics load | 7d / baseline / trend + dashboard live or labeled demo | Demo banner must stay if data is not live. |
| INT-005 | Parth + Harshit | NOT_STARTED | CP-INT | Reminder create → elderly sees it | No reminder routes | Blocks judge reminder story. |
| INT-006 | Parth + Harshit | NOT_STARTED | CP-INT | Memory upload → elderly gallery | No upload routes | Family photos remain empty by design. |
| INT-007 | All | NOT_STARTED | CP-INT | 10-minute judge path on linked accounts | Loop exists in code | Seed script + rehearsal still open. See NEXT_PLAN Phase 1. |
