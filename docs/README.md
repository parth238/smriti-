# Smriti Documentation

## START HERE
- **AI Agent:** → `01-execution/AI_AGENT_BOOT_PROTOCOL.md` *(The definitive initialization protocol for AI assistants).*
- **Project Master:** → `01-execution/MASTER_EXECUTION.md` *(The complete operational playbook that ties docs to teams).*
- **Who does what next (2026-08-30):** → `05-project-management/NEXT_PLAN.md` and `05-project-management/TEAM_STATUS.md`.

## Source of Truth
*These documents define what is being built.*
- `00-source-of-truth/00-problem-statement-and-context.md`: The SIH26003 core problem statement and context.
- `00-source-of-truth/01-architecture.md`: High-level system architecture and component interactions.
- `00-source-of-truth/02-system-design.md`: Deep-dive technical system design for the PWA and API.
- `00-source-of-truth/03-features.md`: Strict definition of MVP (Tier 1) vs Stretch features.
- `00-source-of-truth/04-database.md`: Database schema, tables, and normalization strategy.
- `00-source-of-truth/05-api.md`: API route specifications, payloads, and idempotency logic.
- `00-source-of-truth/06-folder-structure.md`: The canonical monorepo directory layout.
- `00-source-of-truth/07-rules.md`: Hard rules governing codebase architecture and dependency boundaries.
- `00-source-of-truth/08-auth-security.md`: Authentication, RBAC, and data privacy protocols.
- `00-source-of-truth/09-workflows.md`: User flows and interaction lifecycle.
- `00-source-of-truth/10-integrations.md`: Third-party services and cultural pack integration details.
- `00-source-of-truth/11-deployment.md`: Hosting and infrastructure configuration.
- `00-source-of-truth/12-config.md`: Environment variables and application config definitions.
- `00-source-of-truth/13-sequence-diagrams.md`: State flow and transaction sequences.
- `00-source-of-truth/14-sitemap-navigation.md`: Route definitions for the apps.
- `00-source-of-truth/15-ui-ux-design.md`: Core design tokens and elderly accessibility requirements.
- `00-source-of-truth/16-team-workplan-and-git-workflow.md`: Original team execution and git strategy (superseded operationally by MASTER_EXECUTION).
- `00-source-of-truth/17-adrs.md`: Older architectural decision records.
- `00-source-of-truth/18-testing-strategy.md`: E2E, Unit, and Offline testing requirements.

## Team Execution
*These documents map architecture to team deliverables.*
- `02-teams/TEAM_1_CORE_PLATFORM.md`: Execution manual for Harshit and Anirudh.
- `02-teams/TEAM_2_INTELLIGENCE_DASHBOARD.md`: Execution manual for Parth and Mohd Rehan.
- `02-teams/TEAM_3_OFFLINE_CONTENT_DESIGN.md`: Execution manual for Srujna and Ananya.

## Individual Members
*Personalized workflows, prompts, and setups.*
- `03-members/harshit-divekar.md`: Setup for Backend & Database.
- `03-members/anirudh-ps-yadav.md`: Setup for Elderly UI Shell.
- `03-members/parth-shrivastav.md`: Setup for Caregiver Dashboard UI.
- `03-members/mohd-rehan.md`: Setup for AI/Analytics Engine.
- `03-members/srujna.md`: Setup for UI/UX Design System & Content.
- `03-members/ananya.md`: Setup for Offline Sync Engine.

## GitHub & Workflow
*Source control templates and policies.*
- `04-github-and-workflow/GITHUB_TEAM_WORKFLOW.md`: Git branching and merging guidelines.
- `04-github-and-workflow/PR_TEMPLATE.md`: Standard Pull Request template.
- `04-github-and-workflow/CONTRIBUTING.md`: Contributor rules.

## Project Management
*Living tracking documents. Snapshot 2026-08-30: Anirudh covered other folders for the SIH demo. Owners did not change.*
- `01-execution/DEVELOPMENT_CHECKLIST.md`: Master checklist of all MVP tasks (honest PARTIAL notes).
- `05-project-management/NEXT_PLAN.md`: Phase 0 to 3 plan, KT checklist, STT/voice placement.
- `05-project-management/TEAM_STATUS.md`: Who works on what next, plus what is actually landed.
- `05-project-management/DECISION_LOG.md`: Living ADR tracking recent architectural decisions.
- `05-project-management/INTEGRATION_CHECKLIST.md`: Cross-service testing list.
- `05-project-management/CHANGE_IMPACT.md`: Covering-land impact and blockers.

## Reference
*Supporting research (Do not treat as primary requirements).*
- `06-reference/AI-Based Cognitive Gaming & Memory Assistance Platform for Elderly Dementia Patients in the North Eastern Region (NER).pdf`: Foundational research document.
- `06-reference/cognitive_gaming_ner.pdf`: Additional domain research.
- `06-reference/Architecture-Bible-Reusable-Checklist (1).md`: Older generic architecture guidelines.

---

## DOCUMENT DEPENDENCY MAP
```
AI BOOT
↓
MASTER EXECUTION
↓
TEAM DOCUMENT
↓
MEMBER DOCUMENT
↓
SOURCE-OF-TRUTH DOCUMENTS
↓
TASK
↓
CHECKPOINT
↓
TEST
↓
PR
↓
INTEGRATION
```
