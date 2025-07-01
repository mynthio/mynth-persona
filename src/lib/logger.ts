import pino, { Logger } from "pino";

// Prevent tree-shaking
import "@logtail/pino";

export const logger: Logger =
  process.env.VERCEL_ENV === "production"
    ? // JSON in production, only on Vercel
      pino(
        pino.transport({
          target: "@logtail/pino",
          options: {
            sourceToken: process.env.BETTER_STACK_LOGS_SOURCE_TOKEN!,
            options: {
              endpoint: `https://${process.env.BETTER_STACK_LOGS_INGESTING_HOST}`,
            },
          },
          level: "debug",
        })
      )
    : // Pretty print in development
      pino({
        level: "debug",
      });
