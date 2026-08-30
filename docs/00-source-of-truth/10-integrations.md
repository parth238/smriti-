# 10 — Integrations

## 1. MVP Integrations (Tier 1 — actually wired up)

| Integration | Purpose | Notes |
|---|---|---|
| **Supabase (or Neon) — Postgres** | Primary database | Managed, saves DevOps time for hackathon timeline |
| **Supabase Storage (or Cloudflare R2)** | Media storage for photos/audio/video | S3-compatible; signed URLs for access control |
| **Vercel** | Hosting for elderly-app + caregiver-dashboard | Auto-deploy from GitHub, preview URLs per PR |
| **Render / Railway** | Hosting for FastAPI backend | Simple container deploy |
| **GitHub Actions** | CI/CD | Lint, test, deploy pipeline |

## 2. Stretch Integrations (Tier 2 — if time allows)

| Integration | Purpose | Notes |
|---|---|---|
| **Web Speech API** (browser-native STT/TTS) | Voice input/output demo | No external API key needed, works in Chrome/Edge; English/Hindi only realistically. Assamese ASR is Bhashini/AI4Bharat in section 3. |
| **Firebase Cloud Messaging / Web Push** | Caregiver push alerts | For missed-reminder or trend alerts beyond in-dashboard notices |

## 3. Roadmap Integrations (Tier 3 — documented, not built)

| Integration | Purpose | Notes |
|---|---|---|
| **AI4Bharat (IIT Madras) APIs** | ASR/TTS/translation for Assamese, Bodo, Manipuri | Open models; coverage expands — must be re-verified at integration time, not assumed from today's research |
| **Bhashini (Government of India)** | National language mission — Indic ASR/MT/TTS API access | Actively expanding NER language support; natural government-aligned partner given MDoNER is the problem-statement owner |
| **SMS Gateway** (e.g. MSG91, Twilio) | Reminder fallback for zero-data-connectivity scenarios | For hydration/medicine reminders when app can't sync at all |
| **DementiaBank / ADReSS / ADReSSo corpora** | Prototyping decline-detection ML pipeline (not deployable NER model) | Requires TalkBank access request; research-track only |
| **ARDSI Guwahati / regional medical college** | Content validation, clinical partnership, feasibility pilot | Not an API — a human/institutional partnership, critical for credibility |

## 4. Integration Principles

1. **No integration enters Tier 1 unless it has a free/low-cost tier that survives a hackathon budget and a judging-day demo.**
2. **Every external API call on the elderly app must have an offline-safe fallback** — e.g., voice demo gracefully degrades to text if Web Speech API is unavailable/offline.
3. **No integration should introduce a hard dependency that breaks core PS requirements (a, e, f, g, h) if it's down.** Games, reminders, and offline sync must never depend on a third-party service being up.
4. **Data-sharing integrations (Bhashini, AI4Bharat, any future clinical partner) require the same consent/privacy standards as doc 08** — no elderly-user data leaves our system without explicit purpose-bound consent.

## 5. Internal "Integration" — Content Pack Architecture

Not a third-party integration, but designed like one: the `packages/content-packs/` module (doc 06) is built so that adding a new state/language pack is a **data change, not a code change** — drop in a new folder with `strings.json` + `cultural-media.json`, register it in the language selector. This is what makes "Extension 8: more NER cultural packs" (doc 03) a realistic post-MVP task rather than a rewrite.

---

## 6. Anti-Corruption Layer Principle

**Governing rule:** Every external system sits behind an adapter/abstraction layer in Smriti's codebase. No external API's data model, error format, or authentication mechanism should leak into business logic.

**Implementation for MVP integrations:**

| External system | Adapter location | What the adapter does |
|---|---|---|
| Supabase Postgres | `apps/backend/app/db/session.py` + SQLAlchemy models | Isolates all DB access behind ORM; switching from Supabase to Neon requires changing only `DATABASE_URL`, not business logic |
| Supabase Storage / R2 | `apps/backend/app/services/storage_service.py` | Single `upload_file()` / `get_signed_url()` interface; swap S3-compatible providers by changing the client config, not the callers |
| Vercel / Render | CI/CD config files (`render.yaml`, Vercel project settings) | Application code has zero awareness of hosting provider; deploy config is isolated in config files |
| Web Speech API (stretch) | `apps/elderly-app/src/hooks/useVoice.ts` | Browser API wrapped in a hook that returns `{ speak, listen, isAvailable }`; gracefully degrades to text-only if API unavailable |

