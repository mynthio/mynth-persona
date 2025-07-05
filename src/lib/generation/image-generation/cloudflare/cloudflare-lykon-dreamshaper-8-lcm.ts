import {
  ImageGenerationBase,
  ImageGenerationResult,
} from "../image-generation-base";

export const CLOUDFLARE_DREAMSHAPER_8_LCM_ID =
  "@cf/lykon/dreamshaper-8-lcm" as const;
export const DREAMSHAPER_8_LCM_MODEL_ID = "lykon/dreamshaper-8-lcm" as const;

export class CloudflareLykonDreamshaper8Lcm extends ImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = DREAMSHAPER_8_LCM_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = CLOUDFLARE_DREAMSHAPER_8_LCM_ID;

  // Provider-specific model ID (private)
  private static readonly CLOUDFLARE_MODEL_ID =
    "@cf/lykon/dreamshaper-8-lcm" as const;

  async generate(prompt: string): Promise<ImageGenerationResult> {
    const result = await fetch(
      `https://gateway.ai.cloudflare.com/v1/${process.env.CLOUDFLARE_ACCOUNT_ID}/${process.env.CLOUDFLARE_GATEWAY_NAME}/workers-ai/${CloudflareLykonDreamshaper8Lcm.CLOUDFLARE_MODEL_ID}`,
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
