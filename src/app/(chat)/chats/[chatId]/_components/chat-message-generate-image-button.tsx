"use client";

import { useState, useTransition } from "react";
import { useChatMain } from "../_contexts/chat-main.context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useChatImageGenerationStore } from "@/stores/chat-image-generation.store";
import {
  generateMessageImage,
  ImageGenerationMode,
} from "@/actions/generate-message-image";
import {
  IMAGE_MODELS,
  getGenerationModels,
  isModelBeta,
  isModelNew,
  ImageModelId,
  supportsReferenceImages,
} from "@/config/shared/image-models";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Image02Icon,
  Loading02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const GENERATION_MODELS = getGenerationModels();
const CHARACTER_MODE_MODELS = Object.values(IMAGE_MODELS).filter((model) =>
  supportsReferenceImages(model.id),
);
const CREATIVE_MODE_MODELS = GENERATION_MODELS;

type ChatMessageGenerateImageButtonProps = {
  messageId: string;
  disabled?: boolean;
  className?: string;
  iconOnly?: boolean;
};

export function ChatMessageGenerateImageButton({
  messageId,
  disabled = false,
  className,
  iconOnly = false,
}: ChatMessageGenerateImageButtonProps) {
  const { chatId, settings } = useChatMain();
  const [open, setOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const addImageGenerationRun = useChatImageGenerationStore(
    (state) => state.addImageGenerationRun,
  );
  const [isPending, startTransition] = useTransition();

  const hasSceneImage = !!settings.sceneImageMediaId;

  const handleGenerateImage = (
    modelId: ImageModelId,
    mode: ImageGenerationMode,
  ) => {
    const selectionKey = `${mode}:${modelId}`;

    startTransition(async () => {
      setPendingSelection(selectionKey);
      try {
        const result = await generateMessageImage(messageId, chatId, {
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
          messageId,
          chatId: chatId,
          startedAt: Date.now(),
          modelId,
          expectedImageCount: result.data.expectedImageCount,
          status: "PENDING",
        });
        setOpen(false);
      } catch (error) {
        console.error("Failed to generate image:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error("Failed to generate image", {
          description: errorMessage,
        });
      } finally {
        setPendingSelection(null);
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={iconOnly ? "ghost" : "outline"}
          size={iconOnly ? "icon-xs" : "default"}
          disabled={disabled || isPending}
          aria-label="Generate image"
          title="Generate image"
          className={cn(
            iconOnly
              ? "text-muted-foreground/70 hover:text-foreground"
              : "h-9 rounded-xl border-border/60 bg-gradient-to-r from-primary/[0.10] via-primary/[0.03] to-background px-3.5 text-sm font-medium text-foreground shadow-sm hover:from-primary/[0.16] hover:via-primary/[0.06] hover:to-muted/40",
            className,
          )}
        >
          {isPending ? (
            <HugeiconsIcon
              icon={Loading02Icon}
              size={16}
              className={cn(
                "animate-spin text-muted-foreground",
                !iconOnly && "mr-2",
              )}
            />
          ) : (
            <HugeiconsIcon
              icon={Image02Icon}
              size={16}
              className={cn("text-muted-foreground", !iconOnly && "mr-2")}
            />
          )}
          {!iconOnly && "Generate Image"}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="center"
        sideOffset={8}
        collisionPadding={12}
        className="w-[min(94vw,26rem)] max-w-[calc(100vw-1rem)] p-0 overflow-hidden rounded-xl border-border/60 dark:border-white/[0.10] dark:bg-[#0e0f12]"
      >
        <Command className="bg-transparent">
          <div className="border-b border-border/50 px-3.5 py-3">
            <p className="text-sm font-semibold tracking-tight">
              Generate message image
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Generate an image based on last messages. Character mode uses the
              scene image as reference.
            </p>
          </div>

          <CommandInput
            placeholder="Search image models..."
            className="h-9 text-sm"
          />

          <CommandList className="max-h-[min(62vh,320px)] p-1.5">
            <CommandGroup
              heading="Character Mode"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-muted-foreground/55"
            >
              {hasSceneImage ? (
                CHARACTER_MODE_MODELS.map((model) => (
                  <ImageModelCommandItem
                    key={`character-${model.id}`}
                    model={model}
                    mode="character"
                    disabled={isPending}
                    pendingSelection={pendingSelection}
                    onSelect={handleGenerateImage}
                  />
                ))
              ) : (
                <CommandItem
                  disabled
                  className="rounded-lg border border-dashed border-border/70 px-2.5 py-2.5 text-xs leading-relaxed text-muted-foreground"
                >
                  Character mode requires a scene image from chat settings.
                </CommandItem>
              )}
            </CommandGroup>

            <CommandSeparator className="my-1 bg-border/50 dark:bg-white/[0.07]" />

            <CommandGroup
              heading="Creative Mode"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-muted-foreground/55"
            >
              {CREATIVE_MODE_MODELS.map((model) => (
                <ImageModelCommandItem
                  key={`creative-${model.id}`}
                  model={model}
                  mode="creative"
                  disabled={isPending}
                  pendingSelection={pendingSelection}
                  onSelect={handleGenerateImage}
                />
              ))}
            </CommandGroup>

            <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
              No image models found
            </CommandEmpty>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type ImageModelCommandItemProps = {
  model: (typeof GENERATION_MODELS)[number];
  mode: ImageGenerationMode;
  disabled: boolean;
  pendingSelection: string | null;
  onSelect: (modelId: ImageModelId, mode: ImageGenerationMode) => void;
};

function ImageModelCommandItem({
  model,
  mode,
  disabled,
  pendingSelection,
  onSelect,
}: ImageModelCommandItemProps) {
  const selectionKey = `${mode}:${model.id}`;
  const isSelectedPending = pendingSelection === selectionKey;

  return (
    <CommandItem
      value={[
        model.displayName,
        model.id,
        `${model.imagesPerGeneration} image`,
      ].join(" ")}
      disabled={disabled}
      onSelect={() => onSelect(model.id, mode)}
      className="group rounded-lg border border-transparent px-2.5 py-2 data-[selected=true]:border-border/70 data-[selected=true]:bg-muted/60 dark:data-[selected=true]:bg-white/[0.05]"
    >
      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={Image02Icon}
              size={15}
              className="shrink-0 text-muted-foreground/80"
            />
            <span className="truncate text-[13px] font-medium">
              {model.displayName}
            </span>
            {isModelNew(model.id) && (
              <Badge
                variant="outline"
                className="h-5 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] text-emerald-700 dark:text-emerald-300"
              >
                New
              </Badge>
            )}
            {isModelBeta(model.id) && (
              <Badge
                variant="outline"
                className="h-5 border-sky-500/30 bg-sky-500/10 px-1.5 text-[10px] text-sky-700 dark:text-sky-300"
              >
                Beta
              </Badge>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              {model.imagesPerGeneration} img
            </Badge>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
          {isSelectedPending ? (
            <HugeiconsIcon
              icon={Loading02Icon}
              size={12}
              className="animate-spin"
            />
          ) : (
            <HugeiconsIcon icon={SparklesIcon} size={12} />
          )}
          {model.cost} credit{model.cost > 1 ? "s" : ""}
        </div>
      </div>
    </CommandItem>
  );
}
