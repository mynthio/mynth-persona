import { useQueryState } from "nuqs";

export const useWorkbenchGallerySidebarMode = () => {
  return useQueryState("wbg", {
    defaultValue: "imagine",
    clearOnDefault: true,
  });
};