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
        target: "@logtail/pino",
        options: {
          sourceToken: process.env.BETTER_STACK_LOGS_SOURCE_TOKEN,
          options: {
            endpoint: `https://${process.env.BETTER_STACK_LOGS_INGESTING_HOST}`,
          },
        },
      })
    )
  : pino({
      level: "debug",
    });
