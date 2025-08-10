import { useQueryState } from "nuqs";

export const useWorkbenchContent = () => {
  return useQueryState("wb_content", {
    defaultValue: "persona",
    clearOnDefault: true,
  });
};
