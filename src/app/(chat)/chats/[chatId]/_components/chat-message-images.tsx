"use client";

import { Image03Icon, ImageNotFound02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";
import { getMediaImageUrl } from "@/lib/utils";
import { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";
import type { ChatImageGenerationRun } from "@/stores/chat-image-generation.store";
import { Spinner } from "@/components/ui/spinner";
import { getImageGenerationErrorMessage } from "@/lib/image-generation-errors";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateChatAction } from "@/actions/update-chat.action";
import { useChatMain } from "../_contexts/chat-main.context";
import { toast } from "sonner";

type ChatMessageImagesProps = {
  media?: NonNullable<PersonaUIMessage["metadata"]>["media"];
  inProgressRuns?: ChatImageGenerationRun[];
};

type LightboxImage = {
  src: string;
  alt: string;
  mediaId?: string;
};

export function ChatMessageImages({
  media,
  inProgressRuns = [],
}: ChatMessageImagesProps) {
  const { chatId, settings, setSettings } = useChatMain();
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(
    null
  );
  const [isSettingSceneImage, setIsSettingSceneImage] = useState(false);

  const images = useMemo(
    () => media?.filter((m) => m.type === "image") ?? [],
    [media]
  );

  const hasRuns = inProgressRuns.length > 0;
  const hasMedia = images.length > 0;

  const handleSetAsSceneImage = async () => {
    if (!lightboxImage?.mediaId) return;

    setIsSettingSceneImage(true);
    try {
      await updateChatAction(chatId, {
        settings: {
          sceneImageMediaId: lightboxImage.mediaId,
        },
      });

      // Update local settings state
      setSettings({
        ...settings,
        sceneImageMediaId: lightboxImage.mediaId,
      });

      toast.success("Scene image updated", {
        description: "This image is now set as the scene image for this chat.",
      });
    } catch (error) {
      console.error("Failed to set scene image:", error);
      toast.error("Failed to set scene image", {
        description: "An error occurred while updating the scene image.",
      });
    } finally {
      setIsSettingSceneImage(false);
    }
  };

  if (!hasMedia && !hasRuns) return null;

  return (
    <>
      <div className="grid gap-2 mt-4 grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {images?.map((img) => (
          <button
            key={img.id}
            onClick={() =>
              setLightboxImage({
                src: getMediaImageUrl(img.id, "full"),
                alt: "Message image",
                mediaId: img.id,
              })
            }
            className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted"
          >
            <img
              src={getMediaImageUrl(img.id, "thumb")}
              alt="Message image"
              className="object-cover object-top w-full h-full"
            />
          </button>
        ))}

        {inProgressRuns.map((run) => {
          const status = run.status ?? "PENDING";
          const isFailed =
            status === "FAILED" ||
            status === "CANCELED" ||
            status === "CRASHED" ||
            status === "SYSTEM_FAILURE" ||
            status === "TIMED_OUT";

          // Handle multi-image output (completed)
          if (
            run.output?.images &&
            run.output.images.length > 0 &&
            status === "COMPLETED"
          ) {
            const completedImages = run.output.images.map((img, index) => (
              <button
                key={`${run.runId}-${index}`}
                onClick={() =>
                  setLightboxImage({
                    src: img.imageUrl,
                    alt: "Generated image",
                    mediaId: img.mediaId,
                  })
                }
                className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted"
              >
                <img
                  src={img.imageUrl}
                  alt="Generated image"
                  className="object-cover object-top w-full h-full"
                />
              </button>
            ));

            // If we have fewer images than expected, render error tiles for missing ones
            const missingCount =
              run.expectedImageCount - run.output.images.length;
            if (missingCount > 0) {
              const errorTiles = Array.from({ length: missingCount }).map(
                (_, index) => (
                  <div
                    key={`${run.runId}-failed-${index}`}
                    className="relative w-full aspect-square rounded-2xl overflow-hidden bg-linear-to-t from-muted to-muted/60"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2 text-destructive p-4 text-center">
                        <HugeiconsIcon icon={ImageNotFound02Icon} strokeWidth={1.5} />
                        <div className="text-xs font-medium">
                          Failed to generate
                        </div>
                      </div>
                    </div>
                  </div>
                )
              );
              return [...completedImages, ...errorTiles];
            }

            return completedImages;
          }

          // Fallback to legacy single-image output (completed)
          const imageUrl = run.output?.imageUrl ?? undefined;
          const mediaId = run.output?.mediaId ?? undefined;
          const isComplete = status === "COMPLETED" && !!imageUrl;

          if (isComplete && imageUrl) {
            return (
              <button
                key={run.runId}
                onClick={() =>
                  setLightboxImage({
                    src: imageUrl,
                    alt: "Generated image",
                    mediaId: mediaId,
                  })
                }
                className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted"
              >
                <img
                  src={imageUrl}
                  alt="Generated image"
                  className="object-cover object-top w-full h-full"
                />
              </button>
            );
          }

          // Render loading/failed tiles for each expected image
          return Array.from({ length: run.expectedImageCount }).map(
            (_, index) => (
              <div
                key={`${run.runId}-loading-${index}`}
                className="relative w-full aspect-square rounded-2xl overflow-hidden bg-linear-to-t from-muted to-muted/60"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {isFailed ? (
                    <div className="flex flex-col items-center gap-2 text-destructive p-4 text-center">
                      <HugeiconsIcon icon={ImageNotFound02Icon} strokeWidth={1.5} />
                      <div className="text-xs font-medium">
                        {getImageGenerationErrorMessage(run.errorCode)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Spinner />
                    </div>
                  )}
                </div>
              </div>
            )
          );
        })}
      </div>

      <Dialog
        open={!!lightboxImage}
        onOpenChange={(open) => !open && setLightboxImage(null)}
      >
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-transparent"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Image viewer</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center">
            {lightboxImage && (
              <>
                <img
                  src={lightboxImage.src}
                  alt={lightboxImage.alt}
                  className="max-w-full max-h-[95vh] object-contain rounded-lg"
                  onClick={() => setLightboxImage(null)}
                />
                {lightboxImage.mediaId && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-4 right-4 gap-2 shadow-lg backdrop-blur-sm bg-background/80 hover:bg-background/90"
                    onClick={handleSetAsSceneImage}
                    disabled={isSettingSceneImage}
                  >
                    <HugeiconsIcon icon={Image03Icon} className="size-4" strokeWidth={1.5} />
                    {isSettingSceneImage ? "Setting..." : "Set as Scene Image"}
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
