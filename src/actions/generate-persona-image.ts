"use server";

import { auth } from "@clerk/nextjs/server";
import "server-only";
import { tasks } from "@trigger.dev/sdk";
import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { generatePersonaImageTask } from "@/trigger/generate-persona-image.task";
import { ImageStyle } from "@/types/image-generation/image-style.type";
import { ShotType } from "@/types/image-generation/shot-type.type";
import { ImageGenerationQuality } from "@/types/image-generation/image-generation-quality.type";
import { PersonaWithVersion } from "@/types/persona.type";
import { burnSparks } from "@/services/sparks/sparks.service";

// Quality-based cost configuration
const QUALITY_COSTS: Record<ImageGenerationQuality, number> = {
  low: 1,
  medium: 3,
  high: 5,
};

type GeneratePersonaImageSettings = {
  quality: ImageGenerationQuality;
  style: ImageStyle;
  shotType: ShotType;
  nsfw?: boolean;
  userNote?: string;
};

export const generatePersonaImage = async (
  personaId: string,
  settings: GeneratePersonaImageSettings
) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const persona = await db.query.personas.findFirst({
    where: and(
      eq(personas.id, personaId),
      eq(personas.userId, userId),
      ne(personas.visibility, "deleted")
    ),
    with: {
      currentVersion: true,
    },
  });

  if (!persona) {
    throw new Error("Persona not found");
  }

  if (!persona.currentVersion) {
    throw new Error("Persona has no current version");
  }

  // Calculate cost based on quality
  const cost = QUALITY_COSTS[settings.quality];

  const canUserExecuteAction = await burnSparks({
    userId,
    amount: cost,
  });

  if (canUserExecuteAction.success === false) {
    throw new Error(canUserExecuteAction.error || "Not enough tokens");
  }

  const taskHandle = await tasks.trigger<typeof generatePersonaImageTask>(
    "generate-persona-image",
    {
      persona: {
        ...persona,
        version: persona.currentVersion as PersonaWithVersion["version"],
      },
      userId,
      cost,

      quality: settings.quality,
      style: settings.style,
      shotType: settings.shotType,
      nsfw: settings.nsfw || false,
      userNote: settings.userNote || "",
    }
  );

  return {
    taskId: taskHandle.id,
    publicAccessToken: taskHandle.publicAccessToken,
    cost,
    remainingBalance: canUserExecuteAction.sparksAfter,
    balance: { balance: canUserExecuteAction.sparksAfter },
  };
};
