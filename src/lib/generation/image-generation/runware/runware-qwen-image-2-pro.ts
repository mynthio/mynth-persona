import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_QWEN_IMAGE_2_PRO_ID = "runware/qwen-image-2.0-pro" as const;
const QWEN_IMAGE_2_PRO_MODEL_ID = "alibaba/qwen-image-2.0-pro" as const;

export class RunwareQwenImage2Pro extends RunwareImageGenerationBase {
  protected readonly MODEL_ID = QWEN_IMAGE_2_PRO_MODEL_ID;

  protected readonly INTERNAL_ID = RUNWARE_QWEN_IMAGE_2_PRO_ID;

  protected readonly DISPLAY_NAME = "Qwen Image 2.0 Pro";

  protected readonly RUNWARE_MODEL_ID = "alibaba:qwen-image@2.0-pro" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1344;
  }
}
