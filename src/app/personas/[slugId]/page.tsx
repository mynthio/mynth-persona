import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getImageUrl } from "@/lib/utils";
import { PersonaData } from "@/schemas";

export const revalidate = 0;

export default async function PersonaPublicPage(
  props: PageProps<"/personas/[slugId]">
) {
  const { slugId } = await props.params;

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

  const data = persona.publicVersion.data as PersonaData;
  const displayName = persona.publicName ?? data.name;

  return (
    <div className="container mx-auto max-w-5xl pb-[24px] md:py-[32px]">
      <div className="flex flex-col md:flex-row gap-8 p-0">
        <div className="w-full md:w-1/3 p-0">
          {/* Public Personas always have profile image */}
          <img
            src={getImageUrl(persona.profileImageId!, "full")}
            alt={`${displayName} profile image`}
            className="w-full rounded-[16px] rounded-b-[0px] md:rounded-[32px] object-cover"
            draggable={false}
          />
        </div>
        <div className="flex-1 max-w-3xl px-[12px] md:px-0">
          <h1 className="text-[2.2rem] font-onest font-[500] text-surface-foreground/90 leading-tight">
            {displayName}
          </h1>
          {persona.headline && (
            <p className="mt-[2px] text-muted-foreground">{persona.headline}</p>
          )}

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Gender</div>
              <div className="capitalize">{data.gender}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Age</div>
              <div className="capitalize">{data.age}</div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-8">
            <h2 className="text-xl font-medium mb-2">Summary</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {data.summary}
            </p>
          </div>

          {/* Details */}
          <div className="mt-8 space-y-8">
            <div>
              <h3 className="font-medium mb-2">Appearance</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {data.appearance}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Personality</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {data.personality}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Background</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {data.background}
              </p>
            </div>
            {data.occupation && (
              <div>
                <h3 className="font-medium mb-2">Occupation</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {data.occupation}
                </p>
              </div>
            )}
          </div>

          {/* Extensions */}
          {data.extensions && Object.keys(data.extensions).length > 0 && (
            <div className="mt-8">
              <h3 className="font-medium mb-3">Additional Details</h3>
              <div className="space-y-4">
                {Object.entries(data.extensions).map(([key, value]) => (
                  <div key={key} className="rounded-lg border p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {key}
                    </div>
                    <div className="text-sm mt-1 whitespace-pre-line">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
