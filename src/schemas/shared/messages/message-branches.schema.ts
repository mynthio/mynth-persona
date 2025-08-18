import z from "zod/v4";

// Public/UI child entry under a parent message's branches (relaxed ID validation)
export const messageBranchesChildSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
});

export type MessageBranchesChild = z.infer<typeof messageBranchesChildSchema>;

// Public/UI map: parent message ID -> array of child branches
export const messageBranchesByParentSchema = z.record(
  z.string(),
  z.array(messageBranchesChildSchema)
);

export type MessageBranchesByParent = z.infer<
  typeof messageBranchesByParentSchema
>;
