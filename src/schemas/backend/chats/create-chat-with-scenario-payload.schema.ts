import { z } from "zod";

/**
 * Payload schema for creating a chat with a scenario
 * Requires both personaId and scenarioId
 */
export const createChatWithScenarioPayloadSchema = z.object({
  personaId: z.string().min(1, "Persona ID is required"),
  scenarioId: z.string().startsWith("scn_", "Invalid scenario ID format"),
});

export type CreateChatWithScenarioPayload = z.infer<
  typeof createChatWithScenarioPayloadSchema
>;
