import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_RECRAFT_V4_ID = "runware/recraft-v4" as const;
const RECRAFT_V4_MODEL_ID = "recraft/recraft-v4" as const;

export class RunwareRecraftV4 extends RunwareImageGenerationBase {
  protected readonly MODEL_ID = RECRAFT_V4_MODEL_ID;

  protected readonly INTERNAL_ID = RUNWARE_RECRAFT_V4_ID;

  protected readonly DISPLAY_NAME = "Recraft V4";

  protected readonly RUNWARE_MODEL_ID = "recraft:v4@0" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1344;
  }
}
