import { useQueryState } from "nuqs";

export const usePersonaId = () => {
  return useQueryState("persona_id");
};
