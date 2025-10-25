"use client";

import * as React from "react";
import { ScrollArea as BUScrollArea } from "@base-ui-components/react/scroll-area";

import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof BUScrollArea.Root>
>(({ className, children, ...props }, ref) => {
  return (
    <BUScrollArea.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <BUScrollArea.Viewport
        ref={ref}
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1 overflow-y-auto overscroll-contain touch-pan-y min-h-0 max-h-full"
      >
        {children}
      </BUScrollArea.Viewport>
      <ScrollBar />
      <BUScrollArea.Corner />
    </BUScrollArea.Root>
  );
});

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof BUScrollArea.Scrollbar>) {
  return (
    <BUScrollArea.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors duration-200 ease-in-out",
        orientation === "vertical" &&
          "h-full w-1.5 border-l border-l-transparent p-[1px] hover:w-2.5",
        orientation === "horizontal" &&
          "h-1.5 flex-col border-t border-t-transparent p-[1px] hover:h-2.5",
        className
      )}
      {...props}
    >
      <BUScrollArea.Thumb
        data-slot="scroll-area-thumb"
        className="bg-primary/30 hover:bg-primary/70 relative flex-1 rounded-full transition-colors duration-200"
      />
    </BUScrollArea.Scrollbar>
  );
}

ScrollArea.displayName = "ScrollArea";

export { ScrollArea, ScrollBar };
