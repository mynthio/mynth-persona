import {
  Pagination,
  PaginationItem,
  PaginationContent,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { PersonaData } from "@/types/persona.type";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

const PERSONAS_PER_PAGE = 25;

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = "1" } = await searchParams;

  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const _personas = await db.query.personas.findMany({
    columns: {
      id: true,
      title: true,
      createdAt: true,
      profileImageId: true,
      currentVersionId: true,
    },
    with: {
      currentVersion: {
        columns: {
          id: true,
          data: true,
        },
      },
    },
    where: eq(personas.userId, userId),
    limit: PERSONAS_PER_PAGE,
    offset: (Number(page) - 1) * PERSONAS_PER_PAGE,
    orderBy: [desc(personas.createdAt)],
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light tracking-tight text-foreground mb-3">
            Persona Library
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            Your created personas
          </p>
        </div>

        {/* Personas Grid */}
        {_personas.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
                <div className="w-6 h-6 bg-muted-foreground/30 rounded"></div>
              </div>
              <h3 className="text-xl font-light text-foreground mb-2">
                No personas yet
              </h3>
              <p className="text-muted-foreground">
                Create your first persona to get started
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Create Persona
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-12">
              {_personas.map((persona) => (
                <PersonaCard key={persona.id} persona={persona as any} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  {Number(page) > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        href={`/library?page=${Number(page) - 1}`}
                      />
                    </PaginationItem>
                  )}

                  {Number(page) <
                  Math.ceil(_personas.length / PERSONAS_PER_PAGE) ? (
                    <PaginationItem>
                      <PaginationNext
                        href={`/library?page=${Number(page) + 1}`}
                      />
                    </PaginationItem>
                  ) : (
                    <span className="text-sm text-muted-foreground px-4">
                      No more pages
                    </span>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PersonaCard({
  persona,
}: {
  persona: Pick<
    typeof personas.$inferSelect,
    "id" | "title" | "createdAt" | "profileImageId" | "currentVersionId"
  > & {
    currentVersion: {
      id: string;
      data: PersonaData;
    } | null;
  };
}) {
  return (
    <Link href={`/?persona_id=${persona.id}&panel=true`}>
      <div className="bg-card rounded-lg border border-border overflow-hidden hover:border-border/80 transition-colors group">
        {persona.profileImageId ? (
          <img
            src={`${process.env.NEXT_PUBLIC_CDN_BASE_URL}/personas/${persona.profileImageId}_thumb.webp`}
            alt={persona.title!}
            className="w-full h-48 object-cover pointer-events-none select-none group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-b from-primary/15 to-primary/5" />
        )}

        <div className="p-4">
          <h3 className="font-medium text-foreground mb-1 truncate">
            {persona.currentVersion?.data.name || "Unnamed Persona"}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {persona.title || "No description"}
          </p>
          <div className="text-xs text-muted-foreground/70 mt-2">
            {new Date(persona.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </Link>
  );
}
