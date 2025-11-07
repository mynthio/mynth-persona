"use client";

import { useMemo, useState } from "react";
import { getMediaImageUrl } from "@/lib/utils";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import type { ChatImageGenerationRun } from "@/stores/chat-image-generation.store";
import { MiniWaveLoader } from "@/components/ui/mini-wave-loader";
import { ImageBrokenIcon } from "@phosphor-icons/react/dist/ssr";
import { getImageGenerationErrorMessage } from "@/lib/image-generation-errors";

type ChatMessageImagesProps = {
  media?: NonNullable<PersonaUIMessage["metadata"]>["media"];
  inProgressRuns?: ChatImageGenerationRun[];
};

type LightboxImage = {
  src: string;
  alt: string;
};

export function ChatMessageImages({
  media,
  inProgressRuns = [],
}: ChatMessageImagesProps) {
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(
    null
  );

  const images = useMemo(
    () => media?.filter((m) => m.type === "image") ?? [],
    [media]
  );

  const hasRuns = inProgressRuns.length > 0;
  const hasMedia = images.length > 0;

  if (!hasMedia && !hasRuns) return null;

  return (
    <>
      <div className="grid gap-[4px] mt-3 grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {images?.map((img) => (
          <button
            key={img.id}
            onClick={() =>
              setLightboxImage({
                src: getMediaImageUrl(img.id, "full"),
                alt: "Message image",
              })
            }
            className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-secondary hover:opacity-90 transition-opacity"
          >
            <img
              src={getMediaImageUrl(img.id, "thumb")}
              alt="Message image"
              className="object-cover object-top w-full h-full"
            />
          </button>
        ))}

        {inProgressRuns.map((run) => {
          const imageUrl = run.output?.imageUrl ?? undefined;
          const status = run.status ?? "PENDING";
          const isComplete = status === "COMPLETED" && !!imageUrl;
          const isFailed =
            status === "FAILED" ||
            status === "CANCELED" ||
            status === "CRASHED" ||
            status === "SYSTEM_FAILURE" ||
            status === "TIMED_OUT";

          if (isComplete && imageUrl) {
            return (
              <button
                key={run.runId}
                onClick={() =>
                  setLightboxImage({ src: imageUrl, alt: "Generated image" })
                }
                className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-secondary hover:opacity-90 transition-opacity"
              >
                <img
                  src={imageUrl}
                  alt="Generated image"
                  className="object-cover object-top w-full h-full"
                />
              </button>
            );
          }

          return (
            <div
              key={run.runId}
              className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-secondary"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {isFailed ? (
                  <div className="flex flex-col items-center gap-2 text-red-400">
                    <ImageBrokenIcon size={28} weight="duotone" />
                    <div className="text-xs">{getImageGenerationErrorMessage(run.errorCode)}</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <MiniWaveLoader size="md" aria-label="Generating image" />
                    <div className="text-xs text-muted-foreground">
                      Generating image…
                    </div>
                  </div>
                )}
              </div>
              <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900" />
            </div>
          );
        })}
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              width={1024}
              height={1024}
              className="object-contain max-w-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
