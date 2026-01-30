"use client";

import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PersonaUIMessageMetadata } from "@/schemas/shared/messages/persona-ui-message.schema";
import { BookmarkIcon } from "lucide-react";

type DevCheckpointViewerProps = {
  checkpoint: NonNullable<PersonaUIMessageMetadata["checkpoint"]>;
};

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Dev-only component to view checkpoint summaries on messages.
 * Only renders in development environment.
 */
export function DevCheckpointViewer({ checkpoint }: DevCheckpointViewerProps) {
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const createdAt = checkpoint.createdAt
    ? formatDate(checkpoint.createdAt)
    : "Unknown";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full hover:bg-amber-500/20 transition-colors cursor-pointer"
        >
          <BookmarkIcon className="size-3" />
          <span>Checkpoint</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 max-h-[400px] overflow-auto"
        side="top"
        align="start"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-1.5">
              <BookmarkIcon className="size-4 text-amber-500" />
              Story Checkpoint
            </h4>
            <Badge variant="secondary" className="text-[10px]">
              {createdAt}
            </Badge>
          </div>

          {checkpoint.content ? (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/50 rounded-md p-3 border">
              {checkpoint.content}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">
              Checkpoint marked but summary not yet generated.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
