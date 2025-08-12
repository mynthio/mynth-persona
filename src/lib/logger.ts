import pino, { Logger } from "pino";

// Prevent tree-shaking
import "@axiomhq/pino";

import "@logtail/pino";

const isProduction =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";

export const logger: Logger = isProduction
  ? pino(
      { level: "info" },
      pino.transport({
        target: "@axiomhq/pino",
        options: {
          dataset: process.env.AXIOM_DATASET,
          token: process.env.AXIOM_TOKEN,
        },
      })
    )
  : pino({
      level: "debug",
    });
