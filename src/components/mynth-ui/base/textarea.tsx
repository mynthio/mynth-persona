import * as React from "react";

import TextareaAutosizeComponent from "react-textarea-autosize";

import { cn } from "@/lib/utils";

const textareaStyles =
  "border-input placeholder:text-surface-foreground/60 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-white/80 px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-[0.95rem] font-mono";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaStyles, className)}
      {...props}
    />
  );
}

function TextareaAutosize({
  className,
  ...props
}: React.ComponentProps<typeof TextareaAutosizeComponent>) {
  return (
    <TextareaAutosizeComponent
      data-slot="textarea"
      className={cn(textareaStyles, "resize-none", className)}
      {...props}
    />
  );
}

export { Textarea, TextareaAutosize };
