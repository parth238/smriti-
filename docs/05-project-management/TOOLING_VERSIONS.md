# Smriti toolchain pin

Every team member uses these versions. Do not invent a second stack.

## Runtime

- Node.js: 20.x (see `.nvmrc`)
- npm: 10+
- Python: 3.11 (see `.python-version`)
- PostgreSQL: 16 (Docker image `postgres:16-alpine`)

## Local ports (doc 11)

- Elderly PWA: `http://localhost:5173`
- Caregiver dashboard: `http://localhost:5174`
- FastAPI: `http://localhost:8000`

## Environment names (doc 12)

- Elderly and dashboard API base: `VITE_API_URL` (not `VITE_API_BASE_URL`)
- Backend database: `DATABASE_URL`
- Backend JWT: `JWT_SECRET_KEY`

## Shared TypeScript contract

Import types from `packages/shared-types`. If an API field name changes, update that package and `docs/00-source-of-truth/05-api.md` in the same PR.

## Package manager

npm only. Commit `package-lock.json`. Do not mix pnpm or yarn.
