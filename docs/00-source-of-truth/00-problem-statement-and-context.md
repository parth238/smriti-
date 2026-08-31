# 00 — Problem Statement & Project Context

**Project codename:** Smriti (স্মৃতি / स्मृति — "memory")
**SIH 2026 Problem Statement ID:** SIH26003
**Organization / Department:** Ministry of Development of North Eastern Region (MDoNER)
**Category:** Software | **Theme:** MedTech / BioTech / HealthTech
**Team size:** 6

## Team

| # | Name | Primary Role |
|---|---|---|
| 1 | Harshit Divekar | Team Lead + Backend (FastAPI, DB, API design) |
| 2 | Anirudh P.S Yadav | Frontend — Elderly App (React, games, offline UX) |
| 3 | Parth Shrivastav | Frontend — Caregiver Dashboard (React, analytics UI) |
| 4 | Mohd Rehan | AI/ML — Adaptive difficulty engine, analytics, future RL |
| 5 | Srujna | UI/UX Design — elderly-friendly design system, reminiscence content, accessibility |
| 6 | Ananya | Backend/DevOps + Localization & Content — offline sync, reminders, regional content pipeline |

Roles overlap in practice (6-person team on a 12+ doc system) — this table sets *primary ownership*, not exclusivity. Everyone reviews everyone's PRs.

---

## 1. Official Problem Statement (verbatim intent, summarized)

**Background:** NER has a rising elderly population with age-related cognitive decline (dementia, memory loss). Rural/remote families lack access to neurological care and cognitive therapy due to poor healthcare infrastructure and geography. Elderly patients face memory decline, confusion, anxiety, social isolation; caregivers struggle with continuous monitoring. No affordable, culturally inclusive digital therapeutic solution exists for NER specifically.

**Required solution must:**
- (a) Provide interactive cognitive games/activities: memory improvement, attention/concentration, daily routine recall, pattern & object recognition, emotional/mental engagement
- (b) Use AI/ML to adapt difficulty based on patient performance and cognitive condition
- (c) Support multilingual and voice-assisted interaction for elderly NER users
- (d) Include culturally familiar themes, visuals, sounds, and regional language support
- (e) Provide reminders: medicines, hydration, daily activities, medical appointments
- (f) Enable caregivers/healthcare workers to monitor progress via dashboards and activity levels
- (g) Work in low-connectivity environments with offline functionality
- (h) Be accessible via mobile/tablet with a simple, elderly-friendly interface

**Expected deliverables:** Adaptive gaming/memory modules, voice-enabled multilingual interface, cognitive performance tracking/analytics dashboard, caregiver monitoring + alerts, offline sync, secure patient data management, elderly-friendly UI/UX.

This document (00) is the permanent source of truth for *why* every decision in docs 01–14 was made. If a feature doesn't trace back to a line in this section or the evidence in Section 3, it doesn't belong in MVP.

---

## 2. Reframed Problem (in our own words)

Three overlapping gaps, one platform:

- **Clinical/cognitive gap** — elderly NER residents with dementia/MCI have no affordable, localized way to stay cognitively engaged; specialists are scarce in hill/border districts.
- **Caregiver burden gap** — families (often split by out-migration) have no way to remotely monitor an elderly relative's cognitive engagement, reminders, or wellbeing.
- **Infrastructure/access gap** — patchy connectivity, 200+ languages/dialects, low digital literacy, and zero culturally relevant content in existing apps.

## 3. Evidence Base (cite this in every pitch — do not skip)

