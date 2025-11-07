"use client";

import { useEffect, useMemo } from "react";
import { useRun } from "@trigger.dev/react-hooks";
import ms from "ms";
import { useChatImageGenerationStore } from "@/stores/chat-image-generation.store";

type ChatSettingsSceneImageInProgressProps = {
  runId: string;
  publicAccessToken: string;
  chatId: string;
  onComplete: (sceneImageMediaId: string) => void;
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
): { mediaId?: string } | undefined => {
  if (!output || typeof output !== "object") {
    return undefined;
  }

  const maybeOutput = output as Record<string, unknown>;
  const mediaId =
    typeof maybeOutput.mediaId === "string" ? maybeOutput.mediaId : undefined;

  if (!mediaId) {
    return undefined;
  }

  return { mediaId };
};

export function ChatSettingsSceneImageInProgress({
  runId,
  publicAccessToken,
  chatId,
  onComplete,
}: ChatSettingsSceneImageInProgressProps) {
  const removeSceneImageGenerationRun = useChatImageGenerationStore(
    (state) => state.removeSceneImageGenerationRun
  );

  const { run } = useRun(runId, {
    accessToken: publicAccessToken,
    refreshInterval: ms("8s"),
  });

  const latestRunOutput = useMemo(() => parseRunOutput(run?.output), [run]);

  useEffect(() => {
    if (!run) return;

    console.log("Scene image run", run);

    const nextStatus = run.status ?? undefined;

    if (nextStatus === "COMPLETED" && latestRunOutput?.mediaId) {
      // Call the onComplete callback with the mediaId
      onComplete(latestRunOutput.mediaId);
      // Remove the run from the store
      removeSceneImageGenerationRun(runId);
    } else if (nextStatus && FAILURE_STATUSES.has(nextStatus)) {
      // Remove failed runs from the store
      removeSceneImageGenerationRun(runId);
    }
  }, [
    latestRunOutput,
    removeSceneImageGenerationRun,
    run,
    runId,
    onComplete,
  ]);

  return null;
}
