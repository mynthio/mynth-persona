// import "server-only";

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

config({ path: [".env.local", ".env"] });

export const db = drizzle(process.env.DATABASE_URL!, { schema });
