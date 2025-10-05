"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";
import { rehypeDoubleQuotes } from "@/lib/markdown/rehype-double-quotes";

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, rehypePlugins, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      rehypePlugins={[rehypeDoubleQuotes, ...(rehypePlugins ?? [])]}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
