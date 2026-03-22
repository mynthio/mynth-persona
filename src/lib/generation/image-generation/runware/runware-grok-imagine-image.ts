import { RunwareImageGenerationBase } from "./runware-base";

const RUNWARE_GROK_IMAGINE_IMAGE_ID = "runware/grok-imagine-image" as const;
const GROK_IMAGINE_IMAGE_MODEL_ID = "xai/grok-imagine-image" as const;

export class RunwareGrokImagineImage extends RunwareImageGenerationBase {
  protected readonly MODEL_ID = GROK_IMAGINE_IMAGE_MODEL_ID;

  protected readonly INTERNAL_ID = RUNWARE_GROK_IMAGINE_IMAGE_ID;

  protected readonly DISPLAY_NAME = "Grok Imagine Image";

  protected readonly RUNWARE_MODEL_ID = "xai:grok-imagine@image" as const;

  protected getDefaultWidth(): number {
    return 768;
  }

  protected getDefaultHeight(): number {
    return 1408;
  }
}
