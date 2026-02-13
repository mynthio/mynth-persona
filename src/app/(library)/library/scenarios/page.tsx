import { ArrowRight01Icon, File01Icon, Sad01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { db } from "@/db/drizzle";
import { scenarios } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, ne, lt, or, ilike } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  Item,
  ItemGroup,
  ItemSeparator,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Buffer } from "buffer";

const SCENARIOS_PER_PAGE = 20;

type ScenarioListItem = {
  id: string;
  title: string | null;
  backgroundImageUrl: string | null;
  createdAt: Date | null;
};

type Cursor = {
  id: string;
  createdAt: string;
};

type CursorStackEntry = Cursor | null;

type PaginatedScenariosResult = {
  data: ScenarioListItem[];
  nextCursor: Cursor | null;
  hasMore: boolean;
};

function encodeStack(stack: CursorStackEntry[]): string | null {
  if (!stack.length) return null;
  const json = JSON.stringify(stack);
  return Buffer.from(json, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeStack(value?: string): CursorStackEntry[] {
  if (!value) return [];
  try {
    const normalized = value
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(value.length / 4) * 4, "=");
    const json = Buffer.from(normalized, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => {
      if (
        entry &&
        typeof entry === "object" &&
        typeof entry.id === "string" &&
        typeof entry.createdAt === "string"
      ) {
        return {
          id: entry.id,
          createdAt: entry.createdAt,
        } satisfies Cursor;
      }
      return null;
    });
  } catch {
    return [];
  }
}

async function getScenarios(
  userId: string,
  cursorCreatedAt?: string,
  cursorId?: string,
  searchQuery?: string
): Promise<PaginatedScenariosResult> {
  let cursor:
    | {
        id: string;
        createdAt: Date;
      }
    | undefined;
  if (cursorCreatedAt && cursorId) {
    const createdAtDate = new Date(cursorCreatedAt);
    if (!isNaN(createdAtDate.getTime())) {
      cursor = { id: cursorId, createdAt: createdAtDate };
    }
  }

  const searchCondition = searchQuery
    ? ilike(scenarios.title, `%${searchQuery}%`)
    : undefined;

  const baseCondition = and(
    eq(scenarios.creatorId, userId),
    ne(scenarios.visibility, "deleted"),
    searchCondition
  );

  const whereCondition = cursor
    ? and(
        baseCondition,
        or(
          lt(scenarios.createdAt, cursor.createdAt),
          and(
            eq(scenarios.createdAt, cursor.createdAt),
            lt(scenarios.id, cursor.id)
          )
        )
      )
    : baseCondition;

  const data = await db
    .select({
      id: scenarios.id,
      title: scenarios.title,
      backgroundImageUrl: scenarios.backgroundImageUrl,
      createdAt: scenarios.createdAt,
    })
    .from(scenarios)
    .where(whereCondition)
    .orderBy(desc(scenarios.createdAt), desc(scenarios.id))
    .limit(SCENARIOS_PER_PAGE + 1);

  const hasMore = data.length > SCENARIOS_PER_PAGE;
  const pageRows = data.slice(0, SCENARIOS_PER_PAGE);

  let nextCursor: Cursor | null = null;
  if (hasMore && pageRows.length > 0) {
    const lastItem = pageRows[pageRows.length - 1]!;
    nextCursor = lastItem.createdAt
      ? {
          id: lastItem.id,
          createdAt: lastItem.createdAt.toISOString(),
        }
      : null;
  }

  return {
    data: pageRows,
    nextCursor,
    hasMore,
  };
}

type ScenariosPageSearchParams = {
  cursorCreatedAt?: string;
  cursorId?: string;
  stack?: string;
  query?: string;
};

type ScenariosPageProps = {
  searchParams: Promise<ScenariosPageSearchParams>;
};

export default async function ScenariosPage({
  searchParams,
}: ScenariosPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const params = await searchParams;
  const { cursorCreatedAt, cursorId, stack: stackParam, query } = params;

  const stack = decodeStack(stackParam);

  const result = await getScenarios(userId, cursorCreatedAt, cursorId, query);

  const currentCursor: CursorStackEntry =
    cursorCreatedAt && cursorId
      ? {
          id: cursorId,
          createdAt: cursorCreatedAt,
        }
      : null;

  const hasPreviousPage = stack.length > 0 || (!!cursorCreatedAt && !!cursorId);

  const previousHref = (() => {
    if (!hasPreviousPage) {
      return null;
    }

    if (!stack.length) {
      if (!query) {
        return "/library/scenarios";
      }
      const search = new URLSearchParams();
      search.set("query", query);
      return `/library/scenarios?${search.toString()}`;
    }

    const newStack = [...stack];
    const last = newStack.pop() ?? null;

    if (!last) {
      if (!query) {
        return "/library/scenarios";
      }
      const baseSearch = new URLSearchParams();
      baseSearch.set("query", query);
      return `/library/scenarios?${baseSearch.toString()}`;
    }

    const encodedStack = encodeStack(newStack);
    const search = new URLSearchParams();
    search.set("cursorCreatedAt", last.createdAt);
    search.set("cursorId", last.id);
    if (encodedStack) {
      search.set("stack", encodedStack);
    }
    if (query) {
      search.set("query", query);
    }

    return `/library/scenarios?${search.toString()}`;
  })();

  const nextHref = (() => {
    if (!result.hasMore || !result.nextCursor) {
      return null;
    }

    const nextStack = encodeStack([...stack, currentCursor]);

    const search = new URLSearchParams();
    search.set("cursorCreatedAt", result.nextCursor.createdAt);
    search.set("cursorId", result.nextCursor.id);
    if (nextStack) {
      search.set("stack", nextStack);
    }
    if (query) {
      search.set("query", query);
    }

    return `/library/scenarios?${search.toString()}`;
  })();

  return (
    <div className="w-full h-full max-w-4xl mx-auto px-4 py-8 md:px-6 md:py-10">
      <div className="space-y-3">
        <form action="/library/scenarios" className="w-full px-2">
          <InputGroup>
            <InputGroupInput
              name="query"
              placeholder="Search scenarios..."
              defaultValue={query ?? ""}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit">
                <HugeiconsIcon icon={Search01Icon}
                  strokeWidth={1.5}
                  className="size-4 text-muted-foreground"
                />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>

        {result.data.length === 0 ? (
          <Empty className="rounded-xl bg-linear-to-br from-background/80 via-card/80 to-muted/60 backdrop-blur-sm">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-14">
                <HugeiconsIcon icon={Sad01Icon}
                  strokeWidth={1.5}
                  className="size-8 text-muted-foreground"
                />
              </EmptyMedia>
              <EmptyTitle>No scenarios yet</EmptyTitle>
              <EmptyDescription>
                Create your first scenario to get started with roleplay and
                storytelling.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" size="sm" asChild>
                <Link href="/scenarios/creator">Create Scenario</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <div className="rounded-xl border bg-card/40 backdrop-blur-sm shadow-sm">
              <ItemGroup>
                {result.data.map((scenario, index) => (
                  <div key={scenario.id}>
                    <Item variant="default" asChild>
                      <Link href={`/scenarios/${scenario.id}`}>
                        <ItemMedia variant="image">
                          {scenario.backgroundImageUrl ? (
                            <img
                              src={scenario.backgroundImageUrl}
                              alt={scenario.title || "Scenario"}
                              className="size-10 rounded-sm object-cover"
                            />
                          ) : (
                            <div className="size-10 rounded-sm border border-border bg-linear-to-br from-muted/50 to-background/60 flex items-center justify-center">
                              <HugeiconsIcon icon={File01Icon}
                                className="size-5 text-muted-foreground"
                                strokeWidth={1.5}
                              />
                            </div>
                          )}
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>
                            {scenario.title || "Untitled Scenario"}
                          </ItemTitle>
                          <ItemDescription>
                            Created{" "}
                            {scenario.createdAt
                              ? new Date(scenario.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )
                              : "recently"}
                          </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <HugeiconsIcon icon={ArrowRight01Icon}
                            strokeWidth={1.5}
                            className="size-4 text-muted-foreground"
                          />
                        </ItemActions>
                      </Link>
                    </Item>
                    {index < result.data.length - 1 && <ItemSeparator />}
                  </div>
                ))}
              </ItemGroup>
            </div>

            {(result.hasMore || hasPreviousPage) && (
              <Pagination className="mt-4">
                <PaginationContent>
                  {hasPreviousPage && previousHref && (
                    <PaginationItem>
                      <PaginationPrevious href={previousHref} />
                    </PaginationItem>
                  )}
                  {nextHref && (
                    <PaginationItem>
                      <PaginationNext href={nextHref} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
}
