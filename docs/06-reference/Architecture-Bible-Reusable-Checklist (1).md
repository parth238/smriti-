# THE ARCHITECTURE BIBLE FRAMEWORK
## A Reusable Checklist for Building Any Product

*This is the generalized skeleton of the 12-volume Swift Architecture Bible, stripped of any product-specific content. Use it as a diagnostic checklist on any future build: for each item, ask "do I actually have this, in writing, in enough detail that someone else could act on it?" A blank or a guess is a gap, not a pass. You don't need to fill every box before writing code — but you should know which boxes are empty on purpose (not yet needed) versus empty by accident (a real gap).*

*How to use this: don't fill this out top-to-bottom before building anything — that's the exact premature-complexity trap this framework itself warns against. Fill in Volume 1 for real before anything else. Then build. Then pull in whichever later volume's checklist you actually need, when you need it.*

---

## MASTER PROMPT — Global Principles (apply to every volume below)

- [ ] Have you named the product and written a one-sentence, one-paragraph, and one-page description of it?
- [ ] Have you stated what the product explicitly is **not** (its non-goals)?
- [ ] Do you have a documented list of architecture principles (e.g., human-in-the-loop, API-first, cost-conscious, modular-first) that every later decision can be checked against?
- [ ] Is there a single, consistent standard for how decisions get recorded (an ADR format: Context → Decision → Alternatives Considered → Consequences)?
- [ ] Have you decided who/what your documentation is written for (a future hire? just you? investors?) — and does the depth match that audience?
- [ ] Are you avoiding padding/repetition for its own sake? (Every section should say something a reader doesn't already know from an earlier section.)

---

## VOLUME 1 — BUSINESS ARCHITECTURE
*What is this, and why does it need to exist?*

- [ ] One-sentence, one-paragraph, one-page description of the product
- [ ] Elevator pitch, investor pitch, customer pitch, engineer pitch (these are different)
- [ ] Mission and vision statements
- [ ] Industry/market context: size, structure, who the real "operating unit" of the market is
- [ ] SWOT / PESTLE / Porter's Five Forces (or equivalent) for the market you're entering
- [ ] A detailed, evidence-based problem statement — not assumed, ideally from real conversations
- [ ] Root cause analysis of the problem (5 Whys, fishbone, or equivalent)
- [ ] Quantified pain points (hours, money, frequency) wherever possible
- [ ] Personas for every distinct human role who touches the product (not just "the user")
- [ ] Explicit statement of what the solution is, and — just as important — what it is *not*
- [ ] Product principles that will hold even when they're inconvenient (state which ones can never be violated)
- [ ] 3/5/10-year vision, and an honest moat assessment (what's actually defensible vs. what's just currently unbuilt by competitors)
- [ ] A phased module/capability map
- [ ] A phased roadmap with an explicit "build through phase X before phase Y" recommendation, and the reasoning for that order
- [ ] Competitor landscape: who else solves this, how, and what's the actual gap
- [ ] Business model: pricing, revenue streams, retention assumptions, CAC assumptions
- [ ] Go-to-market plan: ICP, pilot strategy, sales motion, distribution channels
- [ ] Risk register: technical, business, regulatory, market, founder/team risks
- [ ] Success metrics: one North Star metric plus supporting KPIs
- [ ] A glossary of every domain-specific term
- [ ] **A closing verdict**: where do you disagree with your own earlier assumptions, and why?

---

## VOLUME 2 — SOLUTION ARCHITECTURE & DOMAIN MODEL
*How does the business translate into software concepts?*

- [ ] Bounded contexts / modules identified, each with a stated responsibility and explicit boundary
- [ ] A context map showing how modules relate (which are tightly coupled, which are independent)
- [ ] A ubiquitous language dictionary — the exact terms every person and every line of code must use consistently
- [ ] A list of **forbidden terms** (words that are too generic, misleading, or imply something untrue about the system)
- [ ] Business capabilities mapped to owning modules, with priority/maturity tagged
- [ ] Conceptual domain model: entities, relationships, lifecycles — no database detail yet
- [ ] Aggregates and consistency boundaries defined (what must change together atomically vs. what can be eventually consistent)
- [ ] A domain event catalog: every meaningful business fact, its trigger, publisher, and subscribers
- [ ] Key business workflows modeled (happy path, alternate path, failure path)
- [ ] A business rules catalog, with an owner and a stated priority for each rule
- [ ] Explicit governance rule: which decisions require human sign-off, and which body signs off on them
- [ ] ADRs recorded for every non-obvious structural decision (why this boundary, why this pattern)

---

## VOLUME 3 — SYSTEM DESIGN
*How is this actually built as software?*

- [ ] A stated position on monolith vs. microservices — and the reasoning tied to your actual team size and stage, not a default
- [ ] C4-style diagrams: system context, containers, components
- [ ] A dependency rule for your codebase's layering (what's allowed to depend on what)
- [ ] Sync vs. async communication rules: when is something processed inline vs. queued
- [ ] API conventions: versioning, pagination, error format, rate limiting
- [ ] Explicit latency/performance budgets for every user-facing and system-facing path
- [ ] A scalability plan tied to named growth tiers (not just "it'll scale")
- [ ] Reliability patterns: retries, circuit breakers, timeouts, bulkheads, idempotency — stated as requirements, not aspirations
- [ ] A failure-mode table: for every major dependency, what happens when it's down, and how is that detected/recovered
- [ ] Deployment topology (even if simple) and network/trust boundaries
- [ ] A security posture at the application layer: authN, authZ, encryption
- [ ] An observability plan: what's logged, traced, and alerted on
- [ ] A disaster recovery posture stated honestly (RTO/RPO you can actually deliver, not an aspirational number)
- [ ] Capacity estimates tied to your actual expected user/data growth
- [ ] ADRs for every major architectural pattern choice (why event-driven, why this deployment shape, etc.)

---

## VOLUME 4 — DATA ARCHITECTURE
*Where does data live, who owns it, and how is it protected?*

- [ ] A data-ownership map: every piece of data has exactly one owning module
- [ ] Multi-tenancy model chosen and justified (shared tables + isolation flag vs. separate schema vs. separate database)
- [ ] A tenant-isolation matrix: which layer (app, database, storage) enforces isolation, and what happens if one layer fails
- [ ] Conceptual → logical → physical data model, in that order
- [ ] A data lifecycle policy: creation, modification, soft delete, hard delete, archival, legal hold
- [ ] File/document storage strategy: where raw files live, versioning, deduplication, malware scanning
- [ ] Search strategy (full-text, vector, or hybrid) — chosen for your actual scale, not the fanciest option
- [ ] An audit log design: is it append-only, and is it the actual source of truth for "what happened"
- [ ] A data governance section: PII classification, retention rules, and applicable privacy law compliance (mapped explicitly, not assumed)
- [ ] Encryption strategy: at rest, in transit, field-level for the most sensitive fields
- [ ] A consistency model: what's strongly consistent, what's eventually consistent, and why
- [ ] A backup and recovery strategy with a stated RPO/RTO and a **tested** restore process
- [ ] A data scalability plan tied to the same growth tiers as Volume 3
- [ ] ADRs for every core data-engine choice (why this database, why this isolation model)

---

## VOLUME 5 — AI ARCHITECTURE *(skip if your product has no AI)*
*How does AI actually operate inside this system?*

