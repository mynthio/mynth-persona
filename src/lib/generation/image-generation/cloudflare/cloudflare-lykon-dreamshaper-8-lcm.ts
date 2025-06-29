import {
  ImageGenerationBase,
  ImageGenerationResult,
} from "../image-generation-base";

export class CloudflareLykonDreamshaper8Lcm extends ImageGenerationBase {
  static ID = "@cf/lykon/dreamshaper-8-lcm";

  async generate(prompt: string): Promise<ImageGenerationResult> {
    const result = await fetch(
      `https://gateway.ai.cloudflare.com/v1/${process.env.CLOUDFLARE_ACCOUNT_ID}/${process.env.CLOUDFLARE_GATEWAY_NAME}/workers-ai/${CloudflareLykonDreamshaper8Lcm.ID}`,
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
