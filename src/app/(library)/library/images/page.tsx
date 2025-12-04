import { db } from "@/db/drizzle";
import { media } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { Image02 } from "@untitledui/icons";
import { ImageDetailsDialog } from "./image-details-dialog";
import { getImageUrl } from "@/lib/utils";

const IMAGES_PER_PAGE = 60;

type Cursor = {
  id: string;
  createdAt: string;
};

type CursorStackEntry = Cursor | null;

type PaginatedImagesResult = {
  data: { id: string; title: string | null }[];
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

async function getImages(
  userId: string,
  cursorCreatedAt?: string,
  cursorId?: string
): Promise<PaginatedImagesResult> {
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

  const baseCondition = and(
    eq(media.userId, userId),
    eq(media.type, "image"),
    eq(media.visibility, "private") // Assuming library shows private images, adjust if needed
  );

  // We want to show all images, not just private ones, but user's images.
  // The schema has visibility enum, but usually library shows everything user owns.
  // Let's stick to userId check primarily.
  // Re-checking schema... media has visibility.
  // Let's just filter by userId and type=image for now, as per plan.
  // Wait, existing code in api/images/route.ts uses:
  // eq(media.type, "image"), eq(media.userId, userId)
  // It doesn't filter by visibility. So I will do the same.

  const whereCondition = cursor
    ? and(
        eq(media.userId, userId),
        eq(media.type, "image"),
        or(
          lt(media.createdAt, cursor.createdAt),
          and(eq(media.createdAt, cursor.createdAt), lt(media.id, cursor.id))
        )
      )
    : and(eq(media.userId, userId), eq(media.type, "image"));

  const data = await db.query.media.findMany({
    where: whereCondition,
    columns: {
      id: true,
      createdAt: true,
    },
    with: {
      persona: {
        columns: {
          title: true,
        },
      },
    },
    orderBy: [desc(media.createdAt), desc(media.id)],
    limit: IMAGES_PER_PAGE + 1,
  });

  const hasMore = data.length > IMAGES_PER_PAGE;
  const pageRows = data.slice(0, IMAGES_PER_PAGE);

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
    data: pageRows.map((row) => ({
      id: row.id,
      title: row.persona?.title ?? null,
    })),
    nextCursor,
    hasMore,
  };
}

type ImagesPageSearchParams = {
  cursorCreatedAt?: string;
  cursorId?: string;
  stack?: string;
  image_id?: string;
};

type ImagesPageProps = {
  searchParams: Promise<ImagesPageSearchParams>;
};

export default async function ImagesPage({ searchParams }: ImagesPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const params = await searchParams;
  const { cursorCreatedAt, cursorId, stack: stackParam, image_id } = params;

  const stack = decodeStack(stackParam);

  const result = await getImages(userId, cursorCreatedAt, cursorId);

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
      return "/library/images";
    }

    const newStack = [...stack];
    const last = newStack.pop() ?? null;

    if (!last) {
      return "/library/images";
    }

    const encodedStack = encodeStack(newStack);
    const search = new URLSearchParams();
    search.set("cursorCreatedAt", last.createdAt);
    search.set("cursorId", last.id);
    if (encodedStack) {
      search.set("stack", encodedStack);
    }

    return `/library/images?${search.toString()}`;
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

    return `/library/images?${search.toString()}`;
  })();

  return (
    <div className="w-full h-full max-w-[1600px] mx-auto px-4 py-8 md:px-6 md:py-10">
      <div className="space-y-6">
        {result.data.length === 0 ? (
          <Empty className="rounded-xl bg-linear-to-br from-background/80 via-card/80 to-muted/60 backdrop-blur-sm">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-14">
                <Image02
                  strokeWidth={1.5}
                  className="size-8 text-muted-foreground"
                />
              </EmptyMedia>
              <EmptyTitle>No images yet</EmptyTitle>
              <EmptyDescription>
                Generate images with your personas to see them here.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" size="sm" asChild>
                <Link href="/library/personas">Go to Personas</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {result.data.map((img) => {
                const search = new URLSearchParams();
                if (cursorCreatedAt)
                  search.set("cursorCreatedAt", cursorCreatedAt);
                if (cursorId) search.set("cursorId", cursorId);
                if (stackParam) search.set("stack", stackParam);
                search.set("image_id", img.id);

                return (
                  <Link
                    key={img.id}
                    href={`?${search.toString()}`}
                    scroll={false}
                    className="aspect-square rounded-xl overflow-hidden relative group bg-muted/20 cursor-zoom-in"
                  >
                    <img
                      src={getImageUrl(img.id, "thumb")}
                      alt={img.title || "Generated image"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      draggable={false}
                    />
                  </Link>
                );
              })}
            </div>

            {(result.hasMore || hasPreviousPage) && (
              <Pagination className="mt-8">
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
      <ImageDetailsDialog />
    </div>
  );
}
