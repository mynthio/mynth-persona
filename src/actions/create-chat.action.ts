"use server";

import "server-only";

import { logger } from "@/lib/logger";
import { generateRoleplaySummary } from "@/services/persona/roleplay-summary.service";
import { db } from "@/db/drizzle";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { PersonaData, PersonaVersionRoleplayData } from "@/schemas";
import { updatePersonaVersionRoleplayData } from "@/services/persona/update-roleplay-data.service";
import { DEFAULT_CHAT_MODEL } from "@/config/shared/chat/chat-models.config";
import { nanoid } from "nanoid";
import { chatPersonas, chats } from "@/db/schema";
import { ChatSettings } from "@/schemas/backend/chats/chat.schema";

export const createChatAction = async (personaId: string) => {
  const { userId } = await auth.protect();

  const persona = await db.query.personas.findFirst({
    where: (personasTable, { eq, and, or }) =>
      or(
        and(
          eq(personasTable.id, personaId),
          eq(personasTable.userId, userId),
          eq(personasTable.visibility, "private")
        ),
        and(
          eq(personasTable.id, personaId),
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
     * We need to generate persona role-play data first if it doesn't exists
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

  const { chatId } = await db.transaction(async (tx) => {
    const chatId = `pch_${nanoid()}`;

    await db.insert(chats).values({
      id: chatId,
      title: `${version.data.name} Chat`,
      userId,
      mode: "roleplay",
      settings: {
        model: modelId,
      } satisfies ChatSettings,
    });

    await db.insert(chatPersonas).values({
      chatId,
      personaId,
      personaVersionId: version.id,
    });

    return { chatId };
  });

  redirect(`/chats/${chatId}`);
};
