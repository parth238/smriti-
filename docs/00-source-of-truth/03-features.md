# 03 — Features (Full List, Tiered)

Tiering is mandatory reading before anyone builds anything. **Tier 1 = MVP (build for SIH demo). Tier 2 = Stretch (build if time remains after Tier 1 is solid). Tier 3 = Post-MVP roadmap (mention in pitch, do not build).**

## TIER 1 — MVP (must-have)

### Elderly App
- [ ] Simple login/profile (phone number or caregiver-assisted setup, large-text PIN)
- [ ] Language toggle: Assamese / English
- [ ] Home screen: Reality Orientation (day, date, time, "you are at home", next reminder)
- [ ] 4 cognitive games:
  - Memory Matching (memory) — uses family/cultural photos where available, generic icon fallback
  - Attention/Reaction (attention + processing speed)
  - Sequencing (executive function / daily-routine recall — e.g. "steps to make tea")
  - Picture Naming (language/recall, ties into reminiscence photos)
- [ ] Rule-based adaptive difficulty (staircase, per game type)
- [ ] Reminders: medicine, hydration, meals, appointments — large-text, dismissible, gentle repeat
- [ ] Reminiscence gallery: cultural pack (Bihu, Hornbill, local landmarks/food/songs) + caregiver-uploaded family photos with "Do you remember...?" prompts
- [ ] Offline-first: full functionality with no connectivity, background sync when restored
- [ ] Elderly-friendly UI: large buttons, high contrast, minimal nav depth (≤2 taps to anything)

### Caregiver Dashboard
- [ ] Auth + caregiver↔elderly account linking
- [ ] Session history (list of past game sessions)
- [ ] Analytics: 7-day/30-day accuracy trend, reaction-time trend, sessions/week, completion rate
- [ ] Reminder management (create/edit/delete)
- [ ] Reminiscence content management (upload photo + metadata: name, relationship, year, location)
- [ ] Missed-reminder alerts

### Backend / Platform
- [ ] Auth (JWT), role-based access (elderly vs caregiver)
- [ ] Game session logging API
- [ ] Reminders API
- [ ] Memory/reminiscence API
- [ ] Sync/batch API for offline queue
- [ ] Analytics computation (rolling stats, personal baseline)
- [ ] Secure storage of patient data (encryption at rest for PII, DPDP-aligned consent flow)

## TIER 2 — Stretch (build if Tier 1 is done early)

- [ ] Basic voice interaction demo (STT + TTS) using Web Speech API (English/Hindi) — "When is my medicine?" → spoken answer. Not Assamese. Not Bhashini. Flag: `VITE_ENABLE_VOICE_DEMO`.
- [ ] Simple arithmetic game + path/maze (visuospatial) game — expand from 4 to 6 games
- [ ] Caregiver push/email alerts (not just in-dashboard)
- [ ] Trend graphs with simple anomaly highlighting (e.g., "reaction time +18% vs baseline" banner)
- [ ] PWA install prompt + offline install demo for judges
- [ ] Second regional language pack (Manipuri/Meitei) as a proof-of-concept for content-pack architecture

## TIER 3 — Post-MVP / Roadmap Only (pitch it, don't build it)

*(Explicitly say these are out of scope in the demo — this is a credibility signal, not a weakness)*

- Reinforcement-learning / contextual-bandit personalization (Extension 1)
- Personalized content selection beyond difficulty (Extension 2)
- Full NER voice assistant (Assamese ASR/TTS via AI4Bharat/Bhashini, expanding to other languages) (Extension 3)
- Speech-based cognitive research (pause duration, speech rate, word-finding difficulty) (Extension 4)
- Clinician portal with exportable clinical reports (Extension 5)
- Clinical validation study with IRB + partner hospital (Extension 6)
- Geofencing / safe-return wandering alerts (Extension 7)
- Additional NER cultural content packs for all 8 states (Extension 8)
- Long-term decline-detection ML (XGBoost/time-series on labeled longitudinal + clinical data) — explicitly gated behind Track B+C data and clinical partnership
- Dedicated native mobile app builds (React Native/Capacitor wrapper) for app-store distribution
- Multi-region high-availability infrastructure, microservices, Kubernetes

## Feature-to-Requirement Traceability

| PS Requirement | Feature(s) delivering it |
|---|---|
| (a) games: memory/attention/routine/pattern | 4 core games |
| (b) AI adapts difficulty | Rule-based staircase engine (v1), roadmap to RL (v2+) |
| (c) multilingual + voice | Assamese/English toggle (MVP); voice/STT demo via Web Speech API EN/HI (stretch Tier 2); full NER voice via Bhashini/AI4Bharat (roadmap Tier 3) |
| (d) cultural themes/visuals/sounds/regional language | Reminiscence gallery + localized content packs |
| (e) reminders | Reminder module (medicine/hydration/activities/appointments) |
| (f) caregiver dashboards | Caregiver Dashboard + analytics |
| (g) offline functionality | Offline-first architecture (doc 01, 02) |
| (h) elderly-friendly mobile/tablet UI | Design system (doc 07) applied across all screens |
