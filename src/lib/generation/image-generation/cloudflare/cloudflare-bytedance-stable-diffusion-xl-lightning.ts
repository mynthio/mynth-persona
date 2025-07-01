import { nanoid } from "nanoid";
import sharp from "sharp";
import { db } from "@/db/drizzle";
import { images } from "@/db/schema";
import {
  ImageGenerationBase,
  ImageGenerationResult,
} from "../image-generation-base";

export class CloudflareBytedanceStableDiffusionXLLightning extends ImageGenerationBase {
  static ID = "@cf/bytedance/stable-diffusion-xl-lightning";

  async generate(prompt: string): Promise<ImageGenerationResult> {
    const result = await fetch(
      `https://gateway.ai.cloudflare.com/v1/${process.env.CLOUDFLARE_ACCOUNT_ID}/${process.env.CLOUDFLARE_GATEWAY_NAME}/workers-ai/${CloudflareBytedanceStableDiffusionXLLightning.ID}`,
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
