"use client";

import { usePersonaImagesQuery } from "@/app/_queries/use-persona-images.query";
import { useParams } from "next/navigation";
import { getImageUrl } from "@/lib/utils";
import { MiniWaveLoader } from "@/components/ui/mini-wave-loader";
import { usePersonaGenerationStore } from "@/stores/persona-generation.store";
import { useMemo, useEffect } from "react";
import { useRealtimeRun, useRun } from "@trigger.dev/react-hooks";
import { usePersonaImagesMutation } from "@/app/_queries/use-persona-images.query";
import { SWRConfig } from "swr";
import { useImageId } from "@/hooks/use-image-id.hook";
import GalleryImageModal from "./gallery-image-modal";
import { ImageBrokenIcon, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import ms from "ms";

export default function GalleryContent() {
  const params = useParams<{ personaId: string }>();
  const personaId = params.personaId;
  const { data: images, isLoading } = usePersonaImagesQuery(personaId);
  const personaGenerationStore = usePersonaGenerationStore();
  const [, setImageId] = useImageId();

  const inProgressRuns = useMemo(() => {
    if (!personaId)
      return [] as {
        runId: string;
        publicAccessToken: string;
        expectedImageCount: number;
      }[];
    return Object.values(personaGenerationStore.imageGenerationRuns)
      .filter((r) => r.personaId === personaId)
      .map((r) => ({
        runId: r.runId,
        publicAccessToken: r.publicAccessToken,
        expectedImageCount: r.expectedImageCount,
      }))
      .sort((a, b) => {
        const aStarted =
          personaGenerationStore.imageGenerationRuns[a.runId]?.startedAt ?? 0;
        const bStarted =
          personaGenerationStore.imageGenerationRuns[b.runId]?.startedAt ?? 0;
        return aStarted - bStarted;
      });
  }, [personaId, personaGenerationStore.imageGenerationRuns]);

  // Only show a generic loading state if there are no in-progress runs to display
  if (isLoading && inProgressRuns.length === 0) {
    return (
      <div className="mt-12 max-w-4xl mx-auto text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if ((!images || images.length === 0) && inProgressRuns.length === 0) {
    return (
      <div className="mt-12 max-w-4xl mx-auto">
        <div className="border border-dashed border-border rounded-md p-8 text-center text-muted-foreground">
          No images yet
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-2xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <SWRConfig
          value={{
            // @ts-expect-error - trigger realtime hook requires null fetcher scope
            fetcher: null,
          }}
        >
          {inProgressRuns.map((run) => (
            <GalleryImageInProgress
              key={run.runId}
              personaId={personaId!}
              runId={run.runId}
              publicAccessToken={run.publicAccessToken}
              expectedImageCount={run.expectedImageCount}
            />
          ))}
        </SWRConfig>
        {(images ?? []).map((img) => (
          <div
            key={img.id}
            className="aspect-square rounded-md overflow-hidden"
            onClick={() => setImageId(img.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setImageId(img.id);
            }}
          >
            <img
              src={getImageUrl(img.id, "thumb")}
              alt="Persona image"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>
      <GalleryImageModal />
    </div>
  );
}

type RunOutput = {
  images?: Array<{ imageUrl: string; mediaId: string }>;
  // Legacy fields for backwards compatibility
  imageUrl?: string;
  mediaId?: string;
};

function GalleryImageInProgress({
  personaId,
  runId,
  publicAccessToken,
  expectedImageCount,
}: {
  personaId: string;
  runId: string;
  publicAccessToken: string;
  expectedImageCount: number;
}) {
  const { run } = useRun(runId, {
    accessToken: publicAccessToken,
    refreshInterval: ms("5s"),
  });
  const mutateImages = usePersonaImagesMutation(personaId);
  const personaGenerationStore = usePersonaGenerationStore();

  useEffect(() => {
    if (run?.status === "COMPLETED") {
      const output = run.output as RunOutput | undefined;
      let actualImageCount = 0;

      // Handle new multi-image format
      if (output?.images && output.images.length > 0) {
        actualImageCount = output.images.length;
        mutateImages((prev) => {
          const newImages = output.images!.filter(
            (img) => !prev?.some((p) => p.id === img.mediaId)
          );
          if (newImages.length === 0) return prev;
          return [
            ...newImages.map((img) => ({ id: img.mediaId })),
            ...(prev ?? []),
          ];
        });
      }
      // Fallback to legacy single-image format
      else if (output?.mediaId) {
        actualImageCount = 1;
        mutateImages((prev) => {
          const alreadyExists = prev?.some((i) => i.id === output.mediaId);
          if (alreadyExists) return prev;
          return [{ id: output.mediaId! }, ...(prev ?? [])];
        });
      }

      // If partial completion (some images failed), show error state briefly before removing
      const hasPartialFailure = actualImageCount > 0 && actualImageCount < expectedImageCount;
      const hasCompleteFailure = actualImageCount === 0;

      if (hasPartialFailure) {
        // Keep error tiles visible for 5 seconds so user sees what happened
        setTimeout(() => {
          personaGenerationStore.removeImageGenerationRun(runId);
        }, 5000);
      } else {
        // Full success or complete failure - remove immediately
        personaGenerationStore.removeImageGenerationRun(runId);
      }
    }
  }, [run, mutateImages, personaGenerationStore, runId, expectedImageCount]);

  const status = run?.status;
  const isFailed =
    status === "FAILED" ||
    status === "CANCELED" ||
    status === "CRASHED" ||
    status === "SYSTEM_FAILURE" ||
    status === "TIMED_OUT";
  
  // Check for partial completion
  const output = run?.output as RunOutput | undefined;
  const actualImageCount = output?.images?.length ?? (output?.mediaId ? 1 : 0);
  const isPartialCompletion = status === "COMPLETED" && actualImageCount > 0 && actualImageCount < expectedImageCount;

  // For partial completion, only render tiles for the missing images
  const tilesToRender = isPartialCompletion ? expectedImageCount - actualImageCount : expectedImageCount;

  // Render loading tiles for expected images (or just failed ones for partial completion)
  return (
    <>
      {Array.from({ length: tilesToRender }).map((_, index) => (
        <div
          key={`${runId}-loading-${index}`}
          className="aspect-square w-full h-full min-w-32 min-h-32 rounded-md overflow-hidden relative bg-gradient-to-br from-muted/50 to-background/60 border border-border"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {isFailed || isPartialCompletion ? (
              <div className="flex flex-col items-center gap-2 text-red-400">
                <ImageBrokenIcon size={28} weight="duotone" />
                <div className="text-[11px]">Failed to generate</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <MiniWaveLoader size="md" aria-label="Generating image" />
                <div className="text-[11px] text-muted-foreground">
                  Generating…
                </div>
              </div>
            )}
          </div>

          <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900" />
        </div>
      ))}
    </>
  );
}
