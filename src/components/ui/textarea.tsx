import * as React from "react";

import { cn } from "@/lib/utils";
import TextareaAutosizeComponent from "react-textarea-autosize";

const textareaBaseStyles =
  "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaBaseStyles, className)}
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
      className={cn(textareaBaseStyles, "resize-none", className)}
      {...props}
    />
  );
}

export { Textarea, TextareaAutosize };