- **LASI-DAD (Lee et al., *Alzheimer's & Dementia*, 2023):** dementia prevalence in Indians 60+ = **7.4%** (~8.8 million people), projected to nearly double to **16.9 million by 2036**.
- Prevalence range: **4.5% (Delhi) to 11.0% (Jammu & Kashmir)**. Higher among women (~2x men), rural populations, low/no formal education — gradients that apply heavily to rural NER.
- **Critical gap:** of the whole North-East, only **Assam** was included in LASI-DAD's detailed assessment; **Sikkim has no state-level estimate at all**. This absence of data is itself part of our justification.
- **ACTIVE trial:** cognitive speed training reduces dementia risk when used *before* onset — supports an early-intervention/prevention framing.
- **Constant Therapy 24-week home RCT:** ~80% adherence, measurable gains in visual/auditory memory, attention, arithmetic in mild dementia/AD patients.
- **What evidence does NOT support:** reversing dementia, preventing MCI→dementia progression, or diagnosis from gameplay data alone. **We never claim any of this.**
- **Local asset:** ARDSI (Alzheimer's & Related Disorders Society of India) has a Guwahati chapter — potential validation/content partner.

## 4. Competitive Landscape

| Product | Strength | Why it doesn't solve SIH26003 |
|---|---|---|
| Constant Therapy | Most clinically validated | English-only, ~$300/yr, no offline-first, no NER content |
| BrainHQ (Posit Science) | ACTIVE-trial lineage, speed training | Consumer brain-training, no dementia/caregiver focus, no localization |
| Lumosity / CogniFit | Mass market, polished | Weak clinical grounding, zero India/NER relevance |
| DemClinic (India) | Telemedicine screening, ARDSI-backed | Diagnostic/clinical focus, not a daily engagement app, no NER language |
| DemLink App (India) | Caregiver education | Informational only, no gaming, no adaptive AI |
| Moving Pictures (NIMHANS) | Caregiver education media | English/Hindi/Kannada only — NER untouched |

**The gap we fill:** No platform combines NER-language localization + NER cultural reminiscence content + offline-first architecture + adaptive gaming + caregiver monitoring. That intersection is our moat.

## 5. Scope Discipline — What Smriti IS and IS NOT

**IS:** A cognitive engagement, daily memory-assistance, culturally-familiar reminiscence, and caregiver-monitoring platform. Immediate purpose only.

**IS NOT:** A dementia diagnostic tool, a cure, a clinical risk-scoring system. Advanced AI (decline detection, full RL, NER voice) comes later, once real usage data exists.

**Honest AI roadmap (never skip a stage when asked "so is this AI?"):**
```
V1  Rule-based adaptive difficulty (no ML needed)
V2  Telemetry-informed personalization (light ML on our own usage data)
V3  Statistically meaningful deviation detection vs personal baseline
V4  Clinical study — compare vs validated assessments (MMSE/MoCA), with IRB + partner
V5  Only if evidence supports it — clinical decision-support research
```

## 6. Users

| User | Interface | Core needs |
|---|---|---|
| Elderly patient | Mobile-first web app (**PWA**, not React Native — see doc 01 §6) | Simple games, reminders, familiar faces/places, reassurance, zero learning curve |
| Caregiver (family/community health worker) | Web dashboard | Remote visibility, control over reminders/content, trend alerts, low effort |
| Clinician (post-MVP) | Extended dashboard view | Longitudinal charts, exportable reports — **not in MVP** |

## 7. MVP Definition (the actual hackathon build target)

- Login/profile (elderly + caregiver linked accounts)
- Assamese + English interface
- 4 cognitive games: memory matching, attention/reaction, sequencing, picture naming
- Rule-based adaptive difficulty (staircase algorithm)
- Reminders (medicine/hydration/meals/appointments) + Reality Orientation screen
- Reminiscence gallery (cultural pack + caregiver-uploaded family photos)
- Offline-first storage + background sync
- Caregiver dashboard: session history, accuracy/reaction-time trends, reminder management, photo upload
- Secure auth, basic RBAC (elderly vs caregiver roles)

Everything else (voice assistant, RL, decline-detection ML, geofencing, clinician portal, 10+ languages) is **Post-MVP / Extension** — tracked in doc 03 (Features) as clearly separated tiers.

---

## 8. Mission & Vision

**Mission:** Enable elderly residents of North-East India experiencing cognitive decline to maintain daily engagement, dignity, and connection to their cultural identity — through accessible, offline-capable, caregiver-supported cognitive activities, delivered in their own language.

**Vision:** Within 5 years, Smriti becomes the reference platform for culturally-grounded cognitive wellness across India's linguistically diverse regions — generating the longitudinal behavioral data that enables legitimate clinical research partnerships, while remaining a daily-use companion that families actually want to open every morning.

---

## 9. Audience-Specific Pitches

**Elevator pitch (30 sec):**
> Smriti is an offline-first cognitive gaming and memory companion for elderly dementia patients in North-East India. It combines adaptive brain games, culturally familiar reminiscence content, and caregiver monitoring — in the user's own language, even without internet.

**Investor pitch:**
> India has 8.8M dementia patients today, doubling to 16.9M by 2036. North-East India is the most underserved region — zero existing apps support its 200+ languages or cultural context. Smriti fills this gap with an offline-first PWA that combines cognitive games, reminiscence therapy, and caregiver dashboards. Our moat is localization depth that's expensive to replicate, not a single clever feature. We start with MDoNER/SIH as our beachhead, expand regionally with content packs, and monetize through B2G (state health departments), B2B (elder-care facilities), and eventually B2C freemium.

**Customer pitch (to a caregiver):**
> Your mother plays simple, familiar games every day — matching photos of her family, arranging steps to make tea. The app reminds her to take medicine, drink water, and keeps her connected to her favorite Bihu memories. You can check how she's doing from anywhere, see if she played today, and get a gentle alert if something seems off. It works even when the internet doesn't.

**Engineer pitch:**
> A React/Vite PWA (elderly app) + React dashboard + FastAPI backend, backed by Postgres and IndexedDB for offline-first. Offline sync via Service Worker + outbox pattern. Rule-based adaptive difficulty engine designed to be swapped for a contextual bandit once we have telemetry. No ML in v1 — honest, explainable, auditable. TypeScript strict mode, Pydantic schemas, append-only telemetry tables, idempotent sync.

---

## 10. SWOT Analysis

| | Helpful | Harmful |
|---|---|---|
| **Internal** | **Strengths:** Deep understanding of NER cultural context; offline-first architecture as core design, not afterthought; honest AI positioning (rule-based v1, ML only when data justifies); SIH/MDoNER alignment gives credibility + distribution | **Weaknesses:** Small 6-person team with no clinical background; no real elderly user data yet (cold-start for personalization); no existing brand/trust in healthcare tech; Assamese-only at MVP limits reach |
| **External** | **Opportunities:** Zero competitors in NER-localized cognitive wellness; government push for NER digital health (MDoNER budget); ARDSI Guwahati as potential validation partner; growing awareness of dementia burden in India; AI4Bharat/Bhashini expanding NER language ASR | **Threats:** Well-funded global players (BrainHQ, Constant Therapy) could add India localization; regulatory uncertainty around health-adjacent apps under DPDP Act; elderly adoption may be slower than projected; caregiver engagement drop-off after initial setup |

---

## 11. Root Cause Analysis (Fishbone / 5 Whys)

**Problem:** Elderly NER residents with cognitive decline have no affordable, culturally relevant, daily-use digital cognitive engagement tool.

### 5 Whys — Why doesn't this tool exist yet?

1. **Why no tool?** → Existing cognitive training apps are Western/English-only and subscription-priced.
2. **Why not localized?** → NER has 200+ languages, making localization expensive relative to addressable market size for commercial companies.
3. **Why hasn't a government/nonprofit built it?** → India's dementia research infrastructure is concentrated in South India (NIMHANS, ARDSI Bangalore); NER is data-absent (only Assam in LASI-DAD).
4. **Why is NER data-absent?** → Neurological/geriatric specialists are scarce in hill/border districts; no systematic cognitive screening programs exist.
5. **Why so few specialists?** → Geographic access barriers (terrain, infrastructure), migration of trained professionals to urban centers, and low awareness of dementia vs. "normal aging."

**Root cause cluster:** The absence of tools is a symptom of a compounding gap — no data → no research → no awareness → no funding → no tools → no data. Smriti enters at the "tools" layer and, as a byproduct, generates the "data" layer that could eventually close the loop.

---

## 12. Detailed Personas

### Persona 1: Elderly User — "Bormaa" (Grandmother)

| Attribute | Detail |
|---|---|
| **Name** | Malati Devi |
| **Age** | 72 |
| **Location** | Jorhat, Assam (semi-urban, patchy 3G/4G) |
| **Language** | Assamese (primary), basic Hindi, no English |
| **Cognitive status** | Mild cognitive impairment — forgets recent conversations, loses track of medication schedule, still recognizes family and performs basic daily activities independently |
| **Digital literacy** | Has a smartphone (gifted by son), can answer calls, open WhatsApp (with son's help initially), cannot type or install apps |
| **Living situation** | Lives with daughter-in-law; son works in Guwahati (3 hrs away), visits monthly |
| **Daily life** | Morning tea ritual, watches TV, sits in courtyard, occasional temple visits, increasingly isolated as mobility decreases |
| **Pain points** | Misses medicine doses 2-3 times/week; daughter-in-law reminds but is also managing household/children; feels "useless" and bored; son worries from Guwahati but has no visibility |
| **What success looks like** | Plays a familiar matching game with family photos for 15 min/day, gets gentle medicine reminders, son can see she's active from dashboard |
| **Frustration triggers** | Confusing menus, small text, English-only interfaces, feeling tested/judged ("I'm not stupid"), anything that feels like a medical exam |

### Persona 2: Caregiver — "Remote Son"

| Attribute | Detail |
|---|---|
| **Name** | Ratul Devi |
| **Age** | 38 |
| **Location** | Guwahati, Assam (good connectivity) |
| **Relationship** | Son of Malati, primary financial provider, visits monthly |
| **Digital literacy** | High — uses work apps, banking apps, WhatsApp daily |
| **Pain points** | Guilt about not being present; sister-in-law (co-caregiver) can't articulate how his mother is doing day-to-day; no way to know if she took her medicine except by calling; feels helpless when mother's confusion seems to be getting worse but can't quantify it |
| **What success looks like** | Opens the dashboard once every few days, sees "5 game sessions this week, accuracy stable, no missed reminders" — peace of mind in 30 seconds. Gets an alert only when something meaningfully changes. |
| **Frustration triggers** | Alarm-style "COGNITIVE DECLINE DETECTED" alerts (would cause panic, not action); having to teach his mother complex app navigation over the phone |

### Persona 3: Caregiver — "Community Health Worker" (post-MVP, but shapes design)

| Attribute | Detail |
|---|---|
| **Name** | Priya Sonowal |
| **Age** | 28 |
| **Location** | Dibrugarh district, Assam (rural, inconsistent connectivity) |
| **Role** | ASHA worker managing 15-20 elderly patients across 3 villages |
| **Pain points** | Paper-based records; no cognitive screening tools; no way to flag patients who may need specialist referral; spends hours traveling between villages |
| **What success looks like (future)** | Links multiple elderly users to her dashboard; does a quick weekly check on engagement trends; flags anyone whose baseline has shifted for PHC doctor review |

---

## 13. Jobs-To-Be-Done

| User | Job | Outcome metric |
|---|---|---|
| **Elderly user** | *When I feel bored and idle at home*, I want *something familiar and enjoyable to do* so that *I feel engaged, useful, and connected to my memories*. | Sessions per week, session completion rate |
| **Elderly user** | *When it's time for my medicine*, I want *a gentle, clear reminder* so that *I don't miss doses and don't feel dependent on family nagging me*. | Reminder acknowledgment rate |
| **Caregiver (remote)** | *When I'm away from my parent*, I want *a quick summary of how they're doing* so that *I have peace of mind without needing to call daily*. | Dashboard visit frequency, time-on-dashboard (should be SHORT — quick scan = good design) |
| **Caregiver (local)** | *When my elderly relative's behavior seems to be changing*, I want *a factual trend I can show a doctor* so that *the conversation is data-informed, not just "I feel like they're worse"*. | Analytics export utilization (post-MVP) |

---

## 14. Quantified Pain Points

| Pain point | Quantification | Source |
|---|---|---|
| Dementia prevalence in 60+ Indians | 7.4% (~8.8M people), projected 16.9M by 2036 | LASI-DAD (Lee et al., 2023) |
| NER data gap | 7 of 8 NER states have zero state-level dementia prevalence data | LASI-DAD coverage map |
| Specialist scarcity | ~1 neurologist per 1M population in most NER states (national avg ~1 per 300K) | Indian Academy of Neurology, 2020 estimates |
| Caregiver burden hours | Primary caregivers of dementia patients spend an average of 6-8 hrs/day on care activities | Alzheimer's & Related Disorders Society of India survey data |
| Medication non-adherence | ~50% of elderly patients miss prescribed doses without assisted reminders | WHO adherence report extrapolated to Indian elderly |
| Digital literacy (NER elderly) | <15% of 60+ population in NER use smartphones independently | NSSO/NFHS-5 extrapolation |
| Connectivity gap | ~40% of NER districts have inconsistent or no 4G coverage | TRAI/DoT coverage maps, 2024 |

---

## 15. Three/Five/Ten-Year Vision & Moat Assessment

### Vision Timeline

| Timeframe | State |
|---|---|
| **Year 1** | MVP live, Assamese + English, pilot with 50-200 elderly users in Assam via ARDSI Guwahati or state health dept. Rule-based adaptive difficulty. First longitudinal behavioral dataset being accumulated. |
| **Year 3** | 5+ NER languages supported via content-pack architecture. Clinician portal live. First clinical validation study (IRB-approved, partner hospital) comparing Smriti engagement data with MMSE/MoCA scores. Contextual-bandit personalization (v2 AI) deployed where data supports it. 2,000-10,000 active users. B2G contracts with 2-3 NER state health departments. |
| **Year 5** | Platform expanded beyond NER to other underserved Indian regions (tribal areas, rural Hindi belt). Speech biomarker research track producing first publications. Longitudinal dataset large enough to train meaningful decline-detection models. Platform used as infrastructure by third-party researchers. 50,000+ active users. |
| **Year 10** | India's reference platform for culturally-grounded cognitive wellness. Multi-language, multi-script. API-first model allowing third parties (hospitals, NGOs, research institutions) to build on top. Clinical evidence base comparable to Western peers (Constant Therapy, BrainHQ) but for Indian populations. |

### Moat Assessment (honest)

| Moat layer | Defensibility | Honesty check |
|---|---|---|
| **NER cultural content** | Medium-high — requires genuine regional knowledge, community relationships, and painstaking per-state content work. Expensive and unglamorous to replicate. | Could be replicated given enough funding + local hires. Not a permanent moat, but a 2-3 year head start. |
| **Longitudinal behavioral dataset** | High — accumulates over time. First-mover advantage is real (whoever collects the data first can train the best models first). | Only valuable if we retain users. Dataset is worthless if churn kills accumulation. |
| **Offline-first architecture** | Low — technically replicable by any competent team. | This is a table-stakes feature, not a moat. But it's a barrier-to-entry that deters lazy competitors. |
| **Institutional relationships (ARDSI, state health depts, MDoNER)** | Medium — government/institutional trust takes time to build. | Fragile — depends on individuals, political cycles, and continued engagement. |
| **Brand trust with caregivers** | Medium — healthcare-adjacent trust is hard-won, easy to lose. | Requires sustained investment in evidence-honesty positioning. One "AI detects dementia!" marketing slip destroys this. |

---

## 16. Business Model (projection, not committed)

**Phase 1 — SIH/Pilot (Year 0-1):** No revenue. Government funding via SIH prize + potential MDoNER follow-on grant. Free to all users. Goal: prove engagement + retention, build dataset.

**Phase 2 — B2G Contracts (Year 1-3):**
| Revenue stream | Model | Assumptions |
|---|---|---|
| State health department licensing | Annual license per district deployment (₹5-10L/district/year) | 5-10 districts in Year 2, scaling to 20+ by Year 3 |
| ARDSI/NGO partnership | Subsidized deployment fee + content co-creation revenue | 1-2 partnerships in Year 2 |

**Phase 3 — B2B + B2C (Year 3-5):**
| Revenue stream | Model | Assumptions |
|---|---|---|
| Elder-care facility licensing | Per-facility annual license (₹2-5L/facility/year) | 10-50 facilities by Year 4 |
| B2C freemium | Free basic tier (2 games, reminders); premium tier (all games, full analytics, family photo uploads, ₹99-199/month) | 5-10% conversion on free user base |
| Research data licensing | Anonymized, aggregated behavioral data sold to pharmaceutical/research partners | Only after dataset is large enough + ethics board approval |

**CAC assumptions:** Near-zero for B2G (government distribution). B2C CAC estimated ₹200-500 via caregiver word-of-mouth + ASHA worker referrals (not digital ads — the elderly user isn't the acquirer).

**Retention assumption:** 60-70% monthly retention target for elderly users (based on Constant Therapy's ~80% in a structured trial; real-world will be lower). Key lever: caregiver re-engagement prompts.

---

## 17. Go-to-Market Plan

**ICP (Ideal Customer Profile):** State health departments in NER (B2G primary); elder-care NGOs (B2B secondary); families with 60+ members showing early cognitive decline (B2C tertiary, post-pilot).

**Pilot strategy:**
1. **SIH demo → MDoNER relationship** — the hackathon is the acquisition event. Goal: win or place high enough to get MDoNER's attention for a follow-on pilot.
2. **ARDSI Guwahati partnership** — approach the Guwahati chapter as a content validation + pilot distribution partner. They provide access to caregivers + patients; we provide the tool for free during the pilot.
3. **One district, one state** — resist the urge to go multi-state before proving retention in a single district. Jorhat or Kamrup (metro Guwahati) as first pilot district.

**Distribution channels:**
| Channel | Role | Timeline |
|---|---|---|
| MDoNER / state health dept | Primary distribution for B2G | Year 1-2 |
| ARDSI chapters | Content validation + caregiver access | Year 1+ |
| ASHA / community health workers | On-the-ground onboarding + device setup | Year 1+ (they're the "last mile") |
| Word of mouth (caregiver networks) | Organic B2C growth | Year 2+ |

**Sales motion:** No traditional sales for Year 1. The product IS the pitch — the SIH demo + a successful pilot report is the sales collateral for the next state contract.

---

## 18. Risk Register

| # | Risk | Category | Likelihood | Impact | Treatment | Owner |
|---|---|---|---|---|---|---|
| R1 | Elderly users don't engage beyond initial novelty (retention <40% after 3 months) | Product | High | Critical | Design for caregiver re-engagement prompts; vary content weekly; track engagement rigorously from pilot day 1 | Product (Harshit) |
| R2 | Assamese content quality is poor/inauthentic — alienates rather than engages | Content | Medium | High | Partner with ARDSI Guwahati for content validation; community review before launch; Srujna sources real regional references | Content (Srujna, Ananya) |
| R3 | DPDP Act 2023 compliance gaps discovered post-launch (consent, data residency) | Regulatory | Medium | High | Pre-launch legal review of consent flows; data stays in India (Mumbai region); proxy consent mechanism documented in doc 08 | Legal/Backend (Harshit) |
| R4 | Key team member becomes unavailable (bus factor = 1 for some areas) | Team | Medium | High | Pairing model (doc 16) reduces but doesn't eliminate; ensure docs are genuinely sufficient for handoff | All (Harshit, leads) |
| R5 | Offline sync introduces subtle data-corruption bugs | Technical | Medium | Medium | Append-only game sessions (structurally conflict-free); idempotent sync; extensive testing at checkpoint 3D | Backend (Ananya, Harshit) |
| R6 | AI overclaiming — team member or marketing material implies diagnosis capability | Reputation | Low | Critical | Doc 07 §4 business rules are non-negotiable; every screen/copy reviewed against them before launch; rule repeated in pitch training | All (Harshit, enforcer) |
| R7 | PWA performance on low-end Android devices in NER is poor | Technical | Medium | High | Test on actual low-end devices (₹5-8K phones); aggressive asset optimization; set performance budgets (doc 02 §6) | Frontend (Anirudh) |
| R8 | Supabase free tier limitations hit during pilot scaling | Infrastructure | Medium | Medium | Monitor usage; have Neon as backup; migration path documented | DevOps (Ananya) |
| R9 | No clinical validation partner agrees to collaborate | Business | Medium | Medium | Approach ARDSI, regional medical colleges (Gauhati Medical College); SIH credibility helps; if no partner, position as "wellness tool" not "clinical tool" | Partnerships (Harshit) |
| R10 | Competitor (global or Indian) launches NER-localized cognitive app | Market | Low | Medium | Accelerate content depth; institutional partnerships are the real barrier to fast-follow competitors | Product (Harshit) |

---

## 19. Success Metrics

**North Star Metric:** **Weekly Active Elderly Users (WAEU)** — the number of elderly users who complete at least one game session per week. This single metric captures engagement, retention, and product-market fit. Everything else supports it.

**Supporting KPIs:**

| KPI | Target (Pilot) | Why it matters |
|---|---|---|
| Sessions per user per week | ≥ 3 | Engagement depth — are they coming back, not just once? |
| Session completion rate | ≥ 80% | Are games the right length/difficulty, or are users quitting mid-game? |
| Reminder acknowledgment rate | ≥ 70% | Is the reminder system actually useful, or is it ignored/annoying? |
| Caregiver dashboard visit rate | ≥ 1x/week per linked caregiver | Are caregivers engaged, or did they set it up and forget? |
| Offline sessions as % of total | Track, no target | Understanding connectivity reality — if this is >50%, offline-first was the right call |
| Accuracy trend stability | No >20% negative drift without clinical context | Safety metric — are we causing distress or disengagement? |
| Content freshness (new items/month) | ≥ 2 new cultural items/month | Content staleness is the #1 retention killer for this category |

---

## 20. Glossary of Domain-Specific Terms

| Term | Definition | Usage context |
|---|---|---|
| **ARDSI** | Alzheimer's & Related Disorders Society of India — national NGO with regional chapters including Guwahati | Partnership, content validation |
| **ASHA** | Accredited Social Health Activist — community health worker in India's public health system | Distribution, onboarding |
| **Bihu** | Major Assamese festival (three variants: Rongali/Bohag, Magh, Kati) — deeply embedded in cultural identity | Reminiscence content |
| **Bhashini** | Government of India's national language technology mission — provides Indic ASR/TTS/MT APIs | Roadmap integration (Tier 3) |
| **Caregiver-proxy consent** | Consent given by a legally recognized caregiver on behalf of a cognitively vulnerable individual, per DPDP Act 2023 | Auth, data protection |
| **Cognitive domain** | A category of mental function (memory, attention, executive function, language, visuospatial) | Game design, analytics |
| **Contextual bandit** | An ML algorithm that learns to select the best action (e.g., which game/difficulty) based on user context — planned for v2+ | AI roadmap |
| **DPDP Act 2023** | Digital Personal Data Protection Act, 2023 — India's primary data privacy law | Compliance |
| **Gamosa** | Traditional Assamese woven cloth with red/white pattern — used as Smriti's signature visual motif | Design system |
| **Hornbill Festival** | Major cultural festival of Nagaland — represents NER cultural diversity | Reminiscence content |
| **IndexedDB** | Browser-native structured storage API — used via Dexie.js for offline data | Technical architecture |
| **LASI-DAD** | Longitudinal Ageing Study in India - Diagnostic Assessment of Dementia — largest Indian dementia prevalence study | Evidence base |
| **MCI** | Mild Cognitive Impairment — a stage between normal aging and dementia | Clinical context (never diagnosed by Smriti) |
| **MDoNER** | Ministry of Development of North Eastern Region — the government body sponsoring this problem statement | SIH context |
| **MMSE** | Mini-Mental State Examination — a standard cognitive screening tool | Clinical reference (not implemented in Smriti) |
| **MoCA** | Montreal Cognitive Assessment — another standard cognitive screening tool | Clinical reference (not implemented) |
| **NER** | North Eastern Region of India — 8 states: Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura | Geography |
| **Personal baseline** | An individual user's own historical average performance (first 2 weeks) — Smriti only compares against this, never population norms | Analytics design, business rule |
| **PWA** | Progressive Web App — a web application that can be installed on a device and work offline | Technical architecture |
| **Reality Orientation** | A therapeutic technique showing the patient current date, time, location, and upcoming events — evidence-based, cheap to implement | Home screen design |
| **Reminiscence therapy** | Using personally meaningful memories (photos, music, cultural items) to stimulate engagement and emotional wellbeing in dementia patients | Core feature |
| **Staircase algorithm** | A psychophysical method for adjusting difficulty: step up after consecutive successes, step down after consecutive failures | Adaptive difficulty (v1) |
| **Sync outbox** | A local queue of data changes made while offline, processed in order when connectivity returns | Offline-first architecture |
| **Workbox** | Google's library for adding offline support to web apps via Service Workers | Technical implementation |

---

## 21. Closing Verdict — Honest Self-Critique

**Where we disagree with our own assumptions, or where confidence is lowest:**

1. **"Elderly users will actually play daily."** We assume 3+ sessions/week. But every study showing good adherence (e.g., Constant Therapy's ~80%) involved structured clinical contexts (therapist oversight, scheduled sessions). A home-based, unsupervised context in rural NER with low digital literacy may yield far lower engagement. **This is the single biggest unknown.** Mitigation: caregiver re-engagement, but we don't know if that's sufficient.

2. **"Caregivers will stay engaged with the dashboard."** Dashboard fatigue is real. After the novelty period (2-4 weeks), caregivers may stop checking. If they stop checking, the alert system is useless. We have no evidence for sustained caregiver engagement in this specific population. **Risk level: high.**

3. **"Content packs are sufficient cultural localization."** We assume that a curated set of Bihu/Hornbill photos + regional music constitutes meaningful cultural resonance. But NER is not monolithic — what resonates in Jorhat may mean nothing in Kohima. Sub-regional content variation may be needed far earlier than we've planned. **Risk level: medium.**

4. **"Rule-based difficulty is good enough for v1."** Probably true for the first few months. But the staircase algorithm is stateless across game types (it doesn't know your attention game performance when adjusting your memory game). If users play multiple games, the experience may feel disconnected. **Risk level: low (acceptable for MVP).**

5. **"The app doesn't need a clinician from day one."** We've explicitly deferred the clinician portal. But if a pilot partner (ARDSI, medical college) says "we'll only participate if our doctors can see the data," we may need to accelerate this. **Risk level: medium.**

6. **"Offline-first is the right architectural bet."** Connectivity in NER is improving. By the time Smriti has 10,000 users, 4G/5G coverage may have caught up. We may be over-engineering for a problem that's shrinking. But the alternative — building online-first and retrofitting offline — is architecturally far more painful. **We believe the bet is correct, but acknowledge it may age poorly.**

7. **"MDoNER/SIH is the right beachhead."** Government partnerships are slow, bureaucratic, and subject to political cycles. If MDoNER's attention shifts after SIH, we lose our primary distribution channel and need a Plan B (direct-to-caregiver B2C, NGO partnerships). **No Plan B is documented yet.** This is a real gap.
