"use client";

import { generatePersonaImage } from "@/actions/generate-persona-image";
// import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePersonaGenerationStore } from "@/stores/persona-generation.store";
import { ImageStyle } from "@/types/image-generation/image-style.type";
import { ShotType } from "@/types/image-generation/shot-type.type";
import { ImageGenerationQuality } from "@/types/image-generation/image-generation-quality.type";
import { useState } from "react";

// Plan-based access and rate limiting handled server-side
import { useToast } from "@/components/ui/toast";
import { useWorkbenchMode } from "@/hooks/use-workbench-mode.hook";

type Size = "portrait" | "landscape";

type GenerationOptions = {
  quality: ImageGenerationQuality;
  style?: ImageStyle | "auto";
  shotType: ShotType;
  size: Size;
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
    quality: "medium",
    style: "auto",
    shotType: "full-body",
    size: "portrait",
    userNote: "",
  });

  if (!personaId) return null;

  const onGenerate = async () => {
    if (isLoading) return;
    // Plan-based access and rate limiting handled server-side
    setIsLoading(true);

    try {
      const { taskId: runId, publicAccessToken } = await generatePersonaImage(
        personaId,
        {
          quality: options.quality,
          style: ((options.quality === "low" ? "auto" : options.style) ||
            "auto") as ImageStyle,
          shotType: options.quality === "low" ? "full-body" : options.shotType,
          userNote: options.quality !== "low" ? options.userNote : "",
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
      if (errorMessage === "You have a job running already") {
        toast.add({
          title: "Generation in progress",
          description:
            "You already have an image generation job running. Please wait for it to complete before starting a new one.",
          type: "error",
        });
      } else if (errorMessage === "Rate limit exceeded") {
        toast.add({
          title: "Rate limit exceeded",
          description:
            "You've reached your image generation limit. Please try again later.",
          type: "error",
        });
      } else if (errorMessage.includes("High quality")) {
        toast.add({
          title: "Plan limitation",
          description: errorMessage,
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
    <div className="flex flex-col h-full max-h-full overflow-hidden gap-4">
      <ScrollArea className="h-full min-h-0 w-full min-w-0 max-w-full overflow-x-hidden">
        <div className="min-h-0 mt-auto h-full overflow-y-auto overflow-x-hidden flex flex-col justify-start gap-5 px-1 pt-4 pb-2">
          <Section title="Quality">
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as ImageGenerationQuality[]).map(
                (quality) => (
                  <QualityCard
                    key={quality}
                    quality={quality}
                    selected={options.quality === quality}
                    onClick={() =>
                      setOptions({
                        ...options,
                        quality,
                        style: quality === "low" ? undefined : options.style,
                        shotType:
                          quality === "low" ? "full-body" : options.shotType,
                        userNote: quality === "low" ? "" : options.userNote,
                      })
                    }
                  />
                )
              )}
            </div>
          </Section>

          {options.quality !== "low" && (
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
          )}

          {options.quality !== "low" && (
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
          )}

          <Section title="Size">
            <div className="grid grid-cols-2 gap-2">
              {(["portrait", "landscape"] as const).map((size) => (
                <SizeOption
                  key={size}
                  size={size}
                  selected={options.size === size}
                  onClick={() => setOptions({ ...options, size })}
                />
              ))}
            </div>
          </Section>

          {options.quality !== "low" && (
            <div className="space-y-2">
              <Label htmlFor="user-note" className="text-[13px] font-medium">
                Additional notes
              </Label>
              <Textarea
                id="user-note"
                placeholder="e.g. Professional headshot, focus on expression"
                value={options.userNote}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    userNote: e.target.value.slice(0, 500),
                  })
                }
                className="min-h-[72px] resize-none text-sm border-0 shadow-none focus-visible:ring-0 focus-visible:border-0"
                maxLength={500}
              />
              <div className="text-[11px] text-zinc-500 text-right">
                {options.userNote.length}/500
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-zinc-200/50 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-[12px] border-0 shadow-none"
              disabled={isLoading}
              onClick={() => {
                // Reset to defaults
                setOptions({
                  quality: "medium",
                  style: "auto",
                  shotType: "full-body",
                  size: "portrait",
                  userNote: "",
                });
              }}
            >
              Reset
            </Button>
            <Button
              onClick={onGenerate}
              disabled={isLoading}
              size="sm"
              className="h-8 px-3 text-[12px]"
            >
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </div>
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
    <div className="space-y-2">
      <h3 className="text-[13px] font-semibold text-zinc-900">{title}</h3>
      {children}
    </div>
  );
}

function QualityCard({
  quality,
  selected,
  onClick,
}: {
  quality: ImageGenerationQuality;
  selected: boolean;
  onClick: () => void;
}) {
  const details: Record<
    ImageGenerationQuality,
    { label: string; desc: string }
  > = {
    low: { label: "Low", desc: "Fast" },
    medium: { label: "Medium", desc: "Balanced" },
    high: { label: "High", desc: "Best" },
  };

  const qualityImages: Record<ImageGenerationQuality, string> = {
    low: "https://mynth-persona-prod.b-cdn.net/static/imagine-quality-low.webp",
    medium:
      "https://mynth-persona-dev.b-cdn.net/personas/img_kgJz455ez3wtb96tZvlW3.webp",
    high: "https://mynth-persona-prod.b-cdn.net/static/imagine-quality-high.jpeg",
  };

  const item = details[quality];

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-md p-2 transition-colors",
        "bg-card shadow-sm border border-transparent hover:border-zinc-200",
        selected && "ring-2 ring-primary ring-offset-1"
      )}
    >
      <div className="aspect-4/3 bg-muted rounded-sm mb-1 overflow-hidden">
        <img
          src={qualityImages[quality]}
          alt={`${item.label} example`}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="text-center space-y-0.5">
        <div className="text-[12px] font-medium">{item.label}</div>
        <div className="text-[11px] text-zinc-500">{item.desc}</div>
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
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-md p-1.5 transition-colors",
        "bg-card shadow-sm border border-transparent hover:border-zinc-200",
        selected && "ring-2 ring-primary ring-offset-1"
      )}
    >
      <div className="aspect-square bg-muted rounded-sm mb-1 overflow-hidden">
        {styleImages[style] ? (
          <img
            src={styleImages[style]!}
            alt={`${styleLabels[style]} example`}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>
      <div className="text-center text-[12px] font-medium">
        {styleLabels[style]}
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
        "relative cursor-pointer rounded-md p-2 transition-colors",
        "bg-card shadow-sm border border-transparent hover:border-zinc-200",
        selected && "ring-2 ring-primary ring-offset-1"
      )}
    >
      <div className="aspect-3/4 bg-muted rounded-sm mb-1 overflow-hidden">
        <img
          src={images[shotType]}
          alt={`${labels[shotType]} example`}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="text-center text-[12px] font-medium">
        {labels[shotType]}
      </div>
    </div>
  );
}

function SizeOption({
  size,
  selected,
  onClick,
}: {
  size: Size;
  selected: boolean;
  onClick: () => void;
}) {
  const labels: Record<Size, string> = {
    portrait: "Portrait (3:4)",
    landscape: "Landscape (4:3)",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors",
        "bg-card shadow-sm border border-transparent hover:border-zinc-200",
        selected && "ring-2 ring-primary ring-offset-1"
      )}
    >
      <span className="text-[12px] font-medium">{labels[size]}</span>
      <div
        className={cn(
          "w-3.5 h-3.5 rounded-full transition-all",
          selected ? "bg-primary" : "bg-zinc-300"
        )}
      />
    </div>
  );
}
