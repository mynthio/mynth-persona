![Mynth Persona Banner](assets/banner.png)

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/mynthio/mynth-persona?utm_source=oss&utm_medium=github&utm_campaign=mynthio%2Fmynth-persona&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

# Mynth Persona

## Getting Started

1. Start the database:

   ```bash
   docker-compose up -d
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Install dependencies and start the development server:

   ```bash
   pnpm install
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

For utility scripts and database management tools, see [scripts/README.md](scripts/README.md).
