"use client";

import { usePersonaImagesQuery } from "@/app/_queries/use-persona-images.query";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
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
  const [personaId] = usePersonaId();
  const { data: images, isLoading } = usePersonaImagesQuery(personaId);
  const personaGenerationStore = usePersonaGenerationStore();
  const [, setImageId] = useImageId();

  const inProgressRuns = useMemo(() => {
    if (!personaId) return [] as { runId: string; publicAccessToken: string }[];
    return Object.values(personaGenerationStore.imageGenerationRuns)
      .filter((r) => r.personaId === personaId)
      .map((r) => ({ runId: r.runId, publicAccessToken: r.publicAccessToken }))
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

function GalleryImageInProgress({
  personaId,
  runId,
  publicAccessToken,
}: {
  personaId: string;
  runId: string;
  publicAccessToken: string;
}) {
  const { run } = useRun(runId, {
    accessToken: publicAccessToken,
    refreshInterval: ms("5s"),
  });
  const mutateImages = usePersonaImagesMutation(personaId);
  const personaGenerationStore = usePersonaGenerationStore();

  useEffect(() => {
    if (run?.status === "COMPLETED") {
      const imageId = (run.output as any)?.imageId as string | undefined;
      if (imageId) {
        mutateImages((prev) => {
          const alreadyExists = prev?.some((i) => i.id === imageId);
          if (alreadyExists) return prev;
          return [{ id: imageId }, ...(prev ?? [])];
        });
      }
      personaGenerationStore.removeImageGenerationRun(runId);
    }
  }, [run?.status]);

  const status = run?.status;
  const isFailed =
    status === "FAILED" ||
    status === "CANCELED" ||
    status === "CRASHED" ||
    status === "SYSTEM_FAILURE" ||
    status === "TIMED_OUT";

  return (
    <div className="aspect-square w-full h-full min-w-32 min-h-32 rounded-md overflow-hidden relative bg-gradient-to-br from-muted/50 to-background/60 border border-border">
      <div className="absolute inset-0 flex items-center justify-center">
        {isFailed ? (
          <div className="flex flex-col items-center gap-2 text-red-400">
            <ImageBrokenIcon size={28} weight="duotone" />
            <div className="text-[11px]">Failed to generate</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <MiniWaveLoader size="md" aria-label="Generating image" />
            <div className="text-[11px] text-muted-foreground">Generating…</div>
          </div>
        )}
      </div>

      <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}
