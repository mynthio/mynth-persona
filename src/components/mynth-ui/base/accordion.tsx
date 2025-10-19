import * as React from "react";

import { cn } from "@/lib/utils";
import { Accordion as AccordionPrimitive } from "@base-ui-components/react/accordion";

function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col text-surface-foreground", className)}
      {...props}
    />
  );
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b border-surface-200", className)}
      {...props}
    />
  );
}

function AccordionHeader({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Header>) {
  return (
    <AccordionPrimitive.Header
      data-slot="accordion-header"
      className={cn("m-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Trigger
      data-slot="accordion-trigger"
      className={cn(
        "group relative flex w-full items-center justify-between gap-3 bg-surface py-3 px-4 text-left font-medium outline-none transition-colors",
        "hover:bg-surface-100",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
        className
      )}
      {...props}
    />
  );
}

function AccordionPanel({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Panel>) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-panel"
      className={cn(
        "h-[var(--accordion-panel-height)] mt-[6px] overflow-hidden text-sm text-surface-foreground/70 transition-[height] ease-out",
        "data-[ending-style]:h-0 data-[starting-style]:h-0",
        className
      )}
      {...props}
    >
      <div className="px-4 pb-4">{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionPanel,
};