**For future integrations (Bhashini, AI4Bharat, SMS gateway):** Each gets its own `services/<integration>_client.py` file with a defined interface. Business logic calls the interface, never the raw API. This is what makes "swap a vendor" a 1-file change, not a codebase-wide refactor.

---

## 7. Vendor Swap Assessment

| Vendor | What it provides | Swap target | Swap difficulty | Estimated time |
|---|---|---|---|---|
| **Supabase** (Postgres) | Database + auth helpers + storage | **Neon** (Postgres) + separate object storage (R2) | Low — standard Postgres; change `DATABASE_URL` + storage client | 1-2 days |
| **Supabase Storage** | Media file hosting | **Cloudflare R2** or **AWS S3** | Low — S3-compatible API; change client config in `storage_service.py` | 0.5-1 day |
| **Vercel** (frontend hosting) | Static hosting + CDN | **Netlify** or **Cloudflare Pages** | Low — standard static site deployment | 1-2 hours per app |
| **Render** (backend hosting) | Container hosting | **Railway** or **Fly.io** | Low — Docker container; change deploy config | 2-4 hours |
| **GitHub Actions** (CI/CD) | Build + test + deploy automation | **GitLab CI** | Medium — rewrite workflow YAML (different syntax) | 1-2 days |
| **Web Speech API** (stretch) | Browser-native ASR/TTS | **Bhashini API** or **AI4Bharat** | Medium — different API shape, requires API key management, adds network dependency | 1-2 weeks |

**Conclusion:** All MVP-critical vendor dependencies are swappable within 1-2 days because we use standard protocols (Postgres, S3, Docker, static hosting) rather than vendor-proprietary features.

---

## 8. Single-Vendor Dependency Risks (named)

| Risk | Severity | Mitigation |
|---|---|---|
| **Supabase is the single vendor for DB + storage + (optionally) auth** | Medium | DB is standard Postgres (portable). Storage is S3-compatible (portable). Auth is self-implemented (JWT via FastAPI), not Supabase Auth — so the highest-lock-in Supabase feature isn't actually used as primary. |
| **Vercel for both frontend apps** | Low | Static hosting is commodity; any CDN can serve `dist/` output. PWAs already installed on devices continue working regardless of hosting. |
| **Render for the single backend instance** | Medium | Single point of failure for API. Mitigation: elderly app works offline; `docker compose` local fallback documented for demo day (doc 11 §8). |
| **GitHub for code + CI + collaboration** | Low | Code is distributed (every developer has a clone). CI could move to any platform. Risk is mainly around GitHub Actions lock-in (workflow YAML). |

**The honestly dangerous single dependency:** Supabase combining DB + storage. If Supabase has a catastrophic outage affecting both services simultaneously, the backend is fully down. This risk is accepted at MVP because (a) Supabase's uptime track record is strong, (b) the elderly app works offline, and (c) the blast radius is limited to sync + caregiver dashboard staleness, not user-facing functionality.

---

## 9. Per-Integration Failure Table

| Integration | Failure mode | Detection | Impact on elderly app | Impact on caregiver dashboard | Recovery |
|---|---|---|---|---|---|
| **Supabase Postgres** | Database unreachable | Backend `/health` check fails; UptimeRobot alerts | None (offline-first) | Shows cached data + "stale" indicator | Auto-reconnect on Supabase recovery; if prolonged, switch to Neon backup |
| **Supabase Storage** | Media upload/download fails | Upload returns 5xx; signed URL generation fails | Cached media still available; new items unavailable | Upload fails with retry prompt | Retry queue on dashboard; if prolonged, switch to R2 |
| **Vercel** | Frontend hosting down | Apps don't load for new visitors | Installed PWA unaffected (cached app shell) | Unaffected if already loaded; new sessions can't start | Redeploy to Netlify |
| **Render** | Backend container down | `/health` fails; API returns 502/503 | Full offline functionality continues; sync queues | All API-dependent views show stale data | Render auto-restart; if prolonged, deploy to Railway |
| **GitHub Actions** | CI/CD pipeline failure | PR checks fail or don't run | None (already deployed code unaffected) | None | Fix workflow config; manual deploy if urgent |
| **Web Speech API** (stretch) | Browser API unavailable (offline, unsupported browser) | `useVoice.isAvailable` returns false | Graceful degradation to text-only; no voice features shown | N/A | No action needed — degradation is by design |
