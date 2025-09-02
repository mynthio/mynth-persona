import { db } from "@/db/drizzle";
import { imageGenerations, images } from "@/db/schema";
import { schemaTask, task } from "@trigger.dev/sdk";
import { nanoid } from "nanoid";
import { z } from "zod";

import { ImageGenerationFactory } from "@/lib/generation/image-generation/image-generation-factory";
import { processImage } from "@/lib/image-processing/image-processor";
import { uploadToBunny } from "@/lib/upload";
import { logger, logAiSdkUsage } from "@/lib/logger";
import { getOpenRouter } from "@/lib/generation/text-generation/providers/open-router";
import { generateText } from "ai";

// Zod schema for input validation
const GenerateSceneImageDemoTaskPayloadSchema = z.object({
  characterAppearance: z.string(),
  messageId: z.string(),
  userMessage: z.string(),
  personaId: z.string(),
  userId: z.string(),
  aiMessage: z.string(),
  imageId: z.string(),
});

export const generateSceneImageDemoTask = schemaTask({
  id: "generate-scene-image-demo",
  maxDuration: 300,
  retry: {
    maxAttempts: 1,
  },
  schema: GenerateSceneImageDemoTaskPayloadSchema,

  run: async (payload, { ctx }) => {
    /**
     * Get data from payload
     */
    const {
      characterAppearance,
      aiMessage,
      messageId,
      userMessage,
      personaId,
      userId,
      imageId,
    } = payload;

    // Get the appropriate model based on quality
    let imageGenerationModel = ImageGenerationFactory.byModelId(
      "black-forest-labs/flux-schnell"
    );

    const openrouter = getOpenRouter();
    const model = openrouter("mistralai/mistral-small-3.2-24b-instruct:free");

    const promptResult = await generateText({
      model,
      system:
        "You are a helpful assistant that generates image prompts for a scene. You will receive the user message and a character response. Based on that generate an image prompt that should suit the scene from character's messages. You will be provided with character appearance that you should use when describing how character looks like. Generate prompt that follows natural language, for models like FLUX. Focus on character, while making a prompt. Let's imagine it's user's POV, so we want a full focus on character. Focus on a single image, single shot from the scene. Pick the moment you like, but do not try to make an image of entire scene, just a single shot. Images should always be realistic or semi-realistic. Output the prompt only and nothing else! Plain text only!",
      prompt: `User message: ${userMessage}\nCharacter response: ${aiMessage}\nCharacter: ${characterAppearance}`,
    });

    logAiSdkUsage(promptResult, {
      component: "generation:text:complete",
      useCase: "scene_image_prompt_generation",
    });

    if (!promptResult.text) {
      throw new Error("Failed to generate image prompt");
    }

    // Set resolution based on quality

    const width = 512;
    const height = 512;

    const generateImageResult = await imageGenerationModel.generate(
      promptResult.text,
      {
        width,
        height,
      }
    );

    /**
     * Process Image
     * - Format to webp using same size
     * - Create thumbnail
     */
    const [processedImage, processedThumbnail] = await processImage(
      generateImageResult.image,
      [
        {},
        {
          resize: {
            width: 240,
            height: 240,
            fit: "cover",
            position: "top",
          },
        },
      ]
    );

    // Upload to Bunny.net storage using upload service
    const imageGenerationId = `igg_${nanoid()}`;

    const mainFilePath = `personas/${imageId}.webp`;
    const thumbnailFilePath = `personas/${imageId}_thumb.webp`;

    const uploadMainImage = uploadToBunny(mainFilePath, processedImage);
    const uploadThumbnailImage = uploadToBunny(
      thumbnailFilePath,
      processedThumbnail
    );

    await Promise.all([uploadMainImage, uploadThumbnailImage]);

    const imageUrl = `${process.env.NEXT_PUBLIC_CDN_BASE_URL}/${mainFilePath}`;

    await db.transaction(async (tx) => {
      await tx.insert(images).values({
        id: imageId,
        personaId,
        messageId,
        isNSFW: false,
      });

      await tx.insert(imageGenerations).values({
        id: imageGenerationId,
        aiModel: imageGenerationModel.modelId,

        prompt: promptResult.text,
        userId,
        personaId: personaId,
        settings: {},
        status: "completed",
        completedAt: new Date(),
        imageId: imageId,
        runId: ctx.run.id,
        tokensCost: 0,
      });
    });

    logger.flush();

    return {
      imageUrl,
      imageId,
    };
  },
});
