# TEAM 3 — OFFLINE, CONTENT & DESIGN SYSTEM EXECUTION MANUAL

## 1. TEAM MISSION
Ensure the Elderly App functions flawlessly without internet access (Offline-First), curate the Assamese cultural reminiscence content, and establish the universal UI/UX design tokens for accessibility.

## 2. MEMBERS
- Srujna
- Ananya

## 3. ROLES
- **Srujna:** UI/UX & Design System Owner, Content & Localization.
- **Ananya:** Offline Sync & Resilience Engineer, Local Database.

## 4. OWNERSHIP
- **Offline Architecture (Dexie/Workbox):** Team 3 (Ananya)
- **Tailwind Design System:** Team 3 (Srujna)
- **Cultural Packs (i18n):** Team 3 (Srujna)

## 5. FOLDER OWNERSHIP
- `apps/elderly-app/src/db/`
- `apps/elderly-app/public/`
- `packages/ui/`
- `packages/content-packs/`

## 6. FILE OWNERSHIP
- `tailwind.config.ts`
- `sw.js` (Service Worker)

## 7. INFRASTRUCTURE OWNERSHIP
- No primary cloud infrastructure owned. Local browser storage (IndexedDB) is the primary concern.

## 8. DEPENDENCIES
- Team 3 depends on Team 1 for the FastAPI Sync `/sync/batch` endpoint.
- Team 1 & 2 depend on Team 3 for Design Tokens.

## 9. SETUP REQUIREMENTS
- **Node.js (v20):** For configuring Vite plugins and Dexie schemas.

## 10. TASK ROADMAP
- Configure Tailwind Design Tokens
- Initialize Dexie & IndexedDB Schema
- Content Packs & i18n Wiring
- Dexie Schema & Optimistic Writes
- Sync Batch API & Idempotency
- Background Sync & Service Worker
- Reminiscence Gallery UI

## 11. TASK IDS
- `T3-DS-001`, `T3-OS-001`, `T3-DS-002`, `T3-OS-002`, `T3-OS-003`, `T3-OS-004`, `T3-DS-003`

## 12. IMPLEMENTATION ORDER
1. Design Tokens (T3-DS-001) - HIGHEST PRIORITY to unblock other teams.
2. Dexie Schema (T3-OS-001)
3. i18n Strings (T3-DS-002)
4. Optimistic Writes (T3-OS-002)
5. Service Worker (T3-OS-004)

## 13. CHECKPOINTS
Every task utilizes CP-01 through CP-18.

## 14. TESTING
- Physical validation in Chrome DevTools (Application Tab -> Service Workers -> Offline Mode).
- Verify 48px touch targets visually.

## 15. GIT WORKFLOW
- Ensure Tailwind token changes are communicated instantly in the team chat.

## 16. BRANCH WORKFLOW
```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b feature/<task-id>-<short-description>
```

## 17. PR WORKFLOW
- Ananya reviews Srujna's UI components for structural integrity.
- Srujna reviews Ananya's Offline Sync UI indicators.

## 18. HANDOFFS
- Srujna provides `tailwind.config.ts` to T1/T2.
- Ananya provides the Dexie Database singleton to Anirudh to use in the Game components.

## 19. BLOCKERS
If Team 1 backend sync API is down, Ananya must test against a local Express mock server.

## 20. DEFINITION OF DONE
App loads when network is disabled. Clicks register to IndexedDB. Network restore fires a successful sync event. All buttons are >= 48px. Assamese toggle works.

## 21. AI PROMPTS
```text
NAME: [Srujna/Ananya]
TEAM: TEAM 3
START MY WORK
```

## 22. FINAL TEAM CHECKLIST
- [ ] Tailwind tokens active globally.
- [ ] App operates fully offline.
- [ ] No duplicate data upon reconnect (Idempotency verified).
