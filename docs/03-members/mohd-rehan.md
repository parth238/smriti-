# INDIVIDUAL EXECUTION MANUAL: MOHD REHAN

## 1 IDENTITY
**Name:** Mohd Rehan
**Team:** TEAM 2 (Intelligence & Dashboard)
**Role:** AI & Analytics Engine Developer
**Backup role:** Backend Data Processing

## 2 PROJECT CONTEXT
**What Smriti is:** An offline-first digital therapeutic and caregiver dashboard for elderly dementia patients in North-East India.
**MVP Scope:** 4 rule-based games, offline sync, reminders, and Assamese language support.
**Your responsibility:** You are responsible for the "brains" of the MVP. Since ML is banned in Tier 1, you will write the rule-based Staircase algorithm for Adaptive Difficulty, calculate the 7/30 day rolling analytics windows using Pandas/Python, and expose these insights safely via APIs.

## 3 COMPUTER SETUP
**OS:** Windows/macOS/Linux.
**Git:** Install Git CLI.
**Python:** Install Python 3.11+. `python --version` to verify.
**Package manager:** Install `uv`. `curl -LsSf https://astral.sh/uv/install.sh | sh`.
**IDE:** Cursor or Antigravity.
**Failure Fix:** If Pandas fails to install, ensure your Python environment is activated correctly via `uv`.

## 4 GITHUB SETUP
**GitHub account:** Required.
**Repository access:** Ensure write access to `https://github.com/Rehan-2024/smriti-`.
**Identity:**
```bash
git config --global user.name "Mohd Rehan"
git config --global user.email "[YOUR_EMAIL]"
```
**Auth:** `gh auth login`
**Clone:** `git clone https://github.com/Rehan-2024/smriti-`

## 5 REPOSITORY SETUP
```bash
cd smriti-
git remote -v
git fetch
git checkout main
# Setup Python Environment
cd apps/backend
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
pytest tests/
```

## 6 ENVIRONMENT VARIABLES
You share Harshit's `.env` for the backend.
**DATABASE_URL:** Connection string for local Postgres testing. (SECRET). Owner: Harshit.

## 7 EXTERNAL SERVICES
**GitHub:** Required for CI/CD.

## 8 SUPABASE (DETAILED GUIDE)
**SUPABASE IS NOT MY RESPONSIBILITY.**
You do not manage, create, or administrate the database infrastructure.
You require the local `DATABASE_URL` from Harshit to run your analytics logic against the local Postgres instance during development. You must NEVER modify the backend database schema using Alembic; request changes from Harshit if your analytics engine needs a new column.

## 9 OWNED FOLDERS
`apps/backend/app/services/` (Analytics specific files)

## 10 RESTRICTED FOLDERS
`apps/elderly-app/`
`apps/caregiver-dashboard/`

## 11 TASK ROADMAP
As of 2026-08-30. Anirudh covered a rule-based start so games and the dashboard could close the loop. You own the files. Do not jump to RL. ADR-002 still holds.

| TASK ID | TASK NAME | DEPENDENCY | STATUS |
|---------|-----------|------------|--------|
| T2-AI-001 | Build Adaptive Difficulty Engine | None | DONE (`adaptive_difficulty.py` + exhaustive tests complete) |
| T2-AI-002 | Analytics Engine (Pure Python) | T1-BE-002 | DONE (all metrics mapped and tested against personal baseline) |
| T2-AI-003 | Analytics API Endpoints | T2-AI-002 | DONE (routes stable with game_type filters and full json contract) |

## 12 BRANCH SETUP
```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b feature/T2-AI-001-adaptive-difficulty
git branch --show-current
git status
```

## 13 CHECKPOINTS
- CP-01 Environment verified
- CP-03 Repository inspected
- CP-06 Implementation complete
- CP-07 Tests added
- CP-08 Tests passing
- CP-12 Git diff reviewed
- CP-15 PR created
- CP-18 Merged

## 14 FAILURE HANDLING
**Tests fail:** Verify you are running `pytest` in the correct directory (`apps/backend`). Check your mock list inputs.
**Merge conflict:** Pull main into feature branch, resolve manually in IDE.
**Decision required:** Halt and ask team.

## 15 AI PROMPTS
```text
NAME: Mohd Rehan
TEAM: TEAM 2
START MY WORK
```

## 16 TESTING
`pytest apps/backend/tests/` (Write exhaustive unit tests for `get_next_difficulty` passing in mock lists of historical game accuracies).

## 17 COMMIT
`feat(ai): implement rule-based staircase difficulty`

## 18 PR
Title: `feat: Adaptive Difficulty Engine (T2-AI-001)`
Reviewer: Parth Shrivastav

## 19 HANDOFF
Once `get_next_difficulty` is tested, hand off the function import path to Harshit so he can plug it into his `POST /game-sessions` endpoint.

## 20 RECOVERY
Accidental commit to main? `git reset --hard HEAD~1`, checkout branch, cherry-pick.

## 21 DEFINITION OF DONE
Adaptive difficulty increments by 1 on 3 successes, drops by 1 on 2 failures. Baseline accurately averages the first 14 days. No ML libraries imported.

## 22 FIRST TASK
**Now:** Own `apps/backend/app/services/adaptive_difficulty.py` and `analytics_engine.py`. Add tests. Baseline on more session fields if they already exist. Review Parth's dashboard copy so nothing reads as a diagnosis. No ML libraries. Schedule KT-AI with Anirudh.
