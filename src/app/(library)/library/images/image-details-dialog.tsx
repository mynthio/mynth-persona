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

export function ImageDetailsDialog() {
  const [imageId, setImageId] = useImageId();
  const isOpen = Boolean(imageId);

  const { data, isLoading } = useSWR(
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
                  <div className="absolute top-3 right-3 z-20">
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
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
