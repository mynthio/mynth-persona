import "server-only";

import { config } from "dotenv";
// import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle } from "drizzle-orm/node-postgres";

config({ path: [".env.local", ".env"] });

export const db = drizzle(process.env.DATABASE_URL!);
