import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_KLING_IMAGE_3_ID = "runware/kling-image-3.0" as const;
const KLING_IMAGE_3_MODEL_ID = "klingai/kling-image-3.0" as const;

export class RunwareKlingImage3 extends RunwareImageGenerationBase {
  protected readonly MODEL_ID = KLING_IMAGE_3_MODEL_ID;

  protected readonly INTERNAL_ID = RUNWARE_KLING_IMAGE_3_ID;

  protected readonly DISPLAY_NAME = "Kling Image 3.0";

  protected readonly RUNWARE_MODEL_ID = "klingai:kling-image@3" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1360;
  }
}
