"use client";

import { useEffect, useMemo } from "react";
import { useRun } from "@trigger.dev/react-hooks";
import ms from "ms";
import { useChatImageGenerationStore } from "@/stores/chat-image-generation.store";
import type {
  ChatImageGenerationRun,
  ChatImageGenerationRunOutput,
} from "@/stores/chat-image-generation.store";

type ChatMessageImageInProgressProps = {
  run: ChatImageGenerationRun;
};

const FAILURE_STATUSES = new Set([
  "FAILED",
  "CANCELED",
  "CRASHED",
  "SYSTEM_FAILURE",
  "TIMED_OUT",
]);

const parseRunOutput = (
  output: unknown
): ChatImageGenerationRunOutput | undefined => {
  if (!output || typeof output !== "object") {
    return undefined;
  }

  const maybeOutput = output as Record<string, unknown>;
  const imageUrl =
    typeof maybeOutput.imageUrl === "string" ? maybeOutput.imageUrl : undefined;
  const mediaId =
    typeof maybeOutput.mediaId === "string" ? maybeOutput.mediaId : undefined;

  if (!imageUrl && !mediaId) {
    return undefined;
  }

  return { imageUrl, mediaId };
};

export function ChatMessageImageInProgress({
  run: runEntry,
}: ChatMessageImageInProgressProps) {
  const removeImageGenerationRun = useChatImageGenerationStore(
    (state) => state.removeImageGenerationRun
  );
  const updateImageGenerationRun = useChatImageGenerationStore(
    (state) => state.updateImageGenerationRun
  );

  const { run } = useRun(runEntry.runId, {
    accessToken: runEntry.publicAccessToken,
    refreshInterval: ms("8s"),
  });

  const latestRunOutput = useMemo(() => parseRunOutput(run?.output), [run]);

  useEffect(() => {
    if (!run) return;

    console.log("run", run);

    const nextStatus = run.status ?? undefined;
    const updates: Partial<ChatImageGenerationRun> = {};

    if (nextStatus && nextStatus !== runEntry.status) {
      updates.status = nextStatus;

      if (nextStatus === "COMPLETED" && !runEntry.completedAt) {
        updates.completedAt = Date.now();
      }
    }

    if (
      latestRunOutput &&
      (latestRunOutput.imageUrl !== runEntry.output?.imageUrl ||
        latestRunOutput.mediaId !== runEntry.output?.mediaId)
    ) {
      updates.output = latestRunOutput;
    }

    // Extract error code from run.error
    if (run.error && !runEntry.errorCode) {
      updates.errorCode = run.error.message;
    }

    if (Object.keys(updates).length > 0) {
      updateImageGenerationRun(runEntry.runId, updates);
    }
  }, [
    latestRunOutput,
    removeImageGenerationRun,
    run,
    runEntry.completedAt,
    runEntry.errorCode,
    runEntry.output?.imageUrl,
    runEntry.output?.mediaId,
    runEntry.runId,
    runEntry.status,
    updateImageGenerationRun,
  ]);

  return null;
}
