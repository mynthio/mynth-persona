import { z } from "zod";
import { publishScenarioFormSchema } from "@/schemas/shared/scenario.schema";

/**
 * Complete publish scenario payload schema
 * Used for server-side validation
 * Extends the publishScenarioFormSchema with scenarioId
 */
export const publishScenarioPayloadSchema = publishScenarioFormSchema.and(
  z.object({
    scenarioId: z.string().min(1, "Scenario ID is required"),
  })
);

export type PublishScenarioPayload = z.infer<
  typeof publishScenarioPayloadSchema
>;
