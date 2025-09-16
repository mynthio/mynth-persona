import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"], quiet: true });

const url =
  process.env.NODE_ENV === "production"
    ? process.env.DATABASE_URL
    : process.env.LOCAL_DATABASE_URL;

if (!url)
  throw new Error(
    `Connection string to ${
      process.env.NODE_ENV ? "Neon" : "local"
    } Postgres not found.`
  );

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
