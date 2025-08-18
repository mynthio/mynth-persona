import { useQueryState } from "nuqs";

export const useWorkbenchPersonaSidebarMode = () => {
  return useQueryState("wbp", {
    defaultValue: "creator",
    clearOnDefault: true,
  });
};
