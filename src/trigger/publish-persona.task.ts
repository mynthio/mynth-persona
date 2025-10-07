import { db } from "@/db/drizzle";
import { personas, personaVersions, personaTags, tags } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import slugify from "slugify";

import { logAiSdkUsage, logger } from "@/lib/logger";
import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { generateObject } from "ai";
import {
  getDefaultPromptDefinitionForMode,
  getDefaultUserPromptDefinitionForMode,
} from "@/lib/prompts/registry";
import { personaDataSchema } from "@/schemas";
import logsnag from "@/lib/logsnag";

const PublishPersonaPayloadSchema = z.object({
  personaId: z.string(),
  versionId: z.string(),
  userId: z.string(),
  force: z
    .boolean()
    .default(false)
    .describe("Force update of published version"),
});

export const publishPersonaTask = schemaTask({
  id: "publish-persona",
  maxDuration: 300,
  retry: { maxAttempts: 1 },
  schema: PublishPersonaPayloadSchema,
  run: async (payload, { ctx }) => {
    try {
      const { personaId, versionId, userId, force } = payload;

      const { persona, version, profileImage } = await db.query.personas
        .findFirst({
          where: and(
            eq(personas.id, personaId),
            eq(personas.userId, userId),
            ne(personas.visibility, "deleted")
          ),
          columns: {
            id: true,
            visibility: true,
            userId: true,
          },
          with: {
            versions: {
              where: eq(personaVersions.id, versionId),
              limit: 1,
              columns: {
                id: true,
                data: true,
              },
            },
            profileImage: {
              columns: {
                id: true,
                isNSFW: true,
              },
            },
          },
        })
        .then((res) => {
          logger.debug({
            persona: res,
          });
          return {
            persona: res,
            version: res?.versions?.[0],
            profileImage: res?.profileImage,
          };
        });

      if (!persona || !version) {
        throw new Error("Persona or version not found");
      }

      if (persona.visibility === "deleted") {
        throw new Error("Persona is deleted");
      }

      if (!force && persona.visibility === "public") {
        throw new Error("Persona is already public");
      }

      const personaData = personaDataSchema.parse(version.data);

      const system = getDefaultPromptDefinitionForMode(
        "persona",
        "publish"
      ).render();

      const prompt = getDefaultUserPromptDefinitionForMode(
        "persona",
        "publish"
      ).render({
        persona: personaData,
      });

      const openrouter = getOpenRouter();
      const model = openrouter("openai/gpt-5-mini");

      const promptResult = await generateObject({
        schema: z.object({
          allow: z.boolean().describe("Allow the persona to be published"),
          headline: z
            .string()
            .describe("Headline, one sentence, something catchy and engaging"),
          nsfwRating: z.enum(["sfw", "suggestive", "explicit"]),
          gender: z.enum(["male", "female", "other"]),
          ageBucket: z.enum([
            "unknown",
            "0-5",
            "6-12",
            "13-17",
            "18-24",
            "25-34",
            "35-44",
            "45-54",
            "55-64",
            "65-plus",
          ]),
          tags: z
            .array(
              z.object({
                tag: z.string(),
                category: z.enum([
                  "appearance",
                  "personality",
                  "physical",
                  "age",
                  "style",
                  "other",
                ]),
              })
            )
            .describe(
              "Prefer known general tags (see system prompt); lowercase; hyphens allowed. Use the predefined tags when they fit; you may add additional custom tags if a relevant concept isn’t covered by the known list. Add as many relevant tags as needed and place each under the best-fitting category. Avoid duplicates."
            ),
        }),
        model,
        system,
        prompt,
      });

      logAiSdkUsage(promptResult, {
        component: "generation:text:complete",
        useCase: "scene_image_prompt_generation",
      });

      // If model signals disallow, mark as failed and emit LogSnag event (no user data)
      if (!promptResult.object.allow) {
        // Temporary disable this and the team will manually double-check based on logsnag event

        // await db
        //   .update(personas)
        //   .set({
        //     lastPublishAttempt: {
        //       status: "failed",
        //       attemptedAt: new Date().toISOString(),
        //       runId: ctx.run.id,
        //       error: "disallowed_by_model",
        //     },
        //   })
        //   .where(eq(personas.id, personaId));

        await logsnag
          .track({
            channel: "personas",
            event: "persona-publish-warning",
            icon: "🚫",
            tags: { personaId, versionId } as any,
          })
          .catch(() => {});

        // return;
      }

      // Create a stable slug: slugify the text parts, then append a lowercase alphanumeric ID
      const baseSlug = slugify(
        `${personaData.name}-${promptResult.object.headline}`,
        {
          lower: true,
          strict: true,
        }
      );
      const genId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);
      const slug = `${baseSlug}-${genId()}`;

      logger.debug({
        result: promptResult.object,
        slug,
      });

      const resultTags = promptResult.object.tags;

      // Insert into DB
      await db.transaction(async (tx) => {
        if (resultTags.length === 0) return;

        // Dedupe on name just in case
        const byName = new Map<string, (typeof resultTags)[number]>();
        resultTags.forEach((t, i) => {
          if (!byName.has(t.tag)) byName.set(t.tag, { ...t, _sort: i } as any);
        });
        const uniqueTags = Array.from(byName.values());

        await tx
          .insert(tags)
          .values(
            uniqueTags.map((t: any) => ({
              id: t.tag, // if your PK is the name
              name: t.tag,
              category: t.category,
              isVisible: false,
            }))
          )
          .onConflictDoNothing({ target: tags.name });

        await tx
          .insert(personaTags)
          .values(
            uniqueTags.map((t: any) => ({
              personaId,
              tagId: t.tag,
              confidence: 50,
            }))
          )
          .onConflictDoNothing({
            target: [personaTags.personaId, personaTags.tagId],
          });

        const nsfwRating = profileImage?.isNSFW
          ? "explicit"
          : promptResult.object.nsfwRating;

        await tx
          .update(personas)
          .set({
            visibility: "public",
            ageBucket: promptResult.object.ageBucket,
            headline: promptResult.object.headline,
            nsfwRating,
            slug,
            publicName: personaData.name,
            publicVersionId: versionId,
            gender: promptResult.object.gender,
            publishedAt: new Date(),

            lastPublishAttempt: {
              status: "success",
              attemptedAt: new Date().toISOString(),
              runId: ctx.run.id,
            },
          })
          .where(eq(personas.id, personaId));
      });

      // Failsafe LogSnag event on success (no user data)
      await logsnag
        .track({
          channel: "personas",
          event: "persona-published",
          icon: "✅",
          tags: { personaId, versionId } as any,
        })
        .catch(() => {});
    } catch (error) {
      logger.error({ error }, "Failed to publish persona");

      // Best-effort status update and LogSnag event; avoid user data in logs
      try {
        const { personaId, versionId } = payload as any;
        await db
          .update(personas)
          .set({
            lastPublishAttempt: {
              status: "failed",
              attemptedAt: new Date().toISOString(),
              runId: ctx.run.id,
              error: (error as any)?.message?.slice(0, 300) || "unknown_error",
            },
          })
          .where(eq(personas.id, personaId));

        await logsnag
          .track({
            channel: "personas",
            event: "persona-publish-failed",
            icon: "🚨",
            tags: { personaId, versionId } as any,
          })
          .catch(() => {});
      } catch {
        // ignore secondary failures
      }

      throw error;
    }
  },
});
