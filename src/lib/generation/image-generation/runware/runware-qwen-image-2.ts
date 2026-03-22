import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_QWEN_IMAGE_2_ID = "runware/qwen-image-2.0" as const;
const QWEN_IMAGE_2_MODEL_ID = "alibaba/qwen-image-2.0" as const;

export class RunwareQwenImage2 extends RunwareImageGenerationBase {
  protected readonly MODEL_ID = QWEN_IMAGE_2_MODEL_ID;

  protected readonly INTERNAL_ID = RUNWARE_QWEN_IMAGE_2_ID;

  protected readonly DISPLAY_NAME = "Qwen Image 2.0";

  protected readonly RUNWARE_MODEL_ID = "alibaba:qwen-image@2.0" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1344;
  }
}
