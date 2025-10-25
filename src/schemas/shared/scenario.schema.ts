import { z } from "zod";

/**
 * Starting message schema for scenarios
 */
export const startingMessageSchema = z.object({
  role: z.enum(["user", "persona"]),
  text: z
    .string()
    .min(1, "Message content cannot be empty")
    .max(5000, "Message is too long (maximum 5,000 characters)"),
});

export type StartingMessage = z.infer<typeof startingMessageSchema>;

/**
 * Starting messages array schema
 * Validates that there are no more than 6 starting messages
 */
export const startingMessagesSchema = z
  .array(startingMessageSchema)
  .max(6, "Maximum 6 starting messages allowed");

export type StartingMessages = z.infer<typeof startingMessagesSchema>;

/**
 * Base scenario form fields validation
 * Shared between client and server
 */
export const scenarioFormFieldsSchema = z.object({
  // Required: Scenario content with meaningful minimum size (~10 words = ~50 chars)
  content: z
    .string()
    .min(
      50,
      "Scenario content must be at least 50 characters (approximately 10 words)"
    )
    .max(100000, "Scenario content is too long (maximum 100,000 characters)"),

  // Optional fields
  title: z.string().optional(),
  description: z.string().optional(),
  suggested_user_name: z.string().optional(),

  // User character: min ~5 words = ~25 chars when provided
  user_persona_text: z
    .string()
    .min(
      25,
      "User character must be at least 25 characters (approximately 5 words)"
    )
    .max(50000, "User character is too long (maximum 50,000 characters)")
    .optional()
    .or(z.literal("")),

  // Style guidelines: shorter than scenario content
  style_guidelines: z
    .string()
    .max(50000, "Style guidelines are too long (maximum 50,000 characters)")
    .optional()
    .or(z.literal("")),
});

export type ScenarioFormFields = z.infer<typeof scenarioFormFieldsSchema>;

/**
 * Publish scenario form fields validation - Manual mode
 * Requires title and description when user provides them manually
 */
export const publishScenarioFormManualSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title is too long (maximum 200 characters)"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description is too long (maximum 1,000 characters)"),
  anonymous: z.boolean().default(false),
  aiGenerate: z.literal(false),
});

/**
 * Publish scenario form fields validation - AI generation mode
 * Title and description are optional when AI generates them
 */
export const publishScenarioFormAiSchema = z.object({
  title: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  anonymous: z.boolean().default(false),
  aiGenerate: z.literal(true),
});

/**
 * Combined publish scenario form schema
 * Validates based on whether AI generation is enabled
 */
export const publishScenarioFormSchema = z.discriminatedUnion("aiGenerate", [
  publishScenarioFormManualSchema,
  publishScenarioFormAiSchema,
]);

export type PublishScenarioForm = z.infer<typeof publishScenarioFormSchema>;

/**
 * Scenario content schema - defines the structure of the JSONB content column
 * This is the actual content stored in the database scenarios.content field
 */
export const scenarioContentSchema = z.object({
  scenario_text: z.string(),
  user_persona_text: z.string().optional(),
  suggested_user_name: z.string().optional(),
  starting_messages: z.array(startingMessageSchema).optional(),
  style_guidelines: z.string().optional(),
  system_prompt_override: z.string().optional(),
});

export type ScenarioContent = z.infer<typeof scenarioContentSchema>;
