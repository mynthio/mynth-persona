"use client";

import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageId } from "@/hooks/use-image-id.hook";
import { getImageUrl } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "@phosphor-icons/react/dist/ssr";
import { ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Download02, Download04, User03 } from "@untitledui/icons";

import {
  publishMediaAction,
  unpublishMediaAction,
} from "@/app/(art)/_actions/actions";
import { toast } from "sonner";
import { useState } from "react";
import { ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { PublishDialog } from "./publish-dialog";
import { EyeSlash } from "@phosphor-icons/react/dist/ssr";

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
        mutate(); // Refresh data to show published status if we add UI for it
      } else {
        toast.error(result.error || "Failed to publish image");
      }
    } catch (error) {
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
        mutate(); // Refresh data to show unpublished status
      } else {
        toast.error(result.error || "Failed to unpublish image");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsUnpublishing(false);
    }
  };

  const ActionButtons = ({
    className,
    variant = "default",
  }: {
    className?: string;
    variant?: "default" | "overlay";
  }) => {
    const isOverlay = variant === "overlay";
    const btnClass = isOverlay
      ? "bg-black/50 hover:bg-black/70 text-white border-none backdrop-blur-md"
      : "";

    return (
      <div className={cn("flex items-center gap-2", className)}>
        {data?.persona?.id && (
          <Button
            variant={isOverlay ? "outline" : "outline"}
            size={isOverlay ? "icon" : "default"}
            className={cn(btnClass)}
            asChild
          >
            <Link
              href={`/workbench/${data.persona.id}`}
              title="Open in Workbench"
            >
              {isOverlay ? (
                <ExternalLink className="size-5" />
              ) : (
                <>
                  <ExternalLink className="mr-2 size-4" />
                  Open in Workbench
                </>
              )}
            </Link>
          </Button>
        )}
        <Button
          variant={isOverlay ? "outline" : "outline"}
          size={isOverlay ? "icon" : "default"}
          onClick={handleDownload}
          disabled={!imageId}
          className={cn(btnClass)}
          title="Download Image"
        >
          {isOverlay ? (
            <DownloadIcon className="size-5" weight="duotone" />
          ) : (
            <>
              <DownloadIcon className="mr-2 size-4" weight="duotone" />
              Download Original
            </>
          )}
        </Button>
      </div>
    );
  };

  if (!isOpen) return null;

  // Check if already published (assuming data includes media info, if not we might need to update the fetcher or API)
  // The current /api/images/:id endpoint returns image details. We need to ensure it returns visibility.
  // Let's assume for now we can check data.visibility or similar if available, or just show the button and let server handle validation.
  // Better to show status if published.

  const isPublished = data?.visibility === "public";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogOverlay className="bg-background/70 backdrop-blur-[2px]" />
      <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0 bg-none bg-transparent border-none overflow-hidden flex flex-col outline-none">
        <DialogTitle className="sr-only">Image Details</DialogTitle>
        <Tabs defaultValue="image">
          <TabsList>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="image">
            <div className="relative w-full h-full flex items-center justify-center">
              {fullUrl && (
                <>
                  <img
                    src={fullUrl}
                    alt="Generated image"
                    className="relative z-10 w-full h-full object-contain rounded-xl"
                    draggable={false}
                  />

                  {/* Overlay Actions */}
                  <div className="absolute top-3 right-3 z-20 flex gap-2">
                    {!hidePublish &&
                      (isPublished ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleUnpublish}
                          disabled={isUnpublishing}
                          title="Unpublish from Art Gallery"
                        >
                          {isUnpublishing ? (
                            <Spinner className="size-4" />
                          ) : (
                            <EyeSlash className="size-5" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setPublishDialogOpen(true)}
                          disabled={isPublishing}
                          title="Publish to Art Gallery"
                        >
                          {isPublishing ? (
                            <Spinner className="size-4" />
                          ) : (
                            <ShareNetwork className="size-5" />
                          )}
                        </Button>
                      ))}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDownload}
                    >
                      <Download02 strokeWidth={1.5} />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="details"
            className="bg-card rounded-3xl p-2 md:p-3"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="size-8" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Main Actions in Details */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="w-full"
                  >
                    <Download02 strokeWidth={1.5} />
                    Download
                  </Button>

                  {data?.persona?.id && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link
                        href={`/workbench/${data.persona.id}`}
                        title="Open in Workbench"
                      >
                        <User03 strokeWidth={1.5} />
                        Go to Persona
                      </Link>
                    </Button>
                  )}

                  {!hidePublish &&
                    (isPublished ? (
                      <Button
                        variant="outline"
                        className="w-full col-span-2"
                        onClick={handleUnpublish}
                        disabled={isUnpublishing}
                      >
                        {isUnpublishing ? (
                          <Spinner className="mr-2 size-4" />
                        ) : (
                          <EyeSlash className="mr-2 size-4" />
                        )}
                        Unpublish from Art Gallery
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        className="w-full col-span-2"
                        onClick={() => setPublishDialogOpen(true)}
                        disabled={isPublishing}
                      >
                        {isPublishing ? (
                          <Spinner className="mr-2 size-4" />
                        ) : (
                          <ShareNetwork className="mr-2 size-4" />
                        )}
                        Publish to Art Gallery
                      </Button>
                    ))}
                </div>

                {data?.generation && (
                  <div className="flex flex-col gap-2">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Model
                      </span>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50 font-mono text-sm">
                        {data.generation.aiModel || "Unknown"}
                      </div>
                    </div>

                    {data.generation.settings?.style && (
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Style
                        </span>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm capitalize">
                          {data.generation.settings.style}
                        </div>
                      </div>
                    )}

                    {data.generation.settings?.shotType && (
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Shot Type
                        </span>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm capitalize">
                          {data.generation.settings.shotType}
                        </div>
                      </div>
                    )}

                    {data.generation.settings?.userNote && (
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Note
                        </span>
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm leading-relaxed">
                          {data.generation.settings.userNote}
                        </div>
                      </div>
                    )}

                    {data.tags && data.tags.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Tags
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {data.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-1 rounded-md bg-muted/50 border border-border/50 text-xs text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
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
