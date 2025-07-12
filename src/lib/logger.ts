/**
 * Hey there, logger extraordinaire! This is our Pino-powered logging hub for Mynth Persona.
 * In prod (on Vercel), we spit out structured JSON via @logtail/pino – perfect for querying and charting in Better Stack.
 * In dev, it's pretty-printed for easy reading. Debug level all around, but log wisely to avoid spam!
 *
 * Want the full scoop on structured logging? (Think 'who' did 'what', with data and a chill vibe?)
 * Dive into .cursor/rules/logging-guidelines.mdc – it's got examples, best practices, and zero boredom.
 * Pro tip: Log like you're telling a story, not yelling into the void. Keep it fresh, keep it fun! 🚀
 */
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
          level: "info",
        })
      )
    : // Pretty print in development
      pino({
        level: "debug",
      });
