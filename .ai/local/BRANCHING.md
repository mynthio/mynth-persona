# Branching: Summary & TODO Plan

Summary of decisions

- We will decouple branching from the message thread (supports branching for both user and assistant messages). The messages endpoint returns only the selected path (no sibling aggregation).
- A separate branching endpoint will return minimal sibling lists per parent (only id and createdAt), excluding groups with fewer than 2 children and excluding parent_id IS NULL to minimize payload.
- We will manage branch state entirely via SWR: a dedicated hook fetches and caches branch groups, and we mutate the SWR cache locally on regenerate so no refetch is required.
- For now we will not implement Vercel caching. We’ll design the endpoint to support it later (ETag/Cache-Control, revalidateTag on insert/finalize).
- Rendering checks per message: if branches[message.id] exists, use that data for branch UI. This keeps branch state independent of the AI SDK and prevents data loss.

Endpoint contract

- GET /api/chats/:chatId/branches → Record<parentId, Array<{ id: string; createdAt: string }>>
  - Includes only parents with COUNT(children) > 1, excludes parent_id IS NULL.
  - Future: add strong caching (ETag) and revalidation triggers when a new message/regen is inserted.

Backend TODOs

1. Implement route at src/app/api/chats/[chatId]/branches/route.ts
   - SQL (Drizzle):
     SELECT parent_id,
     json_agg(json_build_object('id', id, 'createdAt', created_at) ORDER BY created_at DESC) AS children
     FROM messages
     WHERE chat_id = $1 AND parent_id IS NOT NULL
     GROUP BY parent_id
     HAVING COUNT(\*) > 1;
   - Shape: return as a map keyed by parentId (string).
2. AuthZ: validate current user owns the chat (reuse existing patterns from messages route).
3. Indexes (migration):
   - CREATE INDEX IF NOT EXISTS idx_messages_chat_parent_created ON messages(chat_id, parent_id, created_at DESC);
   - Optional: CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at DESC);
4. (Future) Add caching surfaces: ETag/Last-Modified and Next revalidateTag on message create/finalize.

Frontend TODOs

1. New SWR hook useBranches(chatId):
   - key: `/api/chats/${chatId}/branches`
   - returns { data: Record<string, { id: string; createdAt: string }[]>, mutate }
2. Optimistic mutate on regenerate (no network call):
   - Insert/replace child under its parentId in the SWR cache; revalidate: false.
3. Thread rendering:
   - For any message m, check branches[m.id]; if present (length ≥ 2), render branch switcher from branches.
4. Types: add BranchGroups type and integrate with existing message types.
5. (Future) After server write completes, optionally revalidate to sync across devices; later switch to server-triggered revalidateTag.

Performance notes

- This split eliminates per-row subselects and reduces payloads. The thread endpoint is faster and the branches aggregation is a single grouped query that can be cached later. Memory footprint is minimal and scales with the number of branched parents, which is expected to be small in practice.
