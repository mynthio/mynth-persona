"use client";

import { useEffect, useCallback } from "react";
import { parseAsBoolean, useQueryState } from "nuqs";

const STORAGE_KEY = "show-nsfw";

/**
 * Hook that syncs a boolean URL query param with localStorage.
 * - On mount: reads from localStorage if no URL param is present
 * - On change: updates both URL param and localStorage
 * - SSR-safe: localStorage is only accessed in useEffect
 */
export function usePersistedNsfwFilter() {
  const [includeNsfw, setIncludeNsfwUrl] = useQueryState(
    "nsfw",
    parseAsBoolean.withDefault(false)
  );

  // On mount, sync from localStorage if no URL param
  useEffect(() => {
    // Check if URL already has the param (don't override explicit URL state)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("nsfw")) {
      // URL has explicit value, sync it to localStorage
      const urlValue = urlParams.get("nsfw") === "true";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(urlValue));
      return;
    }

    // No URL param, read from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      try {
        const value = JSON.parse(stored);
        if (value === true) {
          // Only set URL param if true (false is the default, no need to set)
          setIncludeNsfwUrl(true);
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [setIncludeNsfwUrl]);

  // Wrapper that updates both URL and localStorage
  const setIncludeNsfw = useCallback(
    (value: boolean) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      // Set to null if false to remove from URL (cleaner URLs)
      setIncludeNsfwUrl(value ? true : null);
    },
    [setIncludeNsfwUrl]
  );

  return [includeNsfw, setIncludeNsfw] as const;
}
