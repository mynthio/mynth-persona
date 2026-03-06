import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_SEEDREAM_5_LITE_ID = "runware/seedream-5-lite" as const;
const SEEDREAM_5_LITE_MODEL_ID = "seedream/seedream-5.0-lite" as const;

export class RunwareSeedream5Lite extends RunwareImageGenerationBase {
  protected readonly MODEL_ID = SEEDREAM_5_LITE_MODEL_ID;

  protected readonly INTERNAL_ID = RUNWARE_SEEDREAM_5_LITE_ID;

  protected readonly DISPLAY_NAME = "SeeDream 5.0 Lite";

  protected readonly RUNWARE_MODEL_ID = "bytedance:seedream@5.0-lite" as const;

  protected getDefaultWidth(): number {
    return 1600;
  }

  protected getDefaultHeight(): number {
    return 2848;
  }

  protected getPerRequestConfig(): { steps?: number; CFGScale?: number } {
    return {};
  }
}
