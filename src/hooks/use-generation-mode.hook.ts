import { useQueryState } from "nuqs";

export const useGenerationMode = () => {
  return useQueryState("mode", {
    defaultValue: "creator",
  });
};