- [ ] A stated AI philosophy: what AI is allowed to decide vs. only assist with — as a hard, non-negotiable rule
- [ ] A catalog of every AI capability: purpose, inputs, outputs, confidence handling, human-approval requirement
- [ ] An agent architecture that respects your existing module boundaries — no single "super-agent" crossing every boundary
- [ ] A stated position on orchestration framework (or custom) — chosen for fit, not hype
- [ ] A model gateway/abstraction layer so you're never locked to one AI vendor
- [ ] A model-routing strategy: cheap/fast tier first, expensive tier only on demonstrated need
- [ ] A prompt registry: prompts are versioned, tested, and reviewed — never inline strings
- [ ] A context-engineering strategy: what data is assembled for each AI call, and how it's kept from bloating
- [ ] If using RAG: chunking, retrieval, citation, and freshness/versioning strategy
- [ ] A memory strategy — and an explicit decision about whether you need a separate AI memory store at all
- [ ] A tool-permission model: every AI-callable tool is narrowly scoped, and **nothing exists that lets AI perform your highest-stakes action unsupervised**
- [ ] Structured output validation: every AI output is schema-checked, with a defined low-confidence fallback
- [ ] An AI safety chapter: prompt injection, data leakage across tenants, hallucination mitigation
- [ ] An evaluation framework: golden datasets, regression testing before any prompt/model change ships
- [ ] AI-specific observability: confidence distributions, override rates, cost per call
- [ ] AI cost engineering, reconciled against your overall per-customer cost model
- [ ] ADRs for every AI architecture choice (why RAG, why this orchestration pattern, why human approval is structural not just policy)

---

## VOLUME 6 — INTEGRATION ARCHITECTURE
*How does this talk to the outside world?*

- [ ] A full catalog of every external dependency: purpose, owner, criticality, failure impact, authentication method
- [ ] A single governing principle: every external system sits behind an adapter/anti-corruption layer
- [ ] A webhook-handling standard: signature verification, replay protection, dedup, fast-ack-then-async-process
- [ ] Explicit handling for your most critical external channel (the one thing that would hurt most if it went down)
- [ ] A document/data-ingestion pipeline that normalizes multiple input channels into one internal contract
- [ ] Authentication standards for every integration type (API keys, OAuth, webhook signatures, service accounts)
- [ ] A vendor-management plan: how would you actually swap a critical vendor, and how long would it take
- [ ] An honest statement of your single-vendor dependency risks — named, not hidden
- [ ] An integration failure table matching Volume 3's pattern, specific to each external system
- [ ] A future integration roadmap, clearly separated into "current" and "speculative/not committed"
- [ ] ADRs for every integration pattern choice (why webhooks vs. polling, why this vendor abstraction)

---

## VOLUME 7 — PLATFORM ENGINEERING & DEVOPS
*How is this built, deployed, and operated?*

