<div align="center">

![Mynth Persona Banner](assets/banner.png)

# ✨ **Persona by Mynth** ✨

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/mynthio/mynth-persona?utm_source=oss&utm_medium=github&utm_campaign=mynthio%2Fmynth-persona&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews) [![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?&logo=discord&logoColor=white)](https://discord.gg/ktHXuPVaqB)

```
    ╔═══════════════════════════════════════════════════════════╗
    ║  🎭 Craft personas with AI precision                     ║
    ║  🚀 Powered by cutting-edge technology                   ║
    ║  💎 Beautiful, intuitive user experience                 ║
    ╚═══════════════════════════════════════════════════════════╝
```

</div>

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- **Docker**: Required for running the database and Redis services.
- **Node.js**: Version 18 or higher.
- **pnpm**: Package manager.

### Environment Setup

1. Copy the example environment file:

   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in the required API keys:

   - **Database & Redis**:
     - `DATABASE_URL`: Connection string for the main database.
     - `LOCAL_DATABASE_URL`: Used for local development (defaults to Docker setup).
     - `REDIS_URL`: Defaults to local Docker Redis.
     - `KV_REST_API_URL` & `KV_REST_API_TOKEN`: For serverless Redis (defaults to Docker setup).
   - **Clerk Authentication**:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY` (from Clerk Dashboard).
     - **Billing Plans**: `NEXT_PUBLIC_SPARK_PLAN_ID`, `NEXT_PUBLIC_FLAME_PLAN_ID`, `NEXT_PUBLIC_BLAZE_PLAN_ID`.
   - **Bunny CDN**:
     - `NEXT_PUBLIC_CDN_BASE_URL`: The public URL of your CDN.
     - `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_ZONE_KEY`, `BUNNY_API_KEY`: For storage management.
   - **AI Services**:
     - `RUNWARE_API_KEY`: For image generation.
     - `OPEN_ROUTER_API_KEY`: For chat and persona generation.
   - **Infrastructure**:
     - `TRIGGER_SECRET_KEY`: For background jobs.
     - `UNKEY_ROOT_KEY`: For API key management.
     - `AXIOM_DATASET` & `AXIOM_TOKEN`: For logging/analytics.
   - **Other**:
     - `INTERNAL_REVALIDATION_SECRET`: Secure secret for cache revalidation.

### Running the App

1. **Start Infrastructure**:
   Run the Docker Compose command to start PostgreSQL, Redis, and the serverless proxies (simulating production environment).

   ```bash
   docker compose up -d
   ```

2. **Install Dependencies**:

   ```bash
   pnpm install
   ```

3. **Run Development Server**:
   This command starts both the Next.js app and the Trigger.dev dev server concurrently.

   ```bash
   pnpm dev
   ```

   - Next.js: [http://localhost:3000](http://localhost:3000)
   - Trigger.dev Dashboard: [http://localhost:3030](http://localhost:3030) (or check terminal output)

## Scripts

For utility scripts and database management tools, see [scripts/README.md](scripts/README.md).
