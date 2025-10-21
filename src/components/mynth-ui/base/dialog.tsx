import * as React from "react";

import { cn } from "@/lib/utils";
import { Dialog as DialogPrimitive } from "@base-ui-components/react/dialog";

type DialogPopupProps = React.ComponentProps<typeof DialogPrimitive.Popup> & {
  variant?: "centered" | "sheet";
};

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogTrigger({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      className={cn(className)}
      {...props}
    />
  );
}

function DialogBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Backdrop>) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 z-overlay bg-background/20 backdrop-blur-[1px] transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[starting-style]:backdrop-blur-none dark:opacity-70",
        className
      )}
      {...props}
    />
  );
}

function DialogPopup({
  className,
  variant = "centered",
  ...props
}: DialogPopupProps) {
  const base =
    "text-surface-foreground transition-all duration-250 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0";

  const centered = cn(
    "fixed z-dialog left-1/2 -mt-8 w-[800px] max-w-[calc(100vw-3rem)] h-[520px] max-h-[calc(100vh-3rem)]",
    "-translate-x-1/2 -translate-y-1/2",
    "top-[calc(50%+1.25rem*var(--nested-dialogs))]",
    "scale-[calc(1-0.03*var(--nested-dialogs))]",
    "data-[nested-dialog-open]:grayscale-100 data-[nested-dialog-open]:after:absolute data-[nested-dialog-open]:after:inset-0 data-[nested-dialog-open]:after:rounded-[inherit] data-[nested-dialog-open]:after:bg-background/10 data-[nested-dialog-open]:after:backdrop-blur-[1px]",
    "rounded-[32px] bg-surface p-[12px] px-[24px]",
    "outline-[3px] outline-background/5",
    "data-[ending-style]:scale-90 data-[starting-style]:scale-90",
    "flex flex-col"
  );

  const sheet = cn(
    "fixed z-dialog left-0 right-0 bottom-0 w-full max-w-[100vw] h-auto min-h-auto max-h-[70vh]",
    "rounded-t-[24px] bg-surface overflow-hidden",
    "scale-[calc(1-0.03*var(--nested-dialogs))]",
    "data-[nested-dialog-open]:after:absolute data-[nested-dialog-open]:after:inset-0 data-[nested-dialog-open]:after:rounded-[inherit] data-[nested-dialog-open]:after:bg-background/10 data-[nested-dialog-open]:after:backdrop-blur-[1px]",
    "data-[ending-style]:translate-y-[8%] data-[starting-style]:translate-y-[8%]"
  );

  return (
    <DialogPrimitive.Popup
      data-slot="dialog-popup"
      className={cn(base, variant === "centered" ? centered : sheet, className)}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-onest text-[1.2rem] font-[600] py-[12px]", className)}
      {...props}
    />
  );
}

function DialogClose({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      className={cn(
        "size-[36px] flex items-center justify-center transition-colors duration-150 hover:bg-surface-100 rounded-[12px]",
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-[0.9rem] text-surface-foreground/70", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogPortal,
  DialogTrigger,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogClose,
  DialogDescription,
};
