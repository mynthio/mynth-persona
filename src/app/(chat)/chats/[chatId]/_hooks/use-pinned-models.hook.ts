"use client";

import { useLocalStorage } from "@uidotdev/usehooks";
import { useCallback, useMemo } from "react";

const STORAGE_KEY = "pinned-models";

export function usePinnedModels() {
  const [pinnedModelIds, setPinnedModelIds] = useLocalStorage<string[]>(
    STORAGE_KEY,
    [],
  );

  const isPinned = useCallback(
    (modelId: string) => pinnedModelIds.includes(modelId),
    [pinnedModelIds],
  );

  const canPin = useCallback(
    () => true,
    [],
  );

  const togglePin = useCallback(
    (modelId: string) => {
      setPinnedModelIds((current) => {
        if (current.includes(modelId)) {
          return current.filter((id) => id !== modelId);
        }

        return [...current, modelId];
      });
    },
    [setPinnedModelIds],
  );

  return useMemo(
    () => ({
      pinnedModelIds,
      isPinned,
      canPin,
      togglePin,
    }),
    [pinnedModelIds, isPinned, canPin, togglePin],
  );
}
