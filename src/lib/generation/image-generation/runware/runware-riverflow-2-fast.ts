import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_RIVERFLOW_2_FAST_ID = "runware/riverflow-2-fast" as const;
const RIVERFLOW_2_FAST_MODEL_ID = "sourceful/riverflow-2-fast" as const;

export class RunwareRiverflow2Fast extends RunwareImageGenerationBase {
  // Universal model identifier - same across all providers for this model
  protected readonly MODEL_ID = RIVERFLOW_2_FAST_MODEL_ID;

  // Internal unique identifier for this specific provider implementation
  protected readonly INTERNAL_ID = RUNWARE_RIVERFLOW_2_FAST_ID;

  // Human-friendly display name
  protected readonly DISPLAY_NAME = "Riverflow 2 Fast";

  // Provider-specific model ID (private)
  protected readonly RUNWARE_MODEL_ID = "sourceful:2@2" as const;

  protected getDefaultWidth(): number {
    return 720;
  }

  protected getDefaultHeight(): number {
    return 1280;
  }
}

