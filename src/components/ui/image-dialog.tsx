"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

function ImageDialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="image-dialog" {...props} />;
}

function ImageDialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="image-dialog-portal" {...props} />;
}

function ImageDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="image-dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
}

type ImageDialogContentProps = React.ComponentProps<
  typeof DialogPrimitive.Content
> & {
  image: React.ReactNode;
  box: React.ReactNode;
  showCloseButton?: boolean;
  title?: React.ReactNode;
};

function ImageDialogContent({
  className,
  image,
  box,
  showCloseButton = true,
  title = "Image dialog",
  children,
  ...props
}: ImageDialogContentProps) {
  return (
    <ImageDialogPortal data-slot="image-dialog-portal">
      <ImageDialogOverlay />
      <DialogPrimitive.Content
        data-slot="image-dialog-content"
        className={cn(
          // Positioning + animations similar to shadcn but without default panel UI
          "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-[min(96vw,1120px)] outline-hidden",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
      >
        {/* Hidden accessible title for screen readers */}
        <DialogPrimitive.Title className="sr-only">
          {title}
        </DialogPrimitive.Title>
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="image-dialog-close"
            aria-label="Close dialog"
            className={cn(
              "absolute top-3 right-3 md:-top-3 md:-right-3 md:translate-x-1/2 md:-translate-y-1/2 z-50",
              "rounded-full border border-border/60 bg-background/80 backdrop-blur text-foreground/80",
              "hover:text-foreground hover:bg-background/90",
              "shadow-sm transition-colors",
              "p-2",
              "focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            )}
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
        {/* Responsive layout: mobile stacked with normal scroll; desktop split with right pane scroll */}
        <div
          className={cn(
            "relative mx-4 sm:mx-0 gap-4",
            // Mobile: stacked, normal scroll within dialog content area
            "flex flex-col max-h-[calc(100vh-56px)] overflow-y-auto",
            // Desktop+: split layout, fixed height, no outer scroll
            "md:grid md:grid-cols-[1.2fr_1fr] md:items-stretch md:h-[calc(100vh-56px)] md:overflow-hidden"
          )}
        >
          {/* Left: Image */}
          <div className="min-h-0 md:h-full">
            <div className="h-full w-full rounded-2xl overflow-hidden">
              {/* Consumers should ensure the image/content fits. Common: img className=\"w-full h-full object-contain\" */}
              {image}
            </div>
          </div>

          {/* Right: Info box (scrolls on desktop) */}
          <div className="md:h-full md:overflow-hidden">
            <div className="rounded-2xl border border-border bg-surface p-0 shadow-sm md:h-full">
              <ScrollArea className="h-auto md:h-full">
                <div className="p-4">{box}</div>
              </ScrollArea>
            </div>
          </div>
        </div>
        {children}
      </DialogPrimitive.Content>
    </ImageDialogPortal>
  );
}

export {
  ImageDialog,
  ImageDialogOverlay,
  ImageDialogPortal,
  ImageDialogContent,
};
