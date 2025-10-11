"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import { Streamdown, defaultRehypePlugins } from "streamdown";
import { rehypeDoubleQuotes } from "@/lib/markdown/rehype-double-quotes";

type ResponseProps = ComponentProps<typeof Streamdown>;

/**
 * Custom Response component that extends Streamdown with project-specific markdown processing.
 *
 * IMPORTANT: This file includes custom rehype plugins that must be preserved during AI Elements updates:
 * - rehypeDoubleQuotes: Wraps double-quoted text in <span class="md-doublequoted"> for custom styling
 *
 * When updating AI Elements, ensure this custom logic is maintained by keeping the rehypePlugins prop
 * with the custom plugins. The styling is applied in chat-messages.tsx via:
 * [&_span.md-doublequoted]:font-[500] [&_span.md-doublequoted]:text-black [&_span.md-doublequoted]:font-onest
 */
export const Response = memo(
  ({ className, rehypePlugins, ...props }: ResponseProps) => {
    // Ensure we have an array of plugins to work with
    const basePlugins = rehypePlugins ?? defaultRehypePlugins;
    const pluginsArray = Array.isArray(basePlugins) ? basePlugins : [];

    return (
      <Streamdown
        className={cn(
          "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          className
        )}
        rehypePlugins={[
          // Preserve default Streamdown plugins (security, raw HTML, KaTeX, etc.)
          ...pluginsArray,
          // Add custom double-quote wrapping for styled quotes in chat messages
          rehypeDoubleQuotes,
        ]}
        {...props}
      />
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
