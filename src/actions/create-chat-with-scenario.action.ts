"use server";

import "server-only";

import { logger } from "@/lib/logger";
import { generateRoleplaySummary } from "@/services/persona/roleplay-summary.service";
import { db } from "@/db/drizzle";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { PersonaData, PersonaVersionRoleplayData } from "@/schemas";
import { updatePersonaVersionRoleplayData } from "@/services/persona/update-roleplay-data.service";
import { DEFAULT_CHAT_MODEL } from "@/config/shared/chat/chat-models.config";
import { nanoid } from "nanoid";
import { chatPersonas, chats, messages } from "@/db/schema";
import {
  ChatSettings,
  ChatSettingsScenario,
} from "@/schemas/backend/chats/chat.schema";
import { trackChatCreated } from "@/lib/logsnag";
import { after } from "next/server";
import {
  createChatWithScenarioPayloadSchema,
  CreateChatWithScenarioPayload,
} from "@/schemas/backend";
import { ScenarioContent } from "@/schemas/shared/scenario.schema";
import { and, eq, isNull, or } from "drizzle-orm";
import { replacePlaceholders } from "@/lib/replace-placeholders";

export const createChatWithScenarioAction = async (
  payload: CreateChatWithScenarioPayload
) => {
  const { userId } = await auth.protect();

  // Validate payload
  const validatedData =
    await createChatWithScenarioPayloadSchema.parseAsync(payload);

  // Read scenario and verify access
  const scenario = await db.query.scenarios.findFirst({
    where: (scenariosTable, { eq, and, or }) =>
      and(
        eq(scenariosTable.id, validatedData.scenarioId),
        isNull(scenariosTable.deletedAt), // Scenario cannot be deleted
        or(
          eq(scenariosTable.visibility, "public"), // Scenario is public
          eq(scenariosTable.creatorId, userId) // User is the creator
        )
      ),
    columns: {
      id: true,
      title: true,
      content: true,
      visibility: true,
    },
  });

  if (!scenario) {
    throw new Error("Scenario not found or you don't have access to it");
  }

  // Cast scenario content to typed object
  const scenarioContent = scenario.content as ScenarioContent;

  // Verify persona access (same logic as createChatAction)
  const persona = await db.query.personas.findFirst({
    where: (personasTable, { eq, and, or }) =>
      or(
        and(
          eq(personasTable.id, validatedData.personaId),
          eq(personasTable.userId, userId),
          eq(personasTable.visibility, "private")
        ),
        and(
          eq(personasTable.id, validatedData.personaId),
          eq(personasTable.visibility, "public")
        )
      ),
    columns: {
      id: true,
      visibility: true,
      publicVersionId: true,
      currentVersionId: true,
    },
  });

  if (!persona) notFound();
  if (persona.visibility === "public" && !persona.publicVersionId) {
    notFound();
  }
  if (persona.visibility === "private" && !persona.currentVersionId) {
    notFound();
  }

  // Get persona version
  const version = await db.query.personaVersions
    .findFirst({
      where: (table, { eq }) =>
        eq(
          table.id,
          persona.visibility === "public"
            ? persona.publicVersionId!
            : persona.currentVersionId!
        ),
      columns: {
        id: true,
        data: true,
        roleplayData: true,
      },
    })
    .then(
      (version) =>
        version as {
          id: string;
          data: PersonaData;
          roleplayData?: PersonaVersionRoleplayData;
        }
    );

  const rolePlayData = version.roleplayData;

  if (!rolePlayData) {
    /**
     * We need to generate persona role-play data first if it doesn't exist
     */
    logger.debug(
      {
        personaId: version.id,
      },
      "Missing Persona Roleplay Data. Generating and Updating."
    );

    const { summary } = await generateRoleplaySummary(version.data);
    await updatePersonaVersionRoleplayData({
      personaVersionId: version.id,
      personaData: version.data,
      summary,
    });
  } else {
    logger.debug({ rolePlayData });
  }

  const modelId = DEFAULT_CHAT_MODEL;

  // Build chat settings with scenario content
  const chatSettingsScenario: ChatSettingsScenario = {
    scenarioId: scenario.id,
    scenario_text: scenarioContent.scenario_text,
    starting_messages: scenarioContent.starting_messages,
    style_guidelines: scenarioContent.style_guidelines,
    system_prompt_override: scenarioContent.system_prompt_override,
  };

  const chatSettings: ChatSettings = {
    model: modelId,
    scenario: chatSettingsScenario,
  };

  // Copy user persona from scenario to chat settings (if defined)
  if (scenarioContent.user_persona_text) {
    chatSettings.user_persona = {
      enabled: true,
      name: scenarioContent.suggested_user_name || "User",
      character: scenarioContent.user_persona_text,
    };
  }

  // Check if scenario has starting messages
  const hasStartingMessages =
    scenarioContent.starting_messages &&
    scenarioContent.starting_messages.length > 0;

  // Prepare placeholder replacement context
  const userName = chatSettings.user_persona?.name;
  const personaName = version.data.name;

  let chatId: string;

  if (hasStartingMessages) {
    // Create chat with messages in transaction
    const result = await db.transaction(async (tx) => {
      const chatId = `pch_${nanoid()}`;

      // Create chat
      await tx.insert(chats).values({
        id: chatId,
        title: scenario.title,
        userId,
        mode: "roleplay",
        settings: chatSettings,
      });

      // Link persona to chat
      await tx.insert(chatPersonas).values({
        chatId,
        personaId: validatedData.personaId,
        personaVersionId: version.id,
      });

      // Insert starting messages with placeholder replacement
      const messageValues = scenarioContent.starting_messages!.map(
        (msg, index) => ({
          id: `msg_${nanoid()}`,
          chatId,
          role: msg.role === "user" ? "user" : "assistant",
          parts: [
            {
              type: "text" as const,
              text: replacePlaceholders(msg.text, { userName, personaName }),
            },
          ],
          parentId: null, // Starting messages have no parent
          metadata: null,
        })
      );

      await tx.insert(messages).values(messageValues);

      return { chatId };
    });

    chatId = result.chatId;
  } else {
    // Create chat without messages
    chatId = `pch_${nanoid()}`;

    await db.insert(chats).values({
      id: chatId,
      title: scenario.title,
      userId,
      mode: "roleplay",
      settings: chatSettings,
    });

    await db.insert(chatPersonas).values({
      chatId,
      personaId: validatedData.personaId,
      personaVersionId: version.id,
    });
  }

  after(async () => {
    await trackChatCreated({ userId, chatId, modelId });
  });

  return {
    id: chatId,
    title: scenario.title,
    mode: "roleplay" as const,
  };
};
