import { z } from "zod/v4";

// Child entry within a branch group: a sibling message under the same parent
export const branchChildSchema = z.object({
  id: z.string().startsWith("msg_").length(26),
  createdAt: z.date(),
});

export type BranchChild = z.infer<typeof branchChildSchema>;

// Map of parent message ID -> array of its branched children (minimal payload)
export const branchesByParentSchema = z.record(
  z.string().startsWith("msg_").length(26),
  z.array(branchChildSchema)
);

export type BranchesByParent = z.infer<typeof branchesByParentSchema>;
