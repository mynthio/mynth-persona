// import "server-only";

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig } from "@neondatabase/serverless";

import * as schema from "./schema";

config({ path: [".env.local", ".env"] });

// Configure WebSocket for Node.js environments
if (typeof WebSocket === "undefined") {
  const { WebSocket } = require("ws");
  neonConfig.webSocketConstructor = WebSocket;
}

export const db = drizzle(process.env.DATABASE_URL!, { schema });
