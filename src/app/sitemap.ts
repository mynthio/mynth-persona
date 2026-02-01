import type { MetadataRoute } from "next";
import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { eq, isNotNull, and } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://prsna.app";

  // Fetch all public personas with slugs
  const publicPersonas = await db
    .select({
      slug: personas.slug,
      updatedAt: personas.updatedAt,
      publishedAt: personas.publishedAt,
    })
    .from(personas)
    .where(
      and(eq(personas.visibility, "public"), isNotNull(personas.slug))
    );

  const personaUrls: MetadataRoute.Sitemap = publicPersonas
    .filter((p) => p.slug)
    .map((persona) => ({
      url: `${baseUrl}/personas/${persona.slug}`,
      lastModified: persona.publishedAt || persona.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/art`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  return [...staticPages, ...personaUrls];
}
