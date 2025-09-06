#!/usr/bin/env tsx

/**
 * Seed predefined tags into the database (idempotent upsert)
 * - Reads tag definitions from this file (derived from SPEC)
 * - Inserts or updates tags using ON CONFLICT (name) DO UPDATE
 * - Uses `name` as the logical key (unique), sets `id = name`
 * - "other" category tags are hidden from UI filters (isVisible=false)
 *
 * Usage:
 *  pnpm run seed:tags            # executes (by default DRY_RUN=false)
 *  DRY_RUN=true pnpm run seed:tags  # preview without DB writes
 */

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { tags } from "../src/db/schema";

// Load environment variables (same pattern as other scripts)
config({ path: [".env.local", ".env"], quiet: true });

// Configure WebSocket for Node.js environments (same as src/db/drizzle.ts)
if (typeof WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { WebSocket } = require("ws");
  neonConfig.webSocketConstructor = WebSocket;
}

// DRY RUN can be toggled via env (defaults to false)
const DRY_RUN = String(process.env.DRY_RUN || "false").toLowerCase() === "true";

type TagCategory = "appearance" | "physical" | "age" | "personality" | "style" | "other";

interface TagSeed {
  name: string; // lowercase unique name (used as id too)
  category: TagCategory;
  isVisible: boolean; // whether to show in UI filters
  sortOrder: number; // ordering within category
}

function buildPredefinedTags(): TagSeed[] {
  // NOTE: SPEC contained duplicate names (e.g., "elegant", "casual") across categories.
  // Since `name` is globally unique, we assign them to the most appropriate category (style)
  // and omit duplicates from other categories to preserve uniqueness.

  const categories: Record<TagCategory, string[]> = {
    appearance: [
      "blue-eyes",
      "green-eyes",
      "brown-eyes",
      "hazel-eyes",
      "long-hair",
      "short-hair",
      "blonde-hair",
      "brunette",
      "redhead",
      "pale-skin",
      "tan-skin",
      "dark-skin",
    ],
    physical: [
      "slim",
      "fit",
      "curvy",
      "petite",
      "tall",
      "athletic",
      // "elegant",  // moved to style
      // "casual",   // moved to style
    ],
    age: [
      "young",
      "mature",
      "teen",
      "adult",
      "middle-aged",
    ],
    personality: [
      "sweet",
      "confident",
      "shy",
      "outgoing",
      "mysterious",
      "playful",
      "serious",
      "caring",
      "independent",
      "annoying",
    ],
    style: [
      "sexy",
      "cute",
      "elegant",
      "casual",
      "gothic",
      "dark",
      "romantic",
      "adventurous",
      "intellectual",
    ],
    other: [
      "fantasy",
      "modern",
      "historical",
      "sci-fi",
      "professional",
      "student",
      "artist",
    ],
  };

  const seen = new Set<string>();
  const result: TagSeed[] = [];

  (Object.keys(categories) as TagCategory[]).forEach((category) => {
    const names = categories[category];
    names.forEach((name, idx) => {
      if (typeof name !== "string" || !name.trim()) return;
      const lower = name.trim().toLowerCase();
      if (seen.has(lower)) return; // dedupe globally by name
      seen.add(lower);

      result.push({
        name: lower,
        category,
        isVisible: category !== "other",
        sortOrder: idx, // stable within category
      });
    });
  });

  return result;
}

async function main() {
  console.log("🚀 Seeding predefined tags...\n");

  // Validate environment
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set in environment variables");
  }
  console.log("✅ DATABASE_URL is set\n");

  const db = drizzle(process.env.DATABASE_URL!);

  // Build tag records
  const tagSeeds = buildPredefinedTags();
  console.log(`📦 Prepared ${tagSeeds.length} tags to upsert`);

  // Preview sample
  console.log("\n🔎 Sample (first 10):");
  tagSeeds.slice(0, 10).forEach((t, i) =>
    console.log(
      `  ${String(i + 1).padStart(2, "0")}. ${t.name} [${t.category}] visible=${t.isVisible} order=${t.sortOrder}`
    )
  );

  if (DRY_RUN) {
    console.log("\n🧪 DRY RUN ENABLED — no database writes will be performed");
    console.log("💡 Set DRY_RUN=false (env) to actually seed the tags\n");
    return;
  }

  // Upsert in a single statement — conflict on unique(name)
  // Use EXCLUDED values to update per-row fields when a conflict occurs
  await db
    .insert(tags)
    .values(
      tagSeeds.map((t) => ({
        id: t.name, // use name as stable primary key
        name: t.name,
        category: t.category,
        isVisible: t.isVisible,
        sortOrder: t.sortOrder,
      }))
    )
    .onConflictDoUpdate({
      target: tags.name,
      set: {
        category: sql`excluded.category`,
        isVisible: sql`excluded.is_visible`,
        sortOrder: sql`excluded.sort_order`,
      },
    });

  console.log("\n✅ Tags seeded successfully (idempotent upsert)");
}

main().catch((err) => {
  console.error("❌ Failed to seed tags:", err?.message || err);
  process.exitCode = 1;
});