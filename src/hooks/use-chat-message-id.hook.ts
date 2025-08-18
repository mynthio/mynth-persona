import { useQueryState } from "nuqs";

// Search param for opening the chat image modal
// Example: ?chat_message_id=msg_123
export const useChatMessageId = () => {
  return useQueryState("chat_message_id");
};