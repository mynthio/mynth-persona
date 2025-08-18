import { useQueryState } from "nuqs";

export const useWorkbenchMode = () => {
  return useQueryState("workbench", {
    defaultValue: "persona",
    clearOnDefault: true,
  });
};
