"use client";

import { Download04Icon, Loading02Icon, User03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useImageId } from "@/hooks/use-image-id.hook";
import { useParams } from "next/navigation";
import { ImageDialog, ImageDialogContent } from "@/components/ui/image-dialog";
import { MiniWaveLoader } from "@/components/ui/mini-wave-loader";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/utils";
import useSWR, { useSWRConfig } from "swr";
import { setPersonaProfileImage } from "@/actions/set-persona-profile-image.action";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { fetcher } from "@/lib/fetcher";
import {
  getModelDisplayName,
  getModelDimensions,
} from "@/config/shared/image-models";

export default function GalleryImageModal() {
  const [imageId, setImageId] = useImageId();
  const params = useParams<{ personaId: string }>();
  const personaId = params.personaId;
  const isOpen = Boolean(imageId);

  const { data, isLoading } = useSWR(
    isOpen && imageId ? `/api/images/${imageId}` : null,
    fetcher
  );
  const { mutate } = useSWRConfig();
  const [isSettingProfileImage, setIsSettingProfileImage] = useState(false);

  const fullUrl = useMemo(
    () => (imageId ? getImageUrl(imageId, "full") : null),
    [imageId]
  );

  const handleClose = () => setImageId(null);

  const handleDownload = () => {
    if (!imageId) return;
    const link = document.createElement("a");
    link.href = getImageUrl(imageId, "full");
    link.download = `${data?.persona?.title ?? "image"}.webp`;
    link.click();
  };

  const handleSetAsProfile = async () => {
    if (!imageId) return;
    setIsSettingProfileImage(true);
    try {
      await setPersonaProfileImage(imageId);
      toast.success("Success", {
        description: "Profile image updated",
      });
      if (personaId) mutate(`/api/personas/${personaId}`);
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to set profile image",
      });
    } finally {
      setIsSettingProfileImage(false);
    }
  };

  return (
    <ImageDialog
      open={isOpen}
      onOpenChange={(open) => (open ? null : handleClose())}
    >
      <ImageDialogContent
        title={data?.persona?.title ?? "Image"}
        image={
          <div className="relative h-full w-full p-4">
            {fullUrl && (
              <>
                <img
                  src={fullUrl}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover blur-lg scale-110"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-black/25" />
                <img
                  src={fullUrl!}
                  alt="Persona image"
                  className="relative z-10 w-full h-full object-contain select-none"
                  draggable={false}
                />
              </>
            )}
          </div>
        }
        box={
          isLoading ? (
            <div className="flex items-center justify-center py-5">
              <MiniWaveLoader size="md" aria-label="Loading details" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  {data?.generation?.tokensCost != null ? (
                    <span>{data.generation.tokensCost} credits</span>
                  ) : (
                    <span>&nbsp;</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleSetAsProfile}
                    disabled={!imageId || isSettingProfileImage}
                  >
                    {isSettingProfileImage ? (
                      <HugeiconsIcon icon={Loading02Icon} className="animate-spin" />
                    ) : (
                      <HugeiconsIcon icon={User03Icon} />
                    )}
                    {isSettingProfileImage ? "Setting…" : "Set as profile"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleDownload}
                    disabled={!imageId}
                  >
                    <HugeiconsIcon icon={Download04Icon} /> Download
                  </Button>
                </div>
              </div>

              {data?.generation && (
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Settings
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {data.generation.aiModel && (
                      <>
                        <div className="text-muted-foreground">Model</div>
                        <div>{getModelDisplayName(data.generation.aiModel)}</div>
                      </>
                    )}
                    {(() => {
                      const dimensions = getModelDimensions(
                        data.generation.aiModel
                      );
                      return dimensions ? (
                        <>
                          <div className="text-muted-foreground">Dimensions</div>
                          <div>
                            {dimensions.width} × {dimensions.height} px
                          </div>
                        </>
                      ) : null;
                    })()}
                    {data.generation.settings?.style && (
                      <>
                        <div className="text-muted-foreground">Style</div>
                        <div className="capitalize">
                          {data.generation.settings.style}
                        </div>
                      </>
                    )}
                    {data.generation.settings?.shotType && (
                      <>
                        <div className="text-muted-foreground">Shot</div>
                        <div className="capitalize">
                          {data.generation.settings.shotType}
                        </div>
                      </>
                    )}
                    {data.generation.settings?.quality && (
                      <>
                        <div className="text-muted-foreground">Quality</div>
                        <div className="capitalize">
                          {data.generation.settings.quality}
                        </div>
                      </>
                    )}
                    {data.visibility === "public" && data.nsfw && data.nsfw !== "sfw" && (
                      <>
                        <div className="text-muted-foreground">
                          Content Rating
                        </div>
                        <div className="capitalize">
                          {data.nsfw === "suggestive" ? "Suggestive" : data.nsfw === "explicit" ? "Explicit" : data.nsfw}
                        </div>
                      </>
                    )}
                    {data.generation.settings?.userNote && (
                      <>
                        <div className="text-muted-foreground">Note</div>
                        <div className="break-words">
                          {data.generation.settings.userNote}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        }
      />
    </ImageDialog>
  );
}
