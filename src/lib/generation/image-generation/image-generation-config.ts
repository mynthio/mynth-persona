import { CloudflareLykonDreamshaper8Lcm } from "./cloudflare/cloudflare-lykon-dreamshaper-8-lcm";
import { CloudflareBytedanceStableDiffusionXLLightning } from "./cloudflare/cloudflare-bytedance-stable-diffusion-xl-lightning";
import { ImageGenerationBase } from "./image-generation-base";
import { ImageGenerationConfigModel } from "./types/image-generation-config-model.type";

export const imageGenerationConfig: Array<ImageGenerationConfigModel> = [
  {
    id: CloudflareBytedanceStableDiffusionXLLightning.ID,
    quality: "low",
    isAvailableToFreeUsers: true,
    isDepracated: false,
  },
  {
    id: CloudflareLykonDreamshaper8Lcm.ID,
    quality: "low",
    isAvailableToFreeUsers: true,
    isDepracated: false,
  },
];

export const imageGenerationModels: Record<
  string,
  new () => ImageGenerationBase
> = {
  [CloudflareBytedanceStableDiffusionXLLightning.ID]:
    CloudflareBytedanceStableDiffusionXLLightning,
  [CloudflareLykonDreamshaper8Lcm.ID]: CloudflareLykonDreamshaper8Lcm,
};
