import { useQueryState } from "nuqs";

export const useChatId = () => {
  return useQueryState("chat_id");
};
