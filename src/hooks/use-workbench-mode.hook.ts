import { useQueryState } from "nuqs";

export const useWorkbenchMode = () => {
  return useQueryState("wb_mode", {
    defaultValue: "creator",
    clearOnDefault: true,
  });
};
