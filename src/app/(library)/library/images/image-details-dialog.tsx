"use client";

import {
  Download02Icon,
  Share08Icon,
  User03Icon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useImageId } from "@/hooks/use-image-id.hook";
import { fetcher } from "@/lib/fetcher";
import { cn, getImageUrl } from "@/lib/utils";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "@/components/ui/link";
import {
  getModelDimensions,
  getModelDisplayName,
} from "@/config/shared/image-models";
import { X } from "lucide-react";

import {
  publishMediaAction,
  unpublishMediaAction,
} from "@/app/(art)/_actions/actions";
import { toast } from "sonner";
import { PublishDialog } from "./publish-dialog";

type DetailItem = {
  label: string;
  value: string;
};

const CONTENT_RATING_MAP: Record<string, string> = {
  suggestive: "Suggestive",
  explicit: "Explicit",
  sfw: "Safe for work",
};

export function ImageDetailsDialog({
  hidePublish = false,
}: {
  hidePublish?: boolean;
}) {
  const [imageId, setImageId] = useImageId();
  const isOpen = Boolean(imageId);

  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    isOpen && imageId ? `/api/images/${imageId}` : null,
    fetcher
  );

  const fullUrl = useMemo(
    () => (imageId ? getImageUrl(imageId, "full") : null),
    [imageId]
  );

  const dimensions = useMemo(
    () =>
      data?.generation?.aiModel
        ? getModelDimensions(data.generation.aiModel)
        : null,
    [data?.generation?.aiModel]
  );

  const detailItems = useMemo<DetailItem[]>(() => {
    if (!data?.generation) {
      return [];
    }

    const items: DetailItem[] = [];

    if (data.generation.aiModel) {
      items.push({
        label: "Model",
        value: getModelDisplayName(data.generation.aiModel),
      });
    }

    if (dimensions) {
      items.push({
        label: "Dimensions",
        value: `${dimensions.width} × ${dimensions.height} px`,
      });
    }

    if (data.generation.tokensCost != null) {
      items.push({
        label: "Cost",
        value: `${data.generation.tokensCost} credits`,
      });
    }

    if (data.generation.settings?.style) {
      items.push({
        label: "Style",
        value: data.generation.settings.style,
      });
    }

    if (data.generation.settings?.shotType) {
      items.push({
        label: "Shot Type",
        value: data.generation.settings.shotType,
      });
    }

    if (data.generation.settings?.quality) {
      items.push({
        label: "Quality",
        value: data.generation.settings.quality,
      });
    }

    if (data.generation.createdAt) {
      items.push({
        label: "Generated",
        value: new Date(data.generation.createdAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      });
    }

    if (data.visibility === "public" && data.nsfw && data.nsfw !== "sfw") {
      items.push({
        label: "Content Rating",
        value: CONTENT_RATING_MAP[data.nsfw] ?? data.nsfw,
      });
    }

    return items;
  }, [data, dimensions]);

  const isPublished = data?.visibility === "public";

  const handleClose = () => setImageId(null);

  const handleDownload = () => {
    if (!imageId) return;

    const link = document.createElement("a");
    link.href = getImageUrl(imageId, "full");
    link.download = `${data?.persona?.title ?? "image"}.webp`;
    link.click();
  };

  const handlePublish = async (isAnonymous: boolean) => {
    if (!imageId) return;

    setIsPublishing(true);
    try {
      const result = await publishMediaAction({
        mediaId: imageId,
        isCreatorAnonymous: isAnonymous,
      });

      if (result.success) {
        toast.success("Image published successfully!");
        setPublishDialogOpen(false);
        mutate();
      } else {
        toast.error(result.error || "Failed to publish image");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!imageId) return;

    setIsUnpublishing(true);
    try {
      const result = await unpublishMediaAction({
        mediaId: imageId,
      });

      if (result.success) {
        toast.success("Image unpublished successfully!");
        mutate();
      } else {
        toast.error(result.error || "Failed to unpublish image");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsUnpublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-3rem)] sm:max-w-[calc(100vw-3rem)] 2xl:w-[1500px] 2xl:max-w-[1500px] p-0 overflow-hidden border border-white/10 [&_button]:cursor-pointer [&_a[data-slot='button']]:cursor-pointer",
          "bg-black/90 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]",
          "backdrop-blur-xl"
        )}
      >
        <DialogTitle className="sr-only">Image details</DialogTitle>

        <div className="flex max-h-[90vh] flex-col lg:grid lg:h-[88vh] lg:grid-cols-[minmax(0,1.35fr)_400px]">
          <section className="relative h-[46vh] min-h-[280px] overflow-hidden border-b border-white/10 lg:h-auto lg:border-b-0 lg:border-r lg:border-r-white/10">
            {fullUrl && (
              <>
                <img
                  src={fullUrl}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover blur-2xl opacity-45"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/84 via-[#0a0914]/70 to-[#03030a]/90" />
                <div className="absolute inset-0 bg-[radial-gradient(120%_110%_at_15%_10%,rgba(124,92,230,0.16),transparent_58%)]" />
              </>
            )}

            <div className="relative z-10 flex h-full flex-col p-3 sm:p-5 lg:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[10px] font-medium tracking-[0.08em] text-white/82 uppercase backdrop-blur-md"
                    title={isPublished ? "Live in Art Gallery" : "Private Library"}
                  >
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        isPublished ? "bg-emerald-400" : "bg-zinc-300"
                      )}
                      aria-hidden
                    />
                    {isPublished ? "Live" : "Private"}
                  </div>
                  <h3 className="max-w-[30ch] text-lg font-semibold leading-tight text-white/95 sm:text-xl">
                    {data?.persona?.title || "Generated image"}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  {data?.persona?.id && (
                    <Button
                      asChild
                      variant="outline"
                      size="icon-sm"
                      className="border-white/20 bg-black/35 text-white hover:bg-black/65"
                      title="Go to Persona"
                    >
                      <Link href={`/workbench/${data.persona.id}`}>
                        <HugeiconsIcon icon={User03Icon} className="size-4" />
                      </Link>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={handleDownload}
                    className="border-white/20 bg-black/35 text-white hover:bg-black/65"
                    title="Download image"
                  >
                    <HugeiconsIcon icon={Download02Icon} className="size-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleClose}
                    className="text-white/85 hover:bg-white/15 hover:text-white"
                    title="Close"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="relative mt-3 flex min-h-0 flex-1 items-center justify-center">
                {fullUrl ? (
                  <img
                    src={fullUrl}
                    alt={data?.persona?.title || "Generated image"}
                    className="max-h-full max-w-full rounded-2xl border border-white/15 object-contain shadow-[0_30px_80px_-24px_rgba(0,0,0,0.9)]"
                    draggable={false}
                  />
                ) : (
                  <Spinner className="size-7 text-white" />
                )}
              </div>

            </div>
          </section>

          <section className="flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,rgba(24,24,28,0.95)_0%,rgba(15,15,18,0.98)_100%)]">
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-6 px-4 py-4 sm:px-5 sm:py-5">
                <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[11px] font-medium tracking-[0.16em] text-white/50 uppercase">
                    Actions
                  </p>

                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="w-full justify-start border-white/12 bg-transparent text-white/92 hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <HugeiconsIcon icon={Download02Icon} className="size-4" />
                    Download Original
                  </Button>

                  {data?.persona?.id && (
                    <Button
                      variant="outline"
                      className="w-full justify-start border-white/12 bg-transparent text-white/92 hover:border-white/20 hover:bg-white/[0.06]"
                      asChild
                    >
                      <Link href={`/workbench/${data.persona.id}`}>
                        <HugeiconsIcon icon={User03Icon} className="size-4" />
                        Go to Persona
                      </Link>
                    </Button>
                  )}

                  {!hidePublish &&
                    (isPublished ? (
                      <Button
                        variant="outline"
                        onClick={handleUnpublish}
                        disabled={isUnpublishing}
                        className="w-full justify-start border-white/12 bg-transparent text-white/92 hover:border-white/20 hover:bg-white/[0.06]"
                      >
                        {isUnpublishing ? (
                          <Spinner className="size-4" />
                        ) : (
                          <HugeiconsIcon icon={ViewOffSlashIcon} className="size-4" />
                        )}
                        Unpublish from Art Gallery
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setPublishDialogOpen(true)}
                        disabled={isPublishing}
                        className="w-full justify-start border-white/12 bg-transparent text-white/92 hover:border-white/20 hover:bg-white/[0.06]"
                      >
                        {isPublishing ? (
                          <Spinner className="size-4" />
                        ) : (
                          <HugeiconsIcon icon={Share08Icon} className="size-4" />
                        )}
                        Publish to Art Gallery
                      </Button>
                    ))}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-medium tracking-[0.16em] text-white/50 uppercase">
                      Image Information
                    </p>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                      <Spinner className="size-7" />
                    </div>
                  ) : detailItems.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {detailItems.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                        >
                          <p className="text-[11px] tracking-[0.14em] text-white/45 uppercase">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm text-white/90 capitalize">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
                      No generation details are available for this image.
                    </div>
                  )}

                  {data?.generation?.settings?.userNote && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] tracking-[0.14em] text-white/45 uppercase">
                        Note
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-white/85">
                        {data.generation.settings.userNote}
                      </p>
                    </div>
                  )}

                  {data?.tags && data.tags.length > 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] tracking-[0.14em] text-white/45 uppercase">
                        Tags
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {data.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-xs text-white/80"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </section>
        </div>
      </DialogContent>

      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        onPublish={handlePublish}
        isPublishing={isPublishing}
      />
    </Dialog>
  );
}
