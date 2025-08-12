import pino, { Logger } from "pino";

// Prevent tree-shaking
// import "@axiomhq/pino";

export const logger: Logger =
  process.env.VERCEL_ENV !== "production"
    ? // JSON in production, only on Vercel
      pino(
        { level: "info" },
        pino.transport({
          target: "@axiomhq/pino",
          options: {
            dataset: process.env.AXIOM_DATASET,
            token: process.env.AXIOM_TOKEN,
          },
        })
      )
    : // Pretty print in development
      pino({
        level: "debug",
      });
