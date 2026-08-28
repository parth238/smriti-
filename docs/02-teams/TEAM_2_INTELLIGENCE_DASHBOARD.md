# TEAM 2 — INTELLIGENCE & DASHBOARD EXECUTION MANUAL

## 1. TEAM MISSION
Build the Caregiver Dashboard and the backend analytics engines that process patient gameplay into actionable insights and adaptive difficulty tuning, without relying on Tier 2 ML.

## 2. MEMBERS
- Parth Shrivastav
- Mohd Rehan

## 3. ROLES
- **Parth:** Caregiver Dashboard Developer, Analytics Visualization.
- **Rehan:** AI & Analytics Engine Developer, Backend Data Processing.

## 4. OWNERSHIP
- **Caregiver Dashboard:** Team 2 (Parth)
- **Adaptive Difficulty Engine:** Team 2 (Rehan)
- **Analytics Engine:** Team 2 (Rehan)

## 5. FOLDER OWNERSHIP
- `apps/caregiver-dashboard/`
- `apps/backend/app/services/` (Specifically analytics and adaptive difficulty modules)

## 6. FILE OWNERSHIP
- `apps/backend/app/services/adaptive_difficulty.py`
- `apps/backend/app/services/analytics.py`

## 7. INFRASTRUCTURE OWNERSHIP
- **Dashboard Vercel Hosting:** Parth

## 8. DEPENDENCIES
- Team 2 depends on Team 1 for the database schema and Core API endpoints.
- Team 2 depends on Team 3 for Design Tokens.

## 9. SETUP REQUIREMENTS
- **Node.js (v20):** For the Dashboard.
- **Python (3.11):** For Analytics algorithms.

## 10. TASK ROADMAP
- Scaffold Caregiver Dashboard
- Build Adaptive Difficulty Engine
- Caregiver Dashboard Auth UI
- Analytics Engine (Pure Python)
- Analytics API Endpoints
- Dashboard Analytics UI
- Dashboard Reminder UI

## 11. TASK IDS
- `T2-FE-001`, `T2-AI-001`, `T2-FE-002`, `T2-AI-002`, `T2-AI-003`, `T2-FE-003`, `T2-FE-004`

## 12. IMPLEMENTATION ORDER
1. Adaptive Engine (T2-AI-001) - Can be done completely isolated.
2. Dashboard Scaffold (T2-FE-001)
3. Dashboard Auth (T2-FE-002)
4. Analytics Engine (T2-AI-002) & API (T2-AI-003)
5. Dashboard Charts (T2-FE-003)

## 13. CHECKPOINTS
Every task utilizes CP-01 through CP-18.

## 14. TESTING
- `pytest` for adaptive difficulty edge cases (e.g., maximum score, minimum score, fluctuating scores).
- Dashboard component testing with mocked API responses.

## 15. GIT WORKFLOW
- Ensure the pure Python services are tested independently of FastAPI routes before merging.

## 16. BRANCH WORKFLOW
```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b feature/<task-id>-<short-description>
```

## 17. PR WORKFLOW
- Parth reviews Rehan's APIs to ensure the JSON structure works well with Recharts.
- Rehan reviews Parth's UI to ensure no "diagnostic claims" are accidentally made in the dashboard text.

## 18. HANDOFFS
Rehan hands off the `get_next_difficulty()` Python import path to Harshit so Team 1 can plug it into their Game Session API.

## 19. BLOCKERS
If Team 1's database is not ready, Rehan must use mocked Python lists to test the analytics engine.

## 20. DEFINITION OF DONE
Dashboard correctly renders charts (Recharts) from API data. Adaptive difficulty correctly increments/decrements based on the 3-up/1-down rule.

## 21. AI PROMPTS
```text
NAME: [Parth/Rehan]
TEAM: TEAM 2
START MY WORK
```

## 22. FINAL TEAM CHECKLIST
- [ ] Caregiver Dashboard live on Vercel.
- [ ] Recharts properly displaying analytics.
- [ ] Adaptive difficulty strictly rule-based (no ML).
