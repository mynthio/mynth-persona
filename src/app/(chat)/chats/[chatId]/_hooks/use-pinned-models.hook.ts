"use client";

import { useLocalStorage } from "@uidotdev/usehooks";
import { useCallback, useMemo } from "react";

const MAX_PINNED_MODELS = 5;
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
    () => pinnedModelIds.length < MAX_PINNED_MODELS,
    [pinnedModelIds],
  );

  const togglePin = useCallback(
    (modelId: string) => {
      setPinnedModelIds((current) => {
        if (current.includes(modelId)) {
          return current.filter((id) => id !== modelId);
        }

        if (current.length >= MAX_PINNED_MODELS) {
          return current;
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
      maxPinned: MAX_PINNED_MODELS,
    }),
    [pinnedModelIds, isPinned, canPin, togglePin],
  );
}
