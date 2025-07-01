import pino, { Logger } from "pino";

// Prevent tree-shaking
import "@logtail/pino";

const transport = pino.transport({
  target: "@logtail/pino",
  options: {
    sourceToken: process.env.BETTER_STACK_LOGS_SOURCE_TOKEN!,
    options: {
      endpoint: `https://${process.env.BETTER_STACK_LOGS_INGESTING_HOST}`,
    },
  },
  level: "debug",
});

export const logger: Logger =
  process.env["NODE_ENV"] === "production"
    ? // JSON in production
      pino(transport)
    : // Pretty print in development
      pino({
        level: "debug",
      });
