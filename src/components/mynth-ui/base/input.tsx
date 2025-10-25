import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "font-mono file:text-surface-foreground placeholder:text-surface-foreground/60 selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 rounded-[12px] border-[2px] border-surface-200 bg-white/80 px-[12px] h-[46px] text-surface-foreground transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-[0.95rem]",
        "focus-visible:border-surface-200 focus-visible:ring-primary/20 focus-visible:ring-[3px] focus-visible:text-surface-foreground",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };
