import { cache } from "react";
import { desc, isNotNull } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { PublicPersonaListItem } from "@/schemas/shared/persona-public.schema";

const LANDING_PAGE_LIMIT = 24;

/**
 * Fetches public personas for the landing page.
 * Uses React.cache() for per-request deduplication (server-cache-react).
 */
export const getPublicPersonas = cache(async (): Promise<PublicPersonaListItem[]> => {
  const data = await db
    .select({
      id: personas.id,
      slug: personas.slug,
      publicName: personas.publicName,
      headline: personas.headline,
      profileImageIdMedia: personas.profileImageIdMedia,
      profileSpotlightMediaId: personas.profileSpotlightMediaId,
      nsfwRating: personas.nsfwRating,
      status: personas.status,
      gender: personas.gender,
      ageBucket: personas.ageBucket,
      likesCount: personas.likesCount,
      publishedAt: personas.publishedAt,
      event: personas.event,
    })
    .from(personas)
    .where(isNotNull(personas.publishedAt))
    .orderBy(desc(personas.publishedAt), desc(personas.id))
    .limit(LANDING_PAGE_LIMIT);

  return data as PublicPersonaListItem[];
});
