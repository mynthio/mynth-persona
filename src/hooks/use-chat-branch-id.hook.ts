import { useQueryState } from "nuqs";

// Search param for opening the branch previews dialog
// Example: ?chat_branch_id=msg_parent_123
export const useChatBranchId = () => {
  return useQueryState("chat_branch_id");
};