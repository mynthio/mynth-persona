import { config } from 'dotenv';
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"] });

console.log(process.env.DATABASE_URL);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
