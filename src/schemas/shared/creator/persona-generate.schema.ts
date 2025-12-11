import z from "zod";

export const creatorPersonaGenerateSchema = z.object({
  title: z.string().describe("Short, one-line persona title."),
  note_for_user: z
    .string()
    .optional()
    .nullable()
    .describe(
      "Optional short note for the user: how you approached the prompt and suggested follow-ups. Keep it brief and actionable. One sentence only."
    ),
  name: z.string().describe("Character's full name or alias."),
  age: z
    .preprocess(
      (val) => (typeof val === "number" ? String(val) : val),
      z.union([z.string(), z.number()])
    )
    .describe(
      "Character's age. Use number. Only if age is unkown, use 'unknown' or max 3 sentence to describe age."
    ),
  gender: z
    .union([z.literal("male"), z.literal("female"), z.literal("other")])
    .describe("Character's gender."),
  summary: z
    .string()
    .describe("Short, concise 1 sentence summary of the character."),
  appearance: z
    .string()
    .describe("Character's appearance and visual description."),
  personality: z
    .string()
    .describe("Character's personality and behavioral traits."),
  background: z.string().describe("Character's background and history."),
  speakingStyle: z
    .string()
    .describe(
      "Character's speaking style, mannerisms, and communication patterns."
    ),
  occupation: z
    .string()
    .nullable()
    .optional()
    .describe("Character's occupation and work."),
  extensions: z.preprocess((value) => {
    // If value is not an object, omit the field entirely
    if (!value || typeof value !== "object" || value === null) {
      return undefined;
    }

    return value;
  }, z.record(z.string(), z.string()).nullable().optional().describe("Add ONLY if the user's prompt explicitly implies unique aspects as key-value pairs (e.g., {'skills': 'hacking, stealth'}, {'universe': 'cyberpunk'}). Keep to a focused 2–5 keys. Omit the field entirely if not needed.")),
});

export type CreatorPersonaGenerate = z.infer<
  typeof creatorPersonaGenerateSchema
>;
