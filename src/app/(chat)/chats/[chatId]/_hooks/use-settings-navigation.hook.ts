"use client";

import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

// Possible navigation targets for settings
export type SettingsNav =
  | "_"
  | "settings"
  | "model"
  | "user"
  | "scenario"
  | "images";

const DEFAULT_OPEN_VALUE: SettingsNav = "_";

export const useSettingsNavigation = () => {
  const [state, setState] = useQueryState("s", {
    clearOnDefault: true,
  });

  // Open settings with default nav value
  const openSettings = useCallback(() => {
    setState(DEFAULT_OPEN_VALUE);
  }, [setState]);

  // Close settings (remove query state)
  const closeSettings = useCallback(() => {
    setState(null);
  }, [setState]);

  // Boolean open/close toggle API retained for compatibility
  const setSettingsOpen = useCallback(
    (value: boolean) => setState(value ? DEFAULT_OPEN_VALUE : null),
    [setState]
  );

  // Navigate to a specific section
  const navigateSettings = useCallback(
    (value: SettingsNav) => setState(value),
    [setState]
  );

  const areSettingsOpen = useMemo(() => state != null, [state]);
  const current = (state ?? null) as SettingsNav | null;

  return {
    // state
    current,
    areSettingsOpen,

    // controls
    openSettings,
    closeSettings,
    setSettingsOpen,

    // navigation
    navigateSettings,
  };
};
