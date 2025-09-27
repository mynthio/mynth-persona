# Mynth Persona — Product Overview

Mynth Persona is a creator-focused app for designing, evolving, and publishing AI personas you can chat with, narrate stories about, and visualize through generated images. It blends structured persona authoring with multiple generation modes (text and image) and offers a simple, token-based pricing model.

## Value Proposition
- Create and maintain rich, versioned personas with clear publishing controls.
- Engage with personas via two distinct chat modes: roleplay (first/second‑person) and story (third‑person narration).
- Generate persona images across quality tiers with unified model selection and provider abstraction.
- Start free with daily tokens and scale usage via transparent, token‑based pricing.

## Core User Flows
1. Authentication and Access
   - Sign in with a modern authentication experience.
   - Free usage is protected by rate limits and daily token resets.

2. Persona Lifecycle
   - Create: Start from a prompt and structured data to create a new persona.
   - Versioning: Each persona has versions. You can set the current version, enhance, or publish.
   - Events: Persona actions such as create, edit, image generation, revert, and clone are tracked.

3. Chat Modes
   - Roleplay Mode: Conversational experiences with the persona.
   - Story Mode: Narrator-led, chapter‑based storytelling that advances the plot with each response.

4. Image Generation
   - Generate persona images with model‑agnostic controls, quality tiers, and provider selection.
   - Defaults exist for common quality levels (e.g., low, medium, high), with a path for advanced users to choose specific models.

5. Tokens and Checkout
   - Simple pricing with tokens that fund generation operations.
   - Checkout flow creates a payment session and redirects to the provider; webhooks record successful purchases.

## Feature Breakdown
- Persona Authoring & Management
  - Structured fields cover appearance, personality, physical traits, age, style, and more.
  - Version history enables safe iteration and publishing.
  - Public vs. internal schemas ensure only safe data is exposed externally.

- Conversations
  - Roleplay: Configured via system prompts that guide persona behavior and dialogue style.
  - Story: A narrator template structures third‑person storytelling with chapters, pacing, and user guidance.

- Image Generation
  - Unified model IDs (e.g., FLUX family) abstract provider implementations.
  - Multiple providers are available behind the scenes, enabling quality selection and reliability via retries and timeouts.

- Pricing & Tokens
  - Daily free tokens with automatic reset at UTC boundaries.
  - Token purchases via checkout; webhook processing updates user balances.

- Performance & Reliability
  - Rate limits protect creation endpoints for both anonymous and authenticated users.
  - Background tasks support image generation and publish operations.

## Integrations
- Authentication: Clerk for sign‑in and user state.
- Text Generation: OpenRouter-powered models (e.g., Gemini for roleplay summaries) used where appropriate.
- Image Generation: Runware SDK powering FLUX and other models with unified configuration.
- Payments & Webhooks: Checkout sessions and webhook handlers (e.g., Polar checkout ID) to record completed transactions.
- Data & Infra: Drizzle ORM for schema and queries; SWR for frontend data fetching.
- Tracking: Event logging for persona generation outcomes.

## Data & Security
- Schema Separation
  - Shared (frontend‑safe) schemas expose only public persona data.
  - Backend‑only schemas include sensitive fields (e.g., user IDs) and are never sent to the client.
- Transformations ensure API routes return only public shapes, reducing accidental data exposure.

## Current Limitations & WIP Areas
- Some sidebar sections (Chats, Images) indicate work‑in‑progress states in parts of the UI.
- Pricing page layout exists with a simple, transparent message; detailed tables and skeletons are marked for enhancement.

## Who It’s For
- Creators and writers crafting consistent characters for roleplay or long‑form stories.
- Visual storytellers and persona designers who want quick, high‑quality image renditions.
- Product teams experimenting with persona‑driven UX or content experiences.

## Future Opportunities (Inferred)
- Expanded persona property actions and editing tools.
- More granular image controls (styles, loras, shot types) exposed to users.
- Richer gallery/library experiences to organize persona assets.
- Deeper economy features (bundles, subscriptions) on top of tokens.