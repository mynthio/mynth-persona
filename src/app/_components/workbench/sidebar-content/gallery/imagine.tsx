"use client";

import { generatePersonaImage } from "@/actions/generate-persona-image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePersonaGenerationStore } from "@/stores/persona-generation.store";
import { ImageStyle } from "@/types/image-generation/image-style.type";
import { ShotType } from "@/types/image-generation/shot-type.type";
import { ImageModelId, IMAGE_MODELS } from "@/config/shared/image-models";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useWorkbenchMode } from "@/hooks/use-workbench-mode.hook";
import { Sparkles } from "lucide-react";

type GenerationOptions = {
  modelId: ImageModelId;
  style?: ImageStyle | "auto";
  shotType: ShotType;
  userNote: string;
};

export default function Imagine() {
  const params = useParams<{ personaId: string }>();
  const personaId = params.personaId;
  const personaGenerationStore = usePersonaGenerationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [, setWorkbenchMode] = useWorkbenchMode();

  // Plan-based access and rate limiting handled server-side
  const toast = useToast();

  const [options, setOptions] = useState<GenerationOptions>({
    modelId: "black-forest-labs/flux-dev",
    style: "auto",
    shotType: "full-body",
    userNote: "",
  });

  if (!personaId) return null;

  const onGenerate = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { taskId: runId, publicAccessToken } = await generatePersonaImage(
        personaId,
        {
          modelId: options.modelId,
          style: (options.style || "auto") as ImageStyle,
          shotType: options.shotType,
          userNote: options.userNote,
        }
      );

      // Use action method to avoid stale state issues
      personaGenerationStore.addImageGenerationRun(runId, {
        runId,
        publicAccessToken,
        personaId,
        startedAt: Date.now(),
      });

      // Ensure main content is the Gallery so the in-progress tile is visible
      setWorkbenchMode("gallery");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Provide specific error message for concurrent job limit
      if (errorMessage === "CONCURRENT_LIMIT_EXCEEDED") {
        toast.add({
          title: "Concurrent generation limit reached",
          description:
            "You've reached the limit of concurrent generations. Upgrade your plan for more.",
          type: "error",
        });
      } else if (errorMessage === "RATE_LIMIT_EXCEEDED") {
        toast.add({
          title: "Rate limit exceeded",
          description:
            "You've reached your image generation limit. Please try again later.",
          type: "error",
        });
      } else {
        toast.add({
          title: "Failed to generate image",
          description: errorMessage,
          type: "error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      <ScrollArea className="h-full min-h-0 w-full min-w-0 max-w-full overflow-x-hidden">
        <div className="min-h-0 mt-auto h-full overflow-y-auto overflow-x-hidden flex flex-col justify-start gap-4 px-4 pt-0 pb-3">
          <Section title="Model">
            <TooltipProvider>
              <div className="space-y-2">
                {Object.values(IMAGE_MODELS).map((model) => {
                  const isPremium = model.cost > 1;
                  const selected = options.modelId === model.id;
                  return (
                    <div
                      key={model.id}
                      onClick={() =>
                        setOptions({
                          ...options,
                          modelId: model.id,
                        })
                      }
                      className={cn(
                        "group relative flex items-center justify-between gap-3 rounded-lg p-3 cursor-pointer transition-all",
                        "border border-zinc-200/60 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm",
                        "hover:shadow-md",
                        selected && "ring-2 ring-primary/80 ring-offset-1"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[13px] font-medium truncate">
                          {model.displayName}
                        </span>
                        {isPremium && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px] font-medium">
                                <Sparkles className="w-3 h-3" /> Premium
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs max-w-[220px]">
                                Higher quality output. Uses more of your daily
                                limit.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div
                        className={cn(
                          "relative flex items-center justify-center w-4 h-4 rounded-full border transition-all",
                          selected
                            ? "border-primary bg-primary"
                            : "border-zinc-300 bg-white"
                        )}
                      >
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full transition-opacity",
                            selected
                              ? "opacity-100 bg-white"
                              : "opacity-0 bg-transparent"
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>
          </Section>

          <Section title="Style">
            <div className="grid grid-cols-4 gap-2">
              {(["auto", "realistic", "anime", "cinematic"] as const).map(
                (style) => (
                  <StyleCard
                    key={style}
                    style={style}
                    selected={options.style === style}
                    onClick={() => setOptions({ ...options, style })}
                  />
                )
              )}
            </div>
          </Section>

          <Section title="Shot type">
            <div className="grid grid-cols-2 gap-2">
              {(["full-body", "portrait"] as const).map((shotType) => (
                <ShotTypeCard
                  key={shotType}
                  shotType={shotType}
                  selected={options.shotType === shotType}
                  onClick={() => setOptions({ ...options, shotType })}
                />
              ))}
            </div>
          </Section>

          <div className="rounded-xl border border-zinc-200/60 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="user-note" className="text-[13px] font-semibold">
                Additional notes
              </Label>
              <div className="text-[11px] text-zinc-500">
                {options.userNote.length}/500
              </div>
            </div>
            <Textarea
              id="user-note"
              placeholder="e.g. Professional headshot, soft light, natural background"
              value={options.userNote}
              onChange={(e) =>
                setOptions({
                  ...options,
                  userNote: e.target.value.slice(0, 500),
                })
              }
              className="min-h-[84px] resize-none text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-0"
              maxLength={500}
            />
          </div>
        </div>
      </ScrollArea>

      <div className="shrink-0  dark:bg-zinc-900/50 backdrop-blur-sm px-2 pb-2">
        <div className="flex items-center justify-end gap-2 bg-white rounded-md p-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            onClick={() => {
              // Reset to defaults
              setOptions({
                modelId: "black-forest-labs/flux-dev",
                style: "auto",
                shotType: "full-body",
                userNote: "",
              });
            }}
          >
            Reset
          </Button>
          <Button onClick={onGenerate} disabled={isLoading} size="sm">
            {isLoading ? "Generating..." : "Generate"}
          </Button>
        </div>
        {/* Plan-based access and rate limiting enforced server-side */}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200/60 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm p-3 shadow-sm">
      <h3 className="text-[12px] font-semibold text-zinc-900/90 mb-2 tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

function StyleCard({
  style,
  selected,
  onClick,
}: {
  style: ImageStyle | "auto";
  selected: boolean;
  onClick: () => void;
}) {
  const styleLabels: Record<ImageStyle | "auto", string> = {
    auto: "Auto",
    realistic: "Realistic",
    anime: "Anime",
    cinematic: "Cinematic",
  };

  const styleImages: Partial<Record<ImageStyle | "auto", string>> = {
    auto: "https://mynth-persona-dev.b-cdn.net/personas/img_9KQTiokR20_PuHhWFW4rQ.webp",
    realistic:
      "https://mynth-persona-dev.b-cdn.net/personas/img_6H0J76qnmgA-wjMa7mdnr.webp",
    anime:
      "https://mynth-persona-dev.b-cdn.net/personas/img_bMcdwYotWDoK0o91hk9Nn.webp",
    cinematic:
      "https://mynth-persona-dev.b-cdn.net/personas/img_tbBZQFI_oxa75aJEn_OZr.webp",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer rounded-lg p-1.5 overflow-hidden",
        "border border-zinc-200/60 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-sm",
        "hover:shadow-md transition-all",
        selected && "ring-2 ring-primary/80 ring-offset-1"
      )}
    >
      <div className="aspect-square rounded-md mb-1 overflow-hidden relative">
        {styleImages[style] ? (
          <img
            src={styleImages[style]!}
            alt={`${styleLabels[style]} example`}
            className="w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full border border-white/70 bg-black/30 backdrop-blur-sm grid place-items-center">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              selected ? "bg-white" : "bg-white/30"
            )}
          />
        </div>
        <div className="absolute bottom-1.5 left-1.5 text-white text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-sm">
          {styleLabels[style]}
        </div>
      </div>
    </div>
  );
}

function ShotTypeCard({
  shotType,
  selected,
  onClick,
}: {
  shotType: ShotType;
  selected: boolean;
  onClick: () => void;
}) {
  const labels: Record<ShotType, string> = {
    portrait: "Portrait",
    "full-body": "Full body / 3/4 shot",
  };

  const images: Record<ShotType, string> = {
    portrait:
      "https://mynth-persona-dev.b-cdn.net/personas/img_P_pd-JF4ibbfoeng8OGeV.webp",
    "full-body":
      "https://mynth-persona-dev.b-cdn.net/personas/img_cyqJZPfPOJ9VpCdLK4U5A.webp",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer rounded-lg p-1.5 overflow-hidden",
        "border border-zinc-200/60 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-sm",
        "hover:shadow-md transition-all",
        selected && "ring-2 ring-primary/80 ring-offset-1"
      )}
    >
      <div className="aspect-3/4 rounded-md overflow-hidden relative">
        <img
          src={images[shotType]}
          alt={`${labels[shotType]} example`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full border border-white/70 bg-black/30 backdrop-blur-sm grid place-items-center">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              selected ? "bg-white" : "bg-white/30"
            )}
          />
        </div>
        <div className="absolute bottom-1.5 left-1.5 text-white text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-sm">
          {labels[shotType]}
        </div>
      </div>
    </div>
  );
}
