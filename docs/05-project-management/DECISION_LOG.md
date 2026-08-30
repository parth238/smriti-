# ARCHITECTURE DECISION LOG (ADR)

*Record all major architectural deviations, library selections, or scope changes here.*

| ID | Date | Decision | Reason | Owner | Affected Teams |
|---|---|---|---|---|---|
| ADR-001 | 2026-08-28 | Enforce Idempotency via `client_generated_id` | Crucial for preventing duplicate rows during unstable offline network sync retries. | Harshit / Ananya | Team 1, Team 3 |
| ADR-002 | 2026-08-28 | MVP Machine Learning ban | Team 2 is strictly constrained to a rule-based staircase algorithm to avoid scope creep and regulatory diagnostic risk. | Rehan | Team 2 |
| ADR-003 | 2026-08-30 | Covering does not transfer ownership | Anirudh P.S Yadav may land scaffolding in other folders so SIH has a demoable loop. Harshit still owns backend/infra. Parth still owns the dashboard. Rehan still owns staircase/analytics. Ananya still owns Dexie/SW. Srujna still owns tokens and culture. Owners review, extend, and do not rewrite the start without a team note. | Anirudh / all leads | All |
| ADR-004 | 2026-08-30 | Local Docker Postgres is the current database | `docker-compose.yml` Postgres 16 is what the branch runs. Hosted Supabase (`T0-INF-002`) is still Harshit's. Do not claim production DB is live. | Harshit | Team 1 |
| ADR-005 | 2026-08-30 | Voice/STT stays out of MVP | Doc 03 and doc 10: Web Speech API English/Hindi ("When is my medicine?") is Tier 2 stretch. Assamese ASR/TTS via Bhashini or AI4Bharat is Tier 3. `useVoice.ts` is specified and not implemented. KT (knowledge transfer) is a scheduled team process, not a product feature. | Rehan / Anirudh | All |
| ADR-006 | 2026-08-30 | Labeled demo fallback on the caregiver desk | If the API is down or no patient is linked, Overview/Analytics/Sessions may show sample data only when a notice says it is not live truth. Elderly PIN must not fake success on an unpaired device. | Parth / Anirudh | Team 1, Team 2 |
