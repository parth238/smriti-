# 15 — UI/UX Design Doc

This is Srujna's primary reference, and the visual contract everyone else (Anirudh, Parth) builds against. It covers two **distinct** design systems — the Elderly App and the Caregiver Dashboard — because they serve two different audiences and should not look like the same product wearing two skins.

---

## 1. Design Thesis

Smriti is not a clinical tool and not a toy. The visual language should feel like **a warm, unhurried companion rooted in NER's own textures** — not a generic "healthcare app" (clinical blues/whites) and not a generic "brain training" app (busy, gamified, primary colors). The signature visual idea:

> **The gamosa line.** The Assamese *gamosa* — a handwoven white cloth with a red woven border pattern, used in daily life and every festival/greeting — is the recurring structural motif. A woven red-on-white border pattern (simplified into a geometric CSS/SVG motif) appears as a quiet accent: on card edges, section dividers, the loading state, the app header. It's used with restraint — once per screen, never as wallpaper — so it reads as intentional, not decorative clutter. This ties the product visually to the region it's for, without relying on generic "ethnic pattern" stock assets.

This is deliberately **not**: cream background + terracotta accent + serif display (the generic AI-design default), not a dark clinical dashboard, not primary-color gamified-app cheerfulness that reads as childish to an elderly user (a real risk in this category — avoid anything that feels like it's designed for children).

---

## 2. Elderly App — Design System

### 2.1 Color Palette (named, with hex — 6 colors max)

| Name | Hex | Use |
|---|---|---|
| **Rice White** | `#FBF9F4` | Primary background — warm off-white, not sterile clinical white, easy on aging eyes |
| **Deep Hill** | `#1E2A2F` | Primary text — near-black with a slight blue-green cast, not pure `#000` |
| **Gamosa Red** | `#A8342A` | Primary accent — CTAs, active states, the woven-border motif. A muted brick-red, not a bright alarm red (avoid anything that reads as "error" or "danger" for a dementia-focused app) |
| **Tea Garden** | `#4B6E58` | Secondary accent — success/positive states, "completed" markers, calm confirmations |
| **Mist Blue** | `#7C93A3` | Tertiary — inactive states, secondary text, borders |
| **Marigold** | `#E0A542` | Highlight — used sparingly for "new" badges, the current reminder, gentle emphasis (never for errors) |

**Contrast rule:** Deep Hill on Rice White = 14.8:1 (far exceeds WCAG AAA). Every text/background pairing in the elderly app must be checked against this bar — no pairing below AA (4.5:1) ships.

### 2.2 Typography

| Role | Typeface | Notes |
|---|---|---|
| Display / Headings | **Poppins** (or **Baloo 2**) — rounded, humanist sans | Warm and legible, not sharp/corporate; Baloo 2 has genuine Assamese/Bengali script support if we need native-script rendering later |
| Body | **Noto Sans** (+ **Noto Sans Bengali** for Assamese script) | Best-in-class multilingual coverage — critical since we're shipping Assamese day one; renders consistently across Latin and Bengali-script text |
| Numerals/Data | Noto Sans (tabular figures) | Used sparingly — this app avoids showing raw numbers/scores to the elderly user (see §2.5) |

**Type scale (elderly app — deliberately oversized vs typical web defaults):**

| Token | Size | Use |
|---|---|---|
| `display` | 40px / 700 weight | Home screen greeting |
| `h1` | 32px / 600 | Screen titles |
| `h2` | 26px / 600 | Card titles, game names |
| `body-lg` | 22px / 400 | Primary reading text — this is the **default body size**, not a "large text" toggle |
| `body` | 18px / 400 | Minimum allowed body size anywhere in this app |
| `button-label` | 24px / 600 | All button text |

No text in the elderly app goes below 18px. Line height 1.5x minimum for readability.

### 2.3 Layout & Spacing

- 8px base spacing unit. Generous whitespace — nothing feels cramped.
- Single-column layouts only. Never ask an elderly user to scan left-to-right across multiple columns.
- Max 4 primary tappable elements per screen (per doc 07 rule).
- Touch targets: 56px minimum height for primary buttons (above the 48px accessibility floor, because tremor/precision issues are common in this population).
- Generous tap-target spacing: minimum 16px gap between adjacent interactive elements.

### 2.4 Iconography & Imagery

- Every icon is paired with a text label — never icon-only (doc 07 rule, repeated here because it's a design decision as much as a rule).
- Icons: rounded, filled style (not thin-line outlines, which are harder to perceive for low-vision users) — **Phosphor Icons (Bold weight)** or **Lucide (stroke width 2.5+)**.
- Photography over illustration where possible for reminiscence content — real regional photos (Bihu, Hornbill, local landmarks) carry authenticity that illustration can't. Illustration is fine for onboarding/empty states, using a warm, simple flat style — never cartoonish/childlike.

### 2.5 Interaction & Feedback Rules

- **No scores framed as tests.** Never show "3/10 correct" as a headline result. Instead: warm completion language ("You did wonderfully today!") with accuracy shown small and optional, never the focal point.
- **No red "X" or buzzer sound for wrong answers.** A gentle Tea Garden-colored nudge ("Let's try that again") replaces any error-state red.
- Every tap gets immediate visual feedback (a soft scale/press state) within 100ms, plus optional sound (toggleable — some users/environments won't want sound).
- Loading states use the gamosa-border motif as a subtle animated accent (the "signature moment," used once — e.g., a woven line that gently draws itself in while content loads) rather than a generic spinner.
- Transitions: soft fades/slides, 200–300ms, never abrupt cuts, never bouncy/playful easing (reads as childish — use calm ease-in-out).

### 2.6 Reduced Motion & Accessibility Floor

- Respect `prefers-reduced-motion` — disable non-essential animation entirely for users who need it.
- All interactive elements keyboard/switch-accessible (some users may use assistive hardware via a caregiver-configured device).
- Support OS-level font scaling without breaking layout (test at 200% zoom).
- Color is never the only signal — pair every state change with an icon or text change too (for color-blind users and for clarity generally).

---

## 3. Caregiver Dashboard — Design System

Different audience (working-age, tech-comfortable, time-pressured), so this can be denser and more conventional — but it still uses the **same core palette** (Rice White / Deep Hill / Gamosa Red / Tea Garden / Mist Blue / Marigold) so the two apps feel like one family, just tuned for a different context.

### 3.1 Typography
- **Inter** for both display and body — clean, dense-information-friendly, excellent at small sizes for tables/charts.
- Base body size 15px (standard web dashboard density), headings 20–28px.

### 3.2 Layout
- Standard dashboard layout: left sidebar nav (Overview / Analytics / Sessions / Reminders / Memories / Alerts), main content area, top bar with patient switcher (if multiple linked patients).
- Multi-column layouts acceptable — this is a data-dense, professional-feeling context.
- Cards + data tables + charts (Recharts) as primary content patterns.

### 3.3 Charts
- Accuracy/reaction-time trend lines in Tea Garden (positive) and Gamosa Red (only for the "deviation from baseline" line — never implying danger, just drawing the eye).
- Always show the **personal baseline as a dashed reference line**, never a population "normal range" band — reinforces doc 07's business rule visually.
- Tooltips use plain language ("18% higher than usual"), never raw clinical-sounding labels.

### 3.4 Tone of Alerts (visual + copy)
- Alerts styled as calm notice cards (Marigold left-border accent), not red banners — even "missed reminder" is informational, not alarming.
- Copy examples: *"Reaction time is a bit higher than usual this week."* / *"Medicine reminder at 8 PM wasn't marked done."* Never: *"Warning: cognitive decline detected."*

---

## 4. Component Inventory (build checklist for Srujna → Anirudh/Parth handoff)

**Shared (both apps, themed differently via CSS tokens):**
- Button (primary/secondary/tertiary)
- Card
- Modal/Dialog
- Toast/inline confirmation
- Input field (text, PIN entry)
- Language toggle

**Elderly App only:**
- Reality Orientation header block
- Reminder card (large, dismissible)
- Game tile (Game Select screen)
- Game result screen (warm, non-score-forward)
- Reminiscence photo card with prompt text
- Gamosa-motif loading indicator

**Caregiver Dashboard only:**
- Sidebar nav
- Patient switcher
- Trend chart (line, with baseline reference)
- Data table (session history)
- Alert notice card
- Photo upload form with metadata fields

---

## 5. Design Deliverables Checklist (what Srujna should produce next)

- [ ] Figma file with the token system above (colors, type scale, spacing) as reusable styles
- [ ] High-fidelity mockups for all Tier 1 screens listed in doc 14 §6
- [ ] The gamosa-motif signature element as a reusable SVG asset (a few weight/color variants)
- [ ] One full user-flow prototype (Home → Game → Result) clickable for team testing
- [ ] Accessibility audit pass: contrast check on every screen, tap-target size check
- [ ] Handoff spec (spacing/sizing annotations) for Anirudh (elderly app) and Parth (dashboard)

---

## 6. What We're Deliberately Avoiding (and why)

| Avoided pattern | Why |
|---|---|
| Cream background + terracotta accent + serif display | Generic AI-design default — reads as templated, not designed for this brief |
| Bright primary colors, gamified/cartoon style | Reads as childish; elderly dementia patients deserve dignity, not a kids'-app aesthetic |
| Clinical blue/white "healthcare app" look | Reinforces the "this is a medical/diagnostic tool" impression we're explicitly avoiding (doc 00, 07) |
| Icon-only navigation | Fails the audience — every icon needs a label |
| Red error states / harsh scoring | Conflicts with the wellbeing-first product principle (doc 07 §2) |
| Generic ethnic-pattern stock backgrounds | Feels tokenistic; the gamosa motif is specific, real, and used with restraint instead |

---

## 7. Empty, Loading & Error States (every screen)

Empty, loading, and error states are not afterthoughts — for an elderly user, an unexplained blank screen or a cryptic error is a moment of confusion that could cause them to stop using the app entirely. Every state must be explicitly designed.

### 7.1 Elderly App States

| Screen | Empty state | Loading state | Error state |
|---|---|---|---|
| **Home / Reality Orientation** | Never truly empty (always shows date/time/greeting). If no reminders exist: show the greeting + a soft prompt: "Your day is clear. How about playing a game?" | Gamosa-motif animated line drawing (§2.5) beneath the greeting text while data loads | "We couldn't load your information right now. Don't worry — try opening the app again." (Tea Garden text, no red) |
| **Game Select** | All 4 game tiles always visible (statically defined). No empty state possible. | Tiles load instantly (static); game engine loads on tap — gamosa loading motif inside the selected tile | "This game isn't ready right now. Let's try another one." + highlight other tiles |
| **Game (in-play)** | N/A (game is active) | Stimuli load from local cache — <200ms, no loading indicator needed. If cache miss (first install, pre-sync): gamosa line + "Getting ready..." | If game logic fails (JS error): React Error Boundary catches → "Something went wrong. Let's go back." + auto-navigate to Game Select after 3s |
| **Game Result** | N/A (always has result data from the just-completed session) | N/A (renders synchronously from local state) | If result fails to save locally: show result normally (warm completion language per §2.5) + a small Mist Blue note: "We'll save your progress when we can." (offline-optimistic) |
| **Reminders List** | "No reminders set up yet. Ask your family to add some for you." (Warm, Mist Blue text, illustration of a calm bell icon) | Gamosa line while syncing | "Couldn't load reminders. Your existing reminders are still working." (because client-side scheduling runs independently) |
| **Reminiscence Gallery** | "No memories added yet. Ask your family to share some photos with you." (Warm, illustration of a photo frame) | Photo thumbnails load progressively (skeleton shimmer, NOT a spinner) — each photo fades in as it loads from cache/network | "Some photos couldn't be loaded. Here are the ones we have." (show whatever loaded successfully, never a full-screen error) |
| **Settings** | Always has content (language toggle, text size, sign out) | N/A (static screen) | N/A |

### 7.2 Caregiver Dashboard States

| Screen | Empty state | Loading state | Error state |
|---|---|---|---|
| **Patient Overview** | "No patients linked yet. Add your first family member to get started." + prominent "Add Patient" CTA | Skeleton shimmer cards (content-shaped placeholders) | "Couldn't load patient data. Check your connection and try again." + retry button |
| **Analytics** | "Not enough data yet. Once [patient name] plays a few games, trends will appear here." (friendly, not clinical) + show empty chart axes with a "data coming soon" label | Chart skeleton shimmer; baseline reference line renders immediately if baseline exists | "Analytics couldn't be loaded right now." + show last cached data with a "Last updated: [time]" label |
| **Session History** | "No game sessions recorded yet." | Table skeleton rows | "Couldn't load session history." + retry button |
| **Reminders** | "No reminders created yet. Set a medicine or hydration reminder for [patient name]." + "Create Reminder" CTA | Skeleton list | Standard error + retry |
| **Memories** | "No photos or memories shared yet. Upload family photos for [patient name] to enjoy." + "Upload Photo" CTA | Upload progress bar (for uploads); skeleton grid (for gallery) | Upload failure: "Upload failed. Your photo wasn't lost — try again." + retry button. Gallery failure: show cached items + "Some items couldn't be loaded." |
| **Alerts** | "No alerts yet. This is a good thing!" (positive framing — absence of alerts = good news, not empty state) | Skeleton notice cards | "Couldn't load alerts." + last cached alerts shown |

### 7.3 Global State Rules

1. **Never show a raw "null", "undefined", "NaN", or empty string** — every data field has a fallback value or is hidden entirely.
2. **Loading indicators:** Elderly app uses the gamosa motif (once per screen). Dashboard uses skeleton shimmers (standard web pattern). Neither app uses a generic circular spinner.
3. **Error recovery:** Every error state in the elderly app includes an automatic retry (after 5s) OR a clear manual action. The elderly user should never be stuck on an error screen with no path forward.
4. **Offline indicator:** Both apps show a small, persistent-but-unobtrusive indicator when offline (a Mist Blue dot or "Offline" badge in the header). This is informational, not alarming — the app still works.
5. **Stale data indicator (dashboard only):** When cached data is being shown because the API is unreachable, show "Last updated: [time ago]" in Mist Blue below the relevant section.

