import { db } from "@/db/drizzle";
import { scenarios } from "@/db/schema";
import { and, desc, eq, lt, or } from "drizzle-orm";

export const SCENARIOS_PER_PAGE = 50;

export type ScenarioCursor = {
  id: string;
  createdAt: Date;
};

export type GetPaginatedScenariosParams = {
  userId: string;
  cursor?: ScenarioCursor;
};

export type PaginatedScenariosResult = {
  data: Array<{
    id: string;
    title: string;
    visibility: "private" | "public" | "deleted";
    backgroundImageUrl: string | null;
    createdAt: Date;
  }>;
  nextCreatedAt: string | null;
  nextId: string | null;
  hasMore: boolean;
};

export const getPaginatedScenarios = async (
  params: GetPaginatedScenariosParams
): Promise<PaginatedScenariosResult> => {
  const { userId, cursor } = params;

  const baseCondition = eq(scenarios.creatorId, userId);

  const paginationCondition = cursor
    ? or(
        lt(scenarios.createdAt, cursor.createdAt),
        and(
          eq(scenarios.createdAt, cursor.createdAt),
          lt(scenarios.id, cursor.id)
        )
      )
    : undefined;

  const conditions = [baseCondition, paginationCondition].filter(
    (c): c is NonNullable<typeof c> => c != null
  );
  const whereCondition = and(...conditions);

  const data = await db
    .select({
      id: scenarios.id,
      title: scenarios.title,
      visibility: scenarios.visibility,
      backgroundImageUrl: scenarios.backgroundImageUrl,
      createdAt: scenarios.createdAt,
    })
    .from(scenarios)
    .where(whereCondition)
    .orderBy(desc(scenarios.createdAt), desc(scenarios.id))
    .limit(SCENARIOS_PER_PAGE + 1);

  const hasMore = data.length > SCENARIOS_PER_PAGE;
  const pageRows = data.slice(0, SCENARIOS_PER_PAGE);

  let nextCreatedAt: string | null = null;
  let nextId: string | null = null;
  if (hasMore && pageRows.length > 0) {
    const lastItem = pageRows[pageRows.length - 1]!;
    nextCreatedAt = lastItem.createdAt?.toISOString() ?? null;
    nextId = lastItem.id ?? null;
  }

  return {
    data: pageRows,
    nextCreatedAt,
    nextId,
    hasMore,
  };
};
