import { z } from "zod";
import {
  scenarioFormFieldsSchema,
  startingMessagesSchema,
} from "@/schemas/shared/scenario.schema";
import { textGenerationModels } from "@/config/shared/models/text-generation-models.config";

// Get valid model IDs for validation
const validModelIds = Object.keys(textGenerationModels);

/**
 * Persona reference schema for scenarios
 */
const scenarioPersonaSchema = z.object({
  id: z.string().min(1, "Persona ID is required"),
  roleType: z.enum(["primary", "secondary"]),
});

/**
 * Suggested AI models validation
 */
const suggestedModelsSchema = z.array(
  z.enum(validModelIds as [string, ...string[]])
);

/**
 * Transformed starting message schema for database storage
 * Converts "persona" role to "assistant" for API compatibility
 */
const transformedStartingMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1).max(5000),
});

/**
 * Complete create scenario payload schema
 * Used for server-side validation
 */
export const createScenarioPayloadSchema = scenarioFormFieldsSchema.extend({
  personas: z
    .array(scenarioPersonaSchema)
    .max(10, "Maximum 10 personas allowed per scenario")
    .optional()
    .default([]),
  startingMessages: z
    .array(transformedStartingMessageSchema)
    .max(6, "Maximum 6 starting messages allowed")
    .optional()
    .default([]),
  suggestedAiModels: suggestedModelsSchema.optional().default([]),
});

export type CreateScenarioPayload = z.infer<
  typeof createScenarioPayloadSchema
>;

export type ScenarioPersona = z.infer<typeof scenarioPersonaSchema>;
