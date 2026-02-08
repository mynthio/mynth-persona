import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getImageUrl } from "@/lib/utils";
import { PersonaData } from "@/schemas";
import type { Metadata } from "next";
import { DEFAULT_GRADIENT_BACKGROUND } from "@/lib/image-palette";
import { PersonaBanner } from "./_components/banner";
import { BioSection } from "./_components/bio-section";
import { Suspense } from "react";
import { PersonaScenarios } from "./_components/persona-scenarios";
import {
  BirdIcon,
  ChatsTeardropIcon,
  HeartIcon,
} from "@phosphor-icons/react/dist/ssr";
import { TopBar, TopBarSidebarTrigger } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { CreateChatButton } from "@/components/create-chat-button";

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
      <TopBar left={<TopBarSidebarTrigger />} />

      <div className="max-w-[720px] mx-auto px-4">
        {/* Banner */}
        <div className="relative h-48 md:h-56 rounded-3xl overflow-hidden">
          <PersonaBanner
            profileImageIdMedia={persona.profileImageIdMedia}
            fallbackGradient={DEFAULT_GRADIENT_BACKGROUND}
          />

          {/* Status Badge */}
          <div className="absolute top-4 left-4 z-10">
            <Badge variant="secondary" className="backdrop-blur-sm">
              {persona.status === "community" && <BirdIcon weight="fill" />}
              {persona.status}
            </Badge>
          </div>

          {/* NSFW Badge */}
          {persona.nsfwRating && persona.nsfwRating !== "sfw" && (
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="destructive" className="backdrop-blur-sm uppercase">
                {persona.nsfwRating}
              </Badge>
            </div>
          )}
        </div>

        {/* Avatar - overlapping banner */}
        <div className="flex justify-center -mt-20 md:-mt-24 relative z-10">
          <div className="w-40 h-40 md:w-[200px] md:h-[200px] rounded-2xl border-4 border-background overflow-hidden shadow-lg">
            <img
              src={getPersonaImageUrl(persona.profileImageIdMedia)}
              alt={displayName}
              draggable={false}
              className="w-full h-full object-cover object-top select-none"
            />
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mt-4 gap-1">
          <h1 className="text-2xl md:text-3xl font-onest font-semibold text-foreground">
            {displayName}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md">
            {persona.headline}
          </p>

          {/* Metadata Row */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2 flex-wrap justify-center">
            {data.age && <span>{data.age}</span>}
            {data.gender && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span>{data.gender}</span>
              </>
            )}
            {persona.likesCount > 0 && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1">
                  <HeartIcon weight="fill" className="size-3.5" />
                  {persona.likesCount.toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-6">
          <CreateChatButton
            personaId={persona.id}
            size="lg"
            className="w-full shadow-md"
          >
            <ChatsTeardropIcon className="size-5" />
            Start Chatting
          </CreateChatButton>
        </div>

        {/* About Section */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              About
            </h2>
            <div className="flex-1 h-px bg-border" />
          </div>

          <BioSection data={data} />
        </div>

        {/* Scenarios Section */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Scenarios
            </h2>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Suspense>
            <PersonaScenarios personaId={persona.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
