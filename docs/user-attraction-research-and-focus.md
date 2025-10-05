# User Attraction Research and Next Focus

This document distills product and analyst research grounded in the current codebase to identify features most likely to attract users, improve activation/conversion, and deepen retention. It proposes a now/next/later focus with measurable outcomes.

## Context Snapshot (What We Have Today)
- Persona creation and versioning
  - Create, enhance, and publish personas; set current version; persona events logged (create, edit, image generate, revert, clone)
  - Strong type safety and public vs. backend schema separation prevents sensitive data exposure
- Conversations
  - Two chat modes via prompt system: Roleplay (character-led) and Story (narrator-led chapters)
  - Message tree structure exists (branching hooks, leaf queries) enabling future branch UI
- Image generation
  - Multiple Runware-backed models (FLUX family, Seedream, etc.) abstracted behind universal model IDs and quality tiers
  - Retries, timeouts, and per-request config; path for advanced model selection
- Pricing & tokens
  - Token-based model with daily free tokens and reset logic
  - Checkout flow and webhook to credit balances (Polar checkout ID present)
- UI status
  - Pricing page scaffolded; some sidebar areas marked Work In Progress (Chats, Images)

## Core User Segments (Hypotheses)
- RP enthusiasts seeking believable, consistent characters (chat-first)
- Writers/storytellers wanting persona-driven narrative scaffolding (story-first)
- Visual creators wanting quick persona imagery with quality control (image-first)
- Tinkerers/builders who remix or clone personas (community-first)

## Key Opportunity Areas
1) Guided Onboarding + Templates (Activation lift)
- Problem: Cold-start friction when crafting the first persona; users need examples and guardrails.
- Proposal:
  - Starter kits: “Archetypes” (e.g., Mentor, Rival, Detective) that pre-fill persona fields and prompts
  - Inline guidance with micro‑copy and progress indicators in the creator flow
  - One-click “Generate First Image” with recommended defaults based on archetype
- Metrics: Persona creation completion rate, time-to-first-image, D1 retention

2) Rich Gallery & Persona Media (Retention + Shareability)
- Problem: Current image UX is minimal; creators want to curate persona visuals.
- Proposal:
  - Gallery with favorites, tags, and cover image selection per persona version
  - Quick regenerate/variations; side-by-side compare; prompt history per image
  - Lightweight moderation pipeline (NSFW toggle, tags, report) for future public sharing
- Metrics: Images per active user, repeat generations per session, CSAT on image outcomes

3) Advanced Image Controls with Cost Transparency (Conversion)
- Problem: Power users want control; new users need clarity on cost vs. quality.
- Proposal:
  - “Basic/Advanced” toggle: basic uses quality tiers; advanced unlocks model selection, size, steps, and style hints
  - Token estimator before generation and post-run receipt (tokens spent, model used)
  - Save presets per persona; per-preset estimated token cost
- Metrics: Checkout conversion, ARPU, image retry rate, cancel rate after estimator view

4) Public Persona Pages + Clone/Use (Growth loop)
- Problem: Discovery/acquisition relies on existing traffic; personas are inherently shareable.
- Proposal:
  - Public persona profiles (read-only) with gallery, short summary, and “Clone Persona”/“Open in Chat” CTA
  - SEO-friendly metadata and simple share links; opt-in publish with visibility controls
  - Basic community signals (views, clones) with future likes/bookmarks
- Metrics: New signups from shared links, clone rate, % traffic to signups, search impressions

5) Chat Branching UI + Memory/Summary (Engagement)
- Problem: Depth of conversation and revisitation depend on navigable branches and memory.
- Proposal:
  - Visual thread map for branches (existing data supports this) with easy backtrack/fork
  - Summarize long chats into persona-aware memory snippets (token-conserving summaries)
  - “Return to this branch later” reminders; pin favorite branches
- Metrics: Session length, return-to-branch rate, conversations per persona, D7 retention

6) Social Sharing & Embeds (Acquisition)
- Problem: Creations are valuable content; make them portable.
- Proposal:
  - Export persona cards (image + summary) and embeddable widgets for blogs/portfolio
  - Social share image generation with branding and attribution
- Metrics: Share events, referral signups, inbound traffic quality

## Prioritization (Now / Next / Later)
- Now (2–3 weeks): Activation & Conversion
  1. Guided Onboarding + Templates
  2. Advanced Image Controls with token estimator (Basic/Advanced)
- Next (4–6 weeks): Growth & Retention
  3. Public Persona Pages + Clone/Use (MVP, behind feature flag)
  4. Rich Gallery & Persona Media (cover image, favorites, tags)
- Later (6–10 weeks): Depth
  5. Chat Branching UI + Memory/Summary
  6. Social Sharing & Embeds

## Implementation Notes (Grounded in Code)
- Templates & Onboarding
  - Leverage prompt registry (system vs. user prompts) to add archetype templates and expose preset rendering
  - Use shared schemas to ensure only safe fields are presented in the creation UI
- Advanced Image Controls
  - Build on image-generation factory and Runware model classes; surface size/steps/quality; respect default per-request config
  - Add token estimation logic based on model and settings; display pre‑run estimate and post‑run spend
- Public Persona Pages
  - Use shared schemas for public pages; add visibility and publish controls already present in actions/services
  - Start with read-only page showing current version summary, tags, and a minimal gallery
- Gallery Enhancements
  - Extend existing image store/query hooks; add tags/favorites; enable “set as cover” on persona version
- Chat Branching & Memory
  - Utilize existing message leaf/branch queries and hooks to render a thread map
  - Add summarization via existing text-generation provider; store per-branch summaries to reduce token costs

## Experiment Plan & KPIs
- Onboarding Templates A/B
  - Hypothesis: Templates reduce friction and improve activation
  - Success: +20–30% persona creation completion, −30% time-to-first-image, +10% D1 retention
- Advanced Controls + Estimator
  - Hypothesis: Transparency improves trust and conversion
  - Success: +10–15% checkout conversion, −20% image retry rate, higher CSAT for image outputs
- Public Persona Pages (MVP)
  - Hypothesis: Shareable pages create referral growth
  - Success: >10% of new signups from shared links, >20% clone/use action rate on public personas

## Risks & Mitigations
- Content safety and IP
  - Add report/visibility controls, basic tag filters, opt-in public publishing; document NSFW handling
- Cost overruns via heavy image runs
  - Enforce token estimator and caps; tiered model access; robust retries/timeouts already in place
- Quality misalignment
  - Add quick variations and feedback prompts; close loop with presets that store winning settings
- Complexity creep in UI
  - Use Basic/Advanced split; progressive disclosure; default sensible options

## Recommendation: Focus Now
- Ship “Guided Onboarding + Templates” and “Advanced Image Controls + Token Estimator” in parallel tracks.
- Prepare “Public Persona Pages (MVP)” behind a feature flag to validate growth potential early.

## Measurement & Reporting
- Add analytics events for persona creation steps, image generation settings, estimator views, publish/clone actions
- Weekly review of activation (A0→A2 funnel), monetization (checkout conversion, ARPU), and retention (D1/D7)

## Backlog (High-Value Later Items)
- Multi-character scene generation and storyboards
- Persona marketplace with search/tags, ratings, and moderation
- Collaboration (shared editing, comments), team workspaces
- Prompt A/B testing and per-persona prompt presets library
- Mobile-friendly experiences and offline drafts