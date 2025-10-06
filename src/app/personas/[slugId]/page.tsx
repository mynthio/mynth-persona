import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getImageUrl } from "@/lib/utils";
import { PersonaData } from "@/schemas";
import type { Metadata } from "next";
import { DEFAULT_GRADIENT_BACKGROUND } from "@/lib/image-palette";
import { PersonaBanner } from "./_components/banner";
import { PersonaActions } from "./_components/persona-actions";

// Helper functions
const getPersonaImageUrl = (profileImageId?: string | null) =>
  profileImageId ? getImageUrl(profileImageId, "full") : undefined;

const getDisplayName = (
  personaPublicName?: string | null,
  personaData?: PersonaData
) => personaPublicName ?? personaData?.name ?? "Unknown Persona";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: PageProps<"/personas/[slugId]">): Promise<Metadata> {
  const { slugId } = await params;

  const persona = await db.query.personas.findFirst({
    where: and(eq(personas.slug, slugId), eq(personas.visibility, "public")),
    columns: {
      id: true,
      slug: true,
      publicName: true,
      headline: true,
      profileImageId: true,
    },
  });

  if (!persona) {
    return {
      title: { absolute: "Persona not found" },
      robots: { index: false, follow: false },
    };
  }

  const displayName = persona.publicName!;
  const headline = persona.headline!;
  const title = `${displayName} - ${headline}`;
  const imageUrl = getPersonaImageUrl(persona.profileImageId);
  const description = `${headline}`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/personas/${persona.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/personas/${persona.slug}`,
      type: "profile",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: `${displayName} profile image`,
              type: "image/webp",
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      creator: "@mynth",
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function PersonaPublicPage({
  params,
}: PageProps<"/personas/[slugId]">) {
  const { slugId } = await params;

  const persona = await db.query.personas.findFirst({
    where: and(eq(personas.slug, slugId), eq(personas.visibility, "public")),
    columns: {
      id: true,
      slug: true,
      publicName: true,
      headline: true,
      profileImageId: true,
      nsfwRating: true,
      gender: true,
      ageBucket: true,
      likesCount: true,
      publishedAt: true,
    },
    with: {
      publicVersion: {
        columns: {
          id: true,
          data: true,
        },
      },
    },
  });

  if (!persona || !persona.publicVersion) {
    notFound();
  }

  const data = persona.publicVersion!.data as PersonaData;
  const displayName = getDisplayName(persona.publicName, data);
  return (
    <div className="relative overflow-clip rounded-[15px] h-full">
      {/* Banner */}
      <PersonaBanner
        profileImageId={persona.profileImageId}
        fallbackGradient={DEFAULT_GRADIENT_BACKGROUND}
      />

      <div className="h-[120px]" />

      <div className="w-full flex gap-[12px] max-w-[960px] mx-auto relative">
        <div className="w-[260px] shrink-0">
          <div className="size-[260px] p-[4px] flex items-center justify-center bg-surface/30 backdrop-blur-[4px] rounded-[64px]">
            <img
              src={getPersonaImageUrl(persona.profileImageId)}
              alt={displayName}
              draggable={false}
              className="w-full h-full object-cover object-top rounded-[60px] select-none"
            />
          </div>
        </div>

        <div className="mt-[110px] w-full">
          <h1 className="text-[2.4rem] font-onest font-[600] text-surface-foreground leading-tight">
            {displayName}
          </h1>
          <p className="text-[0.9rem] text-surface-foreground/80 max-w-[360px]">
            {persona.headline}
          </p>
          <div className="mt-[12px]">
            <PersonaActions
              personaId={persona.id}
              displayName={displayName}
              data={data}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
