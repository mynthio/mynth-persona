import * as React from "react"
import TextareaAutosizeComponent from "react-textarea-autosize"

import { cn } from "@/lib/utils"

const textareaBaseStyles =
  "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaBaseStyles, className)}
      {...props}
    />
  )
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
  )
}

export { Textarea, TextareaAutosize }
