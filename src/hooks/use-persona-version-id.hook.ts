import { useQueryState } from "nuqs";

export const usePersonaVersionId = () => {
  return useQueryState("version_id");
};
