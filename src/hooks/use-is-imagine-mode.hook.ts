import { parseAsBoolean, useQueryState } from "nuqs";

export const useIsImagineMode = () => {
  return useQueryState("imagine", {
    parse: parseAsBoolean.withDefault(false).parse,
    defaultValue: false,
  });
};
