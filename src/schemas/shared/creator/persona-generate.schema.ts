import z from "zod/v4";

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
    .describe("Character's age."),
  gender: z
    .union([z.literal("male"), z.literal("female"), z.literal("other")])
    .describe("Character's gender."),
  summary: z
    .string()
    .describe(
      "Concise 1–2 sentence overview capturing only the essence. Single paragraph, no line breaks or lists. Do NOT include appearance, personality, or background details."
    ),
  appearance: z
    .string()
    .describe(
      "Purely visual and stylistic description for imagining or image generation: physique/build, facial structure/features, eyes, skin, hair, posture, wardrobe/style, color palette, materials/textures, accessories, and distinctive marks. Avoid personality or backstory."
    ),
  personality: z
    .string()
    .describe(
      "Behavioral traits and temperament: how they speak and behave; motivations, strengths, flaws, quirks, and interaction style. Avoid physical details and history."
    ),
  background: z
    .string()
    .describe(
      "Origin and history: upbringing, environment, formative events, training/skills learned, and how they became who they are. Avoid physical description."
    ),
  occupation: z
    .string()
    .nullable()
    .optional()
    .describe(
      "What they do for work/role in society. Can include secret occupations."
    ),
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
