import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_NANO_BANANA_2_ID = "runware/nano-banana-2" as const;
const NANO_BANANA_2_MODEL_ID = "google/nano-banana-2" as const;

export class RunwareNanoBanana2 extends RunwareImageGenerationBase {
  protected readonly MODEL_ID = NANO_BANANA_2_MODEL_ID;

  protected readonly INTERNAL_ID = RUNWARE_NANO_BANANA_2_ID;

  protected readonly DISPLAY_NAME = "Nano Banana 2";

  protected readonly RUNWARE_MODEL_ID = "google:4@3" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1376;
  }
}
