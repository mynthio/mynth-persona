import { useQueryState } from "nuqs";

// Search param for editing a message
// Example: ?edit_msg=msg_123
export const useEditMessage = () => {
  return useQueryState("edit_msg");
};