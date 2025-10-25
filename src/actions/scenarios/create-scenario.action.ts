"use server";

import "server-only";

import { db } from "@/db/drizzle";
import { personas, scenarios, scenarioPersonas } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import {
  createScenarioPayloadSchema,
  type CreateScenarioPayload,
} from "@/schemas/backend";
import { nanoid } from "nanoid";

/**
 * Creates a new scenario
 *
 * @param payload - The scenario data
 * @returns The created scenario ID
 * @throws Error if user is not authenticated or validation fails
 */
export async function createScenarioAction(payload: CreateScenarioPayload) {
  // 1. Authenticate user
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not found");
  }

  // 2. Validate input payload
  const validatedData = await createScenarioPayloadSchema.parseAsync(payload);

  // 3. Verify personas exist and user has access to them (single query)
  if (validatedData.personas && validatedData.personas.length > 0) {
    const personaIds = validatedData.personas.map((p) => p.id);

    const accessiblePersonas = await db.query.personas.findMany({
      where: and(
        inArray(personas.id, personaIds),
        ne(personas.visibility, "deleted"),
        or(
          eq(personas.userId, userId), // User owns this persona
          eq(personas.visibility, "public") // Persona is public
        )
      ),
      columns: { id: true },
    });

    // Check if all requested personas are accessible
    if (accessiblePersonas.length !== personaIds.length) {
      throw new Error(
        "One or more personas not found or you don't have access to them"
      );
    }
  }

  // 4. Build content JSONB structure
  const scenarioContent = {
    scenario_text: validatedData.content,
    user_persona_text: validatedData.user_persona_text || "",
    starting_messages: validatedData.startingMessages || [],
    style_guidelines: validatedData.style_guidelines || "",
    system_prompt_override: "",
    suggested_user_name: validatedData.suggested_user_name || "",
  };

  // 5. Create scenario (with or without transaction based on personas)
  const hasPersonas =
    validatedData.personas && validatedData.personas.length > 0;

  if (hasPersonas) {
    // Use transaction when linking personas
    const result = await db.transaction(async (tx) => {
      // Generate scenario ID
      const scenarioId = `scn_${nanoid()}`;

      // Insert scenario
      const [newScenario] = await tx
        .insert(scenarios)
        .values({
          id: scenarioId,
          title: validatedData.title || "Untitled Scenario",
          description: validatedData.description || null,
          content: scenarioContent,
          creatorId: userId,
          visibility: "private",
          status: "community",
          contentRating: "everyone",
          suggestedAiModels: validatedData.suggestedAiModels || null,
        })
        .returning({ id: scenarios.id });

      // Link personas
      const personaValues = validatedData.personas!.map((persona) => ({
        scenarioId: newScenario.id,
        personaId: persona.id,
        roleType:
          persona.roleType === "primary"
            ? ("primary" as const)
            : ("suggested" as const),
        source: "author" as const,
      }));

      await tx.insert(scenarioPersonas).values(personaValues);

      return { id: newScenario.id };
    });

    return {
      success: true,
      scenarioId: result.id,
    };
  } else {
    // Generate scenario ID
    const scenarioId = `scn_${nanoid()}`;

    // Simple insert without transaction when no personas
    const [newScenario] = await db
      .insert(scenarios)
      .values({
        id: scenarioId,
        title: validatedData.title || "Untitled Scenario",
        description: validatedData.description || null,
        content: scenarioContent,
        creatorId: userId,
        visibility: "private",
        status: "community",
        contentRating: "everyone",
        suggestedAiModels: validatedData.suggestedAiModels || null,
      })
      .returning({ id: scenarios.id });

    return {
      success: true,
      scenarioId: newScenario.id,
    };
  }
}
