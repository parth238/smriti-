# SMRITI DEVELOPMENT CHECKLIST

Tracking document for all Smriti MVP tasks.

## Repository & Infrastructure
- [ ] `T0-INF-001` Scaffold monorepo structure (Owner: Harshit)
- [ ] `T0-INF-002` Initialize Supabase project (Owner: Harshit)
- [ ] `T0-INF-003` Configure CI/CD linting/tests (Owner: Harshit)

## Backend (Team 1)
- [ ] `T1-BE-001` Initialize FastAPI application (Owner: Harshit)
- [ ] `T1-BE-002` Setup Alembic and DB Models (Owner: Harshit)
- [ ] `T1-BE-003` Implement JWT Authentication (Owner: Harshit)
- [ ] `T1-BE-004` Implement Role-Based Access Control (Owner: Harshit)
- [ ] `T1-BE-005` Setup Game Session API Endpoints (Owner: Harshit)
- [ ] `T1-BE-006` Integrate Sync Batch logic (Owner: Harshit/Ananya)

## Elderly App Shell (Team 1)
- [ ] `T1-FE-001` Scaffold Vite PWA App (Owner: Anirudh)
- [ ] `T1-FE-002` Implement Caregiver Profile Setup Flow (Owner: Anirudh)
- [ ] `T1-FE-003` Implement Elderly User PIN Login (Owner: Anirudh)
- [ ] `T1-FE-004` Build Game Hub Navigation (Owner: Anirudh)
- [ ] `T1-FE-005` Implement Attention Game MVP (Owner: Anirudh)

## Intelligence & Analytics (Team 2)
- [ ] `T2-AI-001` Build Adaptive Difficulty Engine (Owner: Rehan)
- [ ] `T2-AI-002` Build Analytics Engine & Baseline Logic (Owner: Rehan)
- [ ] `T2-AI-003` Implement Analytics API Endpoints (Owner: Rehan)

## Caregiver Dashboard (Team 2)
- [ ] `T2-FE-001` Scaffold Caregiver Dashboard Vite App (Owner: Parth)
- [ ] `T2-FE-002` Implement Caregiver Login (Owner: Parth)
- [ ] `T2-FE-003` Build Patient Overview Screen (Owner: Parth)
- [ ] `T2-FE-004` Implement Analytics Charts (Recharts) (Owner: Parth)
- [ ] `T2-FE-005` Build Reminder & Memory Management UI (Owner: Parth)
- [ ] `T2-FE-006` Implement Alerts UI Feed (Owner: Parth)

## Offline Sync & Persistence (Team 3)
- [ ] `T3-OS-001` Initialize Dexie & IndexedDB Schema (Owner: Ananya)
- [ ] `T3-OS-002` Implement Optimistic Game Writes & Outbox (Owner: Ananya)
- [ ] `T3-OS-003` Setup Workbox & Service Worker (Owner: Ananya)
- [ ] `T3-OS-004` Implement Background Sync Engine (Owner: Ananya)
- [ ] `T3-OS-005` Configure i18n Localization Foundation (Owner: Ananya)

## Design System & Content (Team 3)
- [ ] `T3-DS-001` Configure Tailwind Design Tokens (Owner: Srujna)
- [ ] `T3-DS-002` Build Accessible UI Components (Owner: Srujna)
- [ ] `T3-DS-003` Create Assamese Cultural Content Pack (Owner: Srujna)
- [ ] `T3-DS-004` Apply i18n Strings to all UI Views (Owner: Srujna)

## Integration Checkpoints
- [ ] `I-001` Repository builds
- [ ] `I-002` Backend connects to Supabase
- [ ] `I-003` Elderly App authenticates via API
- [ ] `I-004` Dashboard authenticates via API
- [ ] `I-005` Offline game writes to Dexie
- [ ] `I-006` Offline outbox syncs to Backend
- [ ] `I-007` Analytics Engine processes synced sessions
- [ ] `I-008` Dashboard displays accurate synced data
- [ ] `I-009` Assamese localization switch works
- [ ] `I-010` Full SIH MVP Demo runs successfully
