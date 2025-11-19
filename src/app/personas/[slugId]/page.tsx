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
import { Suspense } from "react";
import { PersonaScenarios } from "./_components/persona-scenarios";
import { BirdIcon } from "@phosphor-icons/react/dist/ssr";
import { TopBar, TopBarSidebarTrigger } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";

// Helper functions
const getPersonaImageUrl = (profileImageIdMedia?: string | null) =>
  profileImageIdMedia ? getImageUrl(profileImageIdMedia, "full") : undefined;

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
      profileImageIdMedia: true,
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
  const imageUrl = getPersonaImageUrl(persona.profileImageIdMedia);
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
      profileImageIdMedia: true,
      status: true,
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
    <div className="w-full h-full pb-16">
      {/* Top Bar */}
      <TopBar left={<TopBarSidebarTrigger />} />

      {/* Banner Section */}
      <div className="w-[calc(100%-24px)] px-4 max-w-[960px] mx-auto min-h-[400px] z-0 relative flex flex-col justify-end overflow-hidden">
        {/* Banner Background */}
        <div className="absolute inset-0 z-0 h-56 overflow-hidden rounded-3xl">
          <PersonaBanner
            profileImageIdMedia={persona.profileImageIdMedia}
            fallbackGradient={DEFAULT_GRADIENT_BACKGROUND}
          />
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="secondary" className="backdrop-blur-sm">
            {persona.status === "community" && <BirdIcon weight="fill" />}
            {persona.status}
          </Badge>
        </div>

        {/* Profile Content */}
        <div className="w-full flex gap-3 md:gap-6 relative z-10 pb-6">
          <div className="w-[140px] md:w-[200px] shrink-0">
            <div className="rounded-2xl md:rounded-3xl w-full aspect-square p-1 flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20">
              <img
                src={getPersonaImageUrl(persona.profileImageIdMedia)}
                alt={displayName}
                draggable={false}
                className="w-full h-full object-cover object-top rounded-xl md:rounded-2xl select-none"
              />
            </div>
          </div>

          <div className="flex flex-col justify-end w-full min-w-0">
            <h1 className="text-2xl md:text-4xl font-onest font-semibold text-white leading-tight drop-shadow-lg">
              {displayName}
            </h1>
            <p className="text-sm md:text-base text-white/90 md:max-w-[480px] mt-1 drop-shadow">
              {persona.headline}
            </p>
            <div className="mt-4">
              <PersonaActions
                personaId={persona.id}
                displayName={displayName}
                data={data}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scenarios Section */}
      <div className="max-w-[960px] mx-auto mt-6 px-4">
        <Suspense>
          <PersonaScenarios personaId={persona.id} />
        </Suspense>
      </div>
    </div>
  );
}
