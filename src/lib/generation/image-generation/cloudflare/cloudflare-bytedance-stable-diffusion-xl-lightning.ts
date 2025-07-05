import { nanoid } from "nanoid";
import sharp from "sharp";
import { db } from "@/db/drizzle";
import { images } from "@/db/schema";
import {
  ImageGenerationBase,
  ImageGenerationResult,
} from "../image-generation-base";

export const CLOUDFLARE_STABLE_DIFFUSION_XL_LIGHTNING_ID =
  "@cf/bytedance/stable-diffusion-xl-lightning" as const;
export const STABLE_DIFFUSION_XL_LIGHTNING_MODEL_ID =
  "bytedance/stable-diffusion-xl-lightning" as const;

export class CloudflareBytedanceStableDiffusionXLLightning extends ImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = STABLE_DIFFUSION_XL_LIGHTNING_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = CLOUDFLARE_STABLE_DIFFUSION_XL_LIGHTNING_ID;

  // Provider-specific model ID (private)
  private static readonly CLOUDFLARE_MODEL_ID =
    "@cf/bytedance/stable-diffusion-xl-lightning" as const;

  async generate(prompt: string): Promise<ImageGenerationResult> {
    const result = await fetch(
      `https://gateway.ai.cloudflare.com/v1/${process.env.CLOUDFLARE_ACCOUNT_ID}/${process.env.CLOUDFLARE_GATEWAY_NAME}/workers-ai/${CloudflareBytedanceStableDiffusionXLLightning.CLOUDFLARE_MODEL_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_WORKERS_AI_API_TOKEN}`,
        },
        body: JSON.stringify({
          prompt,
        }),
      }
    );

    const arrayBuffer = await result.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    return {
      image: imageBuffer,
    };
  }
}
