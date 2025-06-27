import { parseAsBoolean, useQueryState } from "nuqs";

export const useIsPersonaPanelOpened = () => {
  return useQueryState("panel", parseAsBoolean.withDefault(false));
};
