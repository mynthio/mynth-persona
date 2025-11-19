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
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemActions,
} from "@/components/ui/item";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePersonaGenerationStore } from "@/stores/persona-generation.store";
import { ImageStyle } from "@/types/image-generation/image-style.type";
import { ShotType } from "@/types/image-generation/shot-type.type";
import { ImageModelId, IMAGE_MODELS } from "@/config/shared/image-models";
import { useState } from "react";
import { toast } from "sonner";
import { useWorkbenchMode } from "@/hooks/use-workbench-mode.hook";
import { Sparkles, Check } from "lucide-react";

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
      const result = await generatePersonaImage(personaId, {
        modelId: options.modelId,
        style: (options.style || "auto") as ImageStyle,
        shotType: options.shotType,
        userNote: options.userNote,
      });

      if (!result.success) {
        const { code, message } = result.error;

        if (code === "CONCURRENT_LIMIT_EXCEEDED") {
          toast.error("Concurrent generation limit reached", {
            description:
              "You've reached the limit of concurrent generations. Upgrade your plan for more.",
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

      const { taskId: runId, publicAccessToken } = result.data;

      personaGenerationStore.addImageGenerationRun(runId, {
        runId,
        publicAccessToken,
        personaId,
        startedAt: Date.now(),
      });

      setWorkbenchMode("gallery");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to generate image", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      <ScrollArea className="h-full min-h-0 w-full min-w-0 max-w-full overflow-x-hidden">
        <div className="min-h-0 mt-auto h-full overflow-y-auto overflow-x-hidden flex flex-col justify-start gap-6 px-4 pt-0 pb-3">
          {/* Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide">
                Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <TooltipProvider>
                {Object.values(IMAGE_MODELS).map((model) => {
                  const isPremium = model.cost > 1;
                  const selected = options.modelId === model.id;
                  return (
                    <Item
                      key={model.id}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "cursor-pointer transition-all",
                        selected && "ring-2 ring-primary ring-offset-1"
                      )}
                      onClick={() =>
                        setOptions({
                          ...options,
                          modelId: model.id,
                        })
                      }
                    >
                      <ItemContent>
                        <ItemTitle className="flex items-center gap-2">
                          {model.displayName}
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
                        </ItemTitle>
                      </ItemContent>
                      <ItemActions>
                        <div
                          className={cn(
                            "relative flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all",
                            selected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {selected && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                      </ItemActions>
                    </Item>
                  );
                })}
              </TooltipProvider>
            </CardContent>
          </Card>

          {/* Style Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide">
                Style
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Shot Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide">
                Shot Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {(["full-body", "portrait"] as const).map((shotType) => (
                  <ShotTypeCard
                    key={shotType}
                    shotType={shotType}
                    selected={options.shotType === shotType}
                    onClick={() => setOptions({ ...options, shotType })}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide">
                Additional Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Optional details for the generation</span>
                <span>{options.userNote.length}/500</span>
              </div>
              <Textarea
                placeholder="e.g. Professional headshot, soft light, natural background"
                value={options.userNote}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    userNote: e.target.value.slice(0, 500),
                  })
                }
                className="min-h-[84px] resize-none"
                maxLength={500}
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Action Buttons - Sticky Footer */}
      <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => {
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
      </div>
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
    <button
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-lg p-1 overflow-hidden transition-all",
        "border-2",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50"
      )}
    >
      <div className="aspect-square rounded-md overflow-hidden relative">
        {styleImages[style] ? (
          <img
            src={styleImages[style]!}
            alt={`${styleLabels[style]} example`}
            className="w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        {selected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary grid place-items-center">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
        <div className="absolute bottom-1.5 left-1.5 text-white text-[11px] font-semibold px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm">
          {styleLabels[style]}
        </div>
      </div>
    </button>
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
    <button
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-lg p-1.5 overflow-hidden transition-all",
        "border-2",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50"
      )}
    >
      <div className="aspect-[3/4] rounded-md overflow-hidden relative">
        <img
          src={images[shotType]}
          alt={`${labels[shotType]} example`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        {selected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary grid place-items-center">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
        <div className="absolute bottom-1.5 left-1.5 text-white text-[11px] font-semibold px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm">
          {labels[shotType]}
        </div>
      </div>
    </button>
  );
}
