import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "font-mono file:text-surface-foreground placeholder:text-surface-foreground/60 selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 rounded-[12px] border-[1px] border-surface-200/50 bg-surface-100 px-[12px] h-[42px] text-surface-foreground transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-[0.83rem]",
        "focus-visible:border-surface-200 focus-visible:ring-surface-foreground/10 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };
