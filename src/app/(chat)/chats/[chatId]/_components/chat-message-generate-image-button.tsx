"use client";

import { useTransition } from "react";
import { useChatMain } from "../_contexts/chat-main.context";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useChatImageGenerationStore } from "@/stores/chat-image-generation.store";
import {
  generateMessageImage,
  ImageGenerationMode,
} from "@/actions/generate-message-image";
import {
  IMAGE_MODELS,
  isModelBeta,
  isModelNew,
  ImageModelId,
  supportsReferenceImages,
} from "@/config/shared/image-models";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

const CHARACTER_MODE_MODELS = Object.values(IMAGE_MODELS).filter((model) =>
  supportsReferenceImages(model.id),
);
const CREATIVE_MODE_MODELS = Object.values(IMAGE_MODELS);

type ImageGenerationMenuItemsProps = {
  messageId: string;
};

export function ImageGenerationMenuItems(
  props: ImageGenerationMenuItemsProps,
) {
  const { chatId, settings } = useChatMain();
  const addImageGenerationRun = useChatImageGenerationStore(
    (state) => state.addImageGenerationRun,
  );
  const [isPending, startTransition] = useTransition();

  const hasSceneImage = !!settings.sceneImageMediaId;

  const handleGenerateImage = (
    modelId: ImageModelId,
    mode: ImageGenerationMode,
  ) => {
    startTransition(async () => {
      try {
        const result = await generateMessageImage(props.messageId, chatId, {
          modelId,
          mode,
        });

        if (!result.success) {
          const { code, message } = result.error;

          if (code === "CONCURRENT_LIMIT_EXCEEDED") {
            toast.error("Concurrent generation limit reached", {
              description:
                "You've reached the limit of concurrent generations. Upgrade your plan for more.",
            });
          } else if (code === "SCENE_IMAGE_REQUIRED") {
            toast.error("Scene image required", {
              description:
                "Generate a scene image first in chat settings to use character mode.",
            });
          } else if (code === "MODEL_DOES_NOT_SUPPORT_REFERENCE_IMAGES") {
            toast.error("Model incompatible", {
              description:
                "This model doesn't support character mode. Try creative mode instead.",
            });
          } else if (code === "RATE_LIMIT_EXCEEDED") {
            toast.error("Rate limit exceeded", {
              description:
                "You've reached your image generation limit. Please try again later.",
            });
          } else {
            toast.error("Failed to generate image", {
              description: message,
            });
          }
          return;
        }

        // Add to store to track in-progress generation
        addImageGenerationRun(result.data.runId, {
          runId: result.data.runId,
          publicAccessToken: result.data.publicAccessToken,
          messageId: props.messageId,
          chatId: chatId,
          startedAt: Date.now(),
          modelId,
          expectedImageCount: result.data.expectedImageCount,
          status: "PENDING",
        });
      } catch (error) {
        console.error("Failed to generate image:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error("Failed to generate image", {
          description: errorMessage,
        });
      }
    });
  };

  return (
    <>
      {/* Character Mode Section */}
      {hasSceneImage && (
        <>
          <DropdownMenuLabel>Character Mode</DropdownMenuLabel>
          {CHARACTER_MODE_MODELS.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => handleGenerateImage(model.id, "character")}
              disabled={isPending}
            >
              <div className="flex items-center w-full justify-between gap-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {model.displayName}
                  {isModelNew(model.id) && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0.5 h-auto border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                    >
                      New
                    </Badge>
                  )}
                  {isModelBeta(model.id) && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0.5 h-auto border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    >
                      Beta
                    </Badge>
                  )}
                </div>
                {model.cost > 1 && (
                  <span className="text-yellow-800 bg-yellow-200 p-1 text-xs rounded">
                    <HugeiconsIcon icon={SparklesIcon} size={12} />
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
        </>
      )}

      {/* Creative Mode Section */}
      <DropdownMenuLabel>Creative Mode</DropdownMenuLabel>
      {CREATIVE_MODE_MODELS.map((model) => (
        <DropdownMenuItem
          key={`creative-${model.id}`}
          onClick={() => handleGenerateImage(model.id, "creative")}
          disabled={isPending}
        >
          <div className="flex items-center w-full justify-between gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {model.displayName}
              {isModelBeta(model.id) && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0.5 h-auto border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                >
                  Beta
                </Badge>
              )}
            </div>
            {model.cost > 1 && (
              <span className="text-yellow-800 bg-yellow-200 p-1 text-xs rounded">
                <HugeiconsIcon icon={SparklesIcon} size={12} />
              </span>
            )}
          </div>
        </DropdownMenuItem>
      ))}
    </>
  );
}