- [ ] A staged infrastructure roadmap tied to real growth triggers (not "we'll figure it out")
- [ ] An honest call on when (if ever) you need container orchestration (Kubernetes-class tooling) vs. simpler managed compute
- [ ] Cloud/region strategy, stated with its real limitations (single-region? multi-AZ only? say so)
- [ ] Environment strategy: local, preview, staging, production — and what data lives in each
- [ ] Infrastructure as Code from day one, however small the deployment
- [ ] A CI/CD pipeline: build → test → scan → deploy → verify → rollback, with an explicit production promotion gate
- [ ] A release strategy: when to use rolling vs. canary vs. blue/green, matched to risk level
- [ ] A secrets-management strategy: centralized, least-privilege, rotated
- [ ] One unified observability platform — not three disconnected monitoring tools
- [ ] SLIs/SLOs stated at a level your actual architecture can support (don't promise five nines on single-region infrastructure)
- [ ] An error-budget policy that actually pauses feature work when triggered
- [ ] A cost model reconciled against your business plan's per-customer cost assumptions
- [ ] A developer onboarding path scripted for "the next hire," not just yourself
- [ ] An incident-response process: severity levels, escalation, runbooks for every documented failure mode, blameless postmortems
- [ ] ADRs for every infrastructure choice, including *why not* the fancier option, if that's the honest reason

---

## VOLUME 8 — SECURITY, COMPLIANCE, PRIVACY & RELIABILITY
*How do you protect data and earn trust?*

- [ ] Named security principles (zero trust, least privilege, defense in depth) with concrete examples of where each is implemented
- [ ] Identity and access model: RBAC (or ABAC if you truly need it), MFA policy for sensitive roles
- [ ] A full data-protection summary: encryption, key management, masking, tokenization
- [ ] An OWASP-style checklist mapped explicitly to your specific mitigations — including honest "not applicable" entries
- [ ] Privacy-by-design principles: consent, purpose limitation, data minimization, retention, export, erasure
- [ ] A compliance framework mapping for every regime that actually applies to you (not a generic list) — including data residency and cross-border transfer questions if relevant
- [ ] A breach-notification process, flagged for legal review rather than guessed at
- [ ] A formal threat model (STRIDE or equivalent) across every major asset class in your system
- [ ] A scored risk register: technical, vendor, compliance, AI, operational — each with an owner and a treatment plan
- [ ] **Named single points of failure that are people, not just infrastructure** (the founder, any single specialist role your process depends on)
- [ ] An incident-response process extended for security/privacy-specific scenarios
- [ ] A business continuity plan: what happens if a key vendor, a key system, or a key person is unavailable
- [ ] Vulnerability management: scanning coverage, patch SLAs, remediation workflow
- [ ] Access governance: admin/support access rules, break-glass procedure, offboarding SLA
- [ ] A security roadmap separating "build now" from "build when a customer actually requires it"
- [ ] ADRs for every security/compliance posture decision

---

## VOLUME 9 — PERFORMANCE, SCALABILITY & COST
*How fast, how big, and how much?*

- [ ] A master performance-budget table for every meaningful user/system path
- [ ] A caching strategy at every layer (browser, edge, app, database), with the tenant-isolation rule stated explicitly if multi-tenant
- [ ] A scalability plan across named growth tiers, with an honest note on which constraint hits first at each tier
- [ ] A load-testing strategy: load, stress, spike, soak, and chaos testing, each with a stated purpose
- [ ] A "failure under load" table — distinct from your general failure table — covering what happens when you succeed too well (traffic spikes, mass usage)
- [ ] A capacity-planning model tied to real growth assumptions
- [ ] A bottleneck analysis: what breaks first, at each scale tier, and what the actual fix is
- [ ] A full, reconciled cost model: every infrastructure/AI/third-party cost line item, mapped to your pricing model's margin
- [ ] A FinOps practice: cost dashboards, per-customer cost tracking, budget alerts
- [ ] An honest reliability-vs-performance tradeoff discussion (what you're deliberately not doing yet, and why)
- [ ] An honest statement about whether "global expansion" even makes sense for your specific product
- [ ] ADRs for every performance/cost-related architecture decision

---

## VOLUME 10 — ENGINEERING STANDARDS
*How do engineers actually build this, day to day?*

- [ ] Stated engineering principles (maintainability over cleverness, simplicity, consistency)
- [ ] A repository structure that mirrors your domain model, not an arbitrary folder convention
- [ ] Enforced (not just documented) architectural boundaries — a lint rule, not just a code-review reminder
- [ ] Coding standards: naming (tied to your ubiquitous language), formatting, logging, error handling, async patterns
- [ ] Concrete technology choices, finally committed (language, framework, ORM) — with the reasoning written down
- [ ] Database implementation standards: migrations, repository pattern, transaction boundaries, concurrency handling
- [ ] If using AI: implementation standards for prompt storage, tool interfaces, retries, evaluation hooks
- [ ] Frontend standards: component architecture, accessibility, performance budgets, a design system
- [ ] Error-handling standards: typed exceptions, retryable vs. non-retryable, never a raw error shown to a user
- [ ] A documentation hierarchy: architecture docs, module READMEs, API docs, ADRs, runbooks — each with a stated home so nothing goes stale from ambiguity
- [ ] A Git workflow: branching, commit format, merge strategy, hotfix process
- [ ] A code review checklist covering architecture, security, performance, correctness, and complexity
- [ ] A technical debt process: classification, ownership, and a real remediation cadence
- [ ] Dependency management: pinning, security updates, license compliance
- [ ] Engineering metrics: lead time, deployment frequency, change failure rate, MTTR
- [ ] A governance process for when a new ADR is actually required, sized appropriately for your team
- [ ] An onboarding path with a practical (not exhaustive) reading order
- [ ] ADRs for every core technology and implementation-pattern choice

---

## VOLUME 11 — TESTING & QUALITY ENGINEERING
*How do you know it actually works?*

- [ ] A stated testing pyramid shape (many unit tests, fewer integration, fewest end-to-end) with the reasoning
- [ ] A risk-based testing policy: your highest-stakes capabilities get the most rigorous testing, not uniform effort everywhere
- [ ] Unit testing standards: naming, mocking at interface boundaries, determinism (especially for anything date/time-sensitive)
- [ ] Integration testing standards: real database (to actually test isolation policies), recorded real provider payloads, mocked externals
- [ ] A defined set of critical end-to-end user journeys — not exhaustive coverage, deliberately selective
- [ ] Contract testing against your actual API specification, not a hand-maintained parallel spec
- [ ] If using AI: an evaluation pipeline plugged into your release process, plus an adversarial/"red team" test suite for anything safety-relevant
- [ ] Performance tests run as CI-gated regression checks, not a separate occasional activity
- [ ] Security testing: positive AND negative auth cases, an OWASP-mapped test per mitigation, secrets-leak scanning
- [ ] A chaos-engineering practice that verifies your documented failure recovery *actually* works
- [ ] A flaky-test policy: quarantine and track, never silently re-run until green
- [ ] A release-validation checklist: build → smoke → regression → canary (with a real quality threshold, not just "no errors") → rollback confirmed
- [ ] A defect-management process sharing severity vocabulary with your incident process
- [ ] Quality metrics: escaped-defect rate is the single most important trend to track
- [ ] A production verification layer where synthetic monitoring is treated as continuous testing, not separate from it
- [ ] An honest list of sophisticated testing techniques you're deliberately NOT doing yet, and why
- [ ] ADRs for every testing/quality-process choice

---

## VOLUME 12 — PRODUCT MANAGEMENT & UX
*How does this get discovered, designed, and improved?*

- [ ] A repeatable customer-discovery interview framework (not a one-time exercise before launch)
- [ ] A Jobs-To-Be-Done statement for your core value proposition
- [ ] Product principles translated explicitly into UX rules (not left as abstract values)
- [ ] Defined empty, loading, and error states for every major surface — not left as an afterthought
- [ ] A design system with enforced consistency, versioned like code
- [ ] A product-analytics plan that reuses your existing data/event architecture, not a parallel instrumentation system
- [ ] An honest statement about when quantitative experimentation (A/B testing) is actually valid at your scale, vs. when qualitative validation is more reliable
- [ ] A feedback-routing process: bugs and feature requests go into your existing engineering/roadmap processes, not a separate silo
- [ ] Lightweight PRD/RFC templates, sized to avoid premature process
- [ ] A release-operations process for *product* rollout decisions (who sees it first), distinct from your technical deployment process
- [ ] A customer-success/onboarding playbook, with real timeline inputs (e.g., any external approval lead times) baked in
- [ ] A defined North Star metric, with every other metric explicitly understood as contributing to it, not competing with it
- [ ] A competitive-intelligence process that's ongoing, not a one-time analysis, with an honest "is our window closing" check
- [ ] A product-operations cadence sized to your actual team (don't adopt sprint ceremonies or OKRs before you have a team that needs the coordination)
- [ ] An honest statement about product scaling dimensions that don't actually apply to you yet (new geographies, marketplaces, developer ecosystems) — named and explicitly deferred, not silently ignored
- [ ] ADRs for every major product-strategy and UX decision

---

## FINAL CHECK — Before you call this "done"

- [ ] Does every volume cross-reference the others, or do they quietly contradict each other?
- [ ] Have you flagged every open question that depends on real data you don't have yet, instead of guessing a number and moving on?
- [ ] Is there one clear verdict on **what to build first**, distinct from everything you've documented for later?
- [ ] Would a new hire reading this actually be able to build the first real feature, or does it only make sense to the person who wrote it?
- [ ] Are you about to use this checklist as a reason to keep planning instead of shipping? (If yes — stop, and go build Volume 1's Phase 1.)
