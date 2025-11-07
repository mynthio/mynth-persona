import { CreateChatButton } from "@/components/create-chat-button";
import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { getImageUrl } from "@/lib/utils";
import { and, eq, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

const getRandomPersona = unstable_cache(
  async () => {
    const result = await db
      .select()
      .from(personas)
      .where(
        and(eq(personas.visibility, "public"), eq(personas.nsfwRating, "sfw"))
      )
      .orderBy(sql`RANDOM()`)
      .limit(1);
    return result.length === 0 ? null : result[0];
  },
  ["random-persona"],
  { revalidate: 300 }
);

export default async function ChatsPage({ searchParams }: PageProps<"/chats">) {
  const randomPersona = await getRandomPersona();

  if (!randomPersona) return null;

  return (
    <div className="w-full h-full">
      <div className="max-w-3xl mx-auto space-y-[48px] pt-[48px]">
        <h1 className="text-center font-onest text-[2.7rem] capitalize">
          {randomPersona.publicName}
        </h1>
        <div className="w-[220px] mx-auto">
          <div className="w-[220px] h-[320px] flex items-center justify-center mx-auto relative z-0">
            <img
              width={220}
              height={320}
              src={getImageUrl(randomPersona.profileImageIdMedia!, "full")}
              className="object-cover w-11/12 h-11/12 rounded-[32px]"
              alt={randomPersona.publicName!}
              loading="lazy"
            />
            <img
              width={220}
              height={320}
              src={getImageUrl(randomPersona.profileImageIdMedia!, "full")}
              className="object-cover w-full h-full absolute top-0 left-0 rounded-[32px] blur-[12px] opacity-50 -z-1"
              alt={randomPersona.publicName!}
              loading="lazy"
            />
          </div>

          <CreateChatButton
            personaId={randomPersona.id}
            color="primary"
            className="w-full mx-auto"
          >
            Start Chat
          </CreateChatButton>
        </div>

        <p className="max-w-[460px] px-[12px] text-surface-foreground/80 text-center text-balance mx-auto">
          This is a randomly selected public persona. You can start a chat with
          any public persona or your own private ones; just visit the library or
          a persona’s page and tap “Create Chat.”
        </p>
      </div>
    </div>
  );
}
