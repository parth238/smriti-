# 12 — Configuration

## 1. Environment Variables — Backend (`apps/backend/.env`)

```
# App
ENV=development                 # development | staging | production
APP_NAME=Smriti API
API_V1_PREFIX=/api/v1
DEBUG=true

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/smriti_dev

# Auth
JWT_SECRET_KEY=<generate-a-strong-random-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
ELDERLY_ACCESS_TOKEN_EXPIRE_DAYS=30
REFRESH_TOKEN_EXPIRE_DAYS=30

# Object storage
STORAGE_PROVIDER=supabase        # supabase | r2
STORAGE_BUCKET=smriti-media
STORAGE_ACCESS_KEY=<...>
STORAGE_SECRET_KEY=<...>
STORAGE_PUBLIC_URL_BASE=<...>

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,https://app.smriti.in,https://caregiver.smriti.in

# Rate limiting
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_MINUTES=15

# (Post-MVP / stretch — not required for MVP boot)
BHASHINI_API_KEY=
SMS_GATEWAY_API_KEY=
```

## 2. Environment Variables — Elderly App (`apps/elderly-app/.env`)

```
VITE_API_URL=http://localhost:8000/api/v1
VITE_DEFAULT_LANGUAGE=as
VITE_ENABLE_VOICE_DEMO=false     # feature flag, Tier 2
VITE_APP_NAME=Smriti
VITE_SENTRY_DSN=                 # optional, leave blank for MVP
```

## 3. Environment Variables — Caregiver Dashboard (`apps/caregiver-dashboard/.env`)

```
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=Smriti Caregiver
```

## 4. Feature Flags (kept simple — env-driven, not a full flag service for MVP)

| Flag | Default | Purpose |
|---|---|---|
| `VITE_ENABLE_VOICE_DEMO` | `false` | Toggle Web Speech API demo on/off per environment |
| `VITE_ENABLE_SECOND_LANGUAGE` | `false` | Toggle Manipuri/Meitei pack visibility (Tier 2 stretch) |
| `ENABLE_SMS_FALLBACK` (backend) | `false` | Gate SMS reminder fallback until integrated |

## 5. Adaptive Difficulty Config (tunable constants — `services/adaptive_difficulty.py`)

```python
STRONG_ACCURACY_THRESHOLD = 80    # % — 3 consecutive rounds at/above this → level up
POOR_ACCURACY_THRESHOLD = 50      # % — 2 consecutive rounds at/below this → level down
ROUNDS_TO_LEVEL_UP = 3
ROUNDS_TO_LEVEL_DOWN = 2
MIN_DIFFICULTY = 1
MAX_DIFFICULTY = 5
```
These are intentionally exposed as named constants, not magic numbers, so the team can tune them after a few real playtest sessions without touching logic.

## 6. Analytics Config

```python
BASELINE_WINDOW_DAYS = 14         # first 2 weeks of usage defines personal baseline
ROLLING_WINDOWS = [7, 30]         # days, for trend computation
DEVIATION_ALERT_THRESHOLD_PCT = 15  # flag to caregiver if metric shifts >15% vs baseline
```

## 7. Config Loading Pattern (backend)

`apps/backend/app/core/config.py` uses Pydantic `BaseSettings` to load and validate all env vars at startup — the app should **fail fast** on boot if a required variable is missing, rather than failing mysteriously later mid-request. Example shape:

```python
class Settings(BaseSettings):
    env: str = "development"
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    allowed_origins: List[str]
    # ...

    class Config:
        env_file = ".env"

settings = Settings()
```

## 8. Secrets Management by Environment

| Environment | Where secrets live |
|---|---|
| Local | `.env` file (gitignored, never committed — `.env.example` has placeholder keys only) |
| Staging/Production (Vercel) | Vercel Project → Environment Variables dashboard |
| Staging/Production (Render/Railway) | Platform's built-in secret/environment variable manager |

`.env` and `.env.local` are in `.gitignore` from day one — verify this before the first commit, not after a secret leaks.
