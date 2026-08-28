# INDIVIDUAL EXECUTION MANUAL: SRUJNA

## 1 IDENTITY
**Name:** Srujna
**Team:** TEAM 3 (Offline, Content & Design System)
**Role:** UI/UX & Design System Owner
**Backup role:** Content & Localization Support

## 2 PROJECT CONTEXT
**What Smriti is:** An offline-first digital therapeutic and caregiver dashboard for elderly dementia patients in North-East India.
**MVP Scope:** 4 rule-based games, offline sync, reminders, and Assamese language support.
**Your responsibility:** You define the visual language of Smriti. You will translate the UI/UX rules into strict Tailwind configuration tokens, build the reusable React components ensuring 48px touch targets, and source authentic Assamese cultural content for the reminiscence features.

## 3 COMPUTER SETUP
**OS:** Windows/macOS/Linux.
**Git:** Install Git CLI.
**Node:** Install Node.js v20 LTS. `node --version` to verify.
**Package manager:** Install `npm` or `pnpm`.
**IDE:** Cursor or Antigravity.
**Failure Fix:** If Vite/Tailwind fails to compile styles, ensure PostCSS is correctly configured in your package root.

## 4 GITHUB SETUP
**GitHub account:** Required.
**Repository access:** Ensure write access to `https://github.com/Rehan-2024/smriti-`.
**Identity:**
```bash
git config --global user.name "Srujna"
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
# Setup UI Environment
cd packages/ui
npm install
npm run build
```

## 6 ENVIRONMENT VARIABLES
None required for your scope.

## 7 EXTERNAL SERVICES
**GitHub:** Required for CI/CD.

## 8 SUPABASE (DETAILED GUIDE)
**SUPABASE IS NOT MY RESPONSIBILITY.**
You do not manage, create, or administrate the database infrastructure.
You must NEVER modify the backend database schema. You provide styling tokens and localized strings that the frontend teams (Anirudh, Parth) will consume.

## 9 OWNED FOLDERS
`packages/ui/`
`packages/content-packs/`

## 10 RESTRICTED FOLDERS
`apps/backend/`

## 11 TASK ROADMAP
| TASK ID | TASK NAME | DEPENDENCY | STATUS |
|---------|-----------|------------|--------|
| T3-DS-001 | Configure Tailwind Design Tokens | T1-FE-001, T2-FE-001 | NOT_STARTED |
| T3-DS-002 | Content Packs & i18n Wiring | T1-FE-001 | NOT_STARTED |
| T3-DS-003 | Reminiscence Gallery UI | T3-DS-002 | NOT_STARTED |

## 12 BRANCH SETUP
```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b feature/T3-DS-001-design-tokens
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
**CSS isn't applying:** Ensure Vite cache is cleared and Tailwind directives are in the global CSS.
**Merge conflict:** Pull main into feature branch, resolve manually in IDE.
**Decision required:** Halt and ask team.

## 15 AI PROMPTS
```text
NAME: Srujna
TEAM: TEAM 3
START MY WORK
```

## 16 TESTING
Visual testing. You must manually inspect components in Chrome DevTools to verify element dimensions >= 48px and WCAG AA contrast.

## 17 COMMIT
`feat(ui): add 48px primary button component`

## 18 PR
Title: `feat: Tailwind Design Tokens (T3-DS-001)`
Reviewer: Ananya

## 19 HANDOFF
Notify Teams 1 and 2 the moment `tailwind.config.ts` is merged to `main` so they can stop using hardcoded hex colors.

## 20 RECOVERY
Accidental commit to main? `git reset --hard HEAD~1`, checkout branch, cherry-pick.

## 21 DEFINITION OF DONE
Tailwind config includes `gamosa-red` and `tea-garden`. Buttons are 48px minimum. No hardcoded English text in components.

## 22 FIRST TASK
**T3-DS-001:** Configure Tailwind Design Tokens (Once Anirudh/Parth scaffold the Vite apps).
