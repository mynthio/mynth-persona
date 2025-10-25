import * as React from "react";

import { cn } from "@/lib/utils";
import { Switch as SwitchPrimitive } from "@base-ui-components/react/switch";

function SwitchRoot({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch-root"
      className={cn(
        "inline-flex h-[28px] w-[48px] shrink-0 cursor-pointer items-center rounded-[14px] border-[2px] border-surface-200 bg-surface-100 transition-colors",
        "hover:bg-surface-200",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:border-surface-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[checked]:bg-primary data-[checked]:border-primary",
        "data-[checked]:hover:bg-primary/90",
        className
      )}
      {...props}
    />
  );
}

function SwitchThumb({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Thumb>) {
  return (
    <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className={cn(
        "pointer-events-none block h-[20px] w-[20px] rounded-[10px] bg-white shadow-sm transition-transform",
        "translate-x-[2px]",
        "data-[checked]:translate-x-[22px]",
        className
      )}
      {...props}
    />
  );
}

const Switch = {
  Root: SwitchRoot,
  Thumb: SwitchThumb,
};

export { Switch };
