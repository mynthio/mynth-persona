import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import { Link } from "@/components/ui/link";
import { db } from "@/db/drizzle";
import { getImageUrl } from "@/lib/utils";
import { GhostIcon } from "@phosphor-icons/react/dist/ssr";

export async function HalloweenSection() {
  const personas = await db.query.personas.findMany({
    where: (t, { eq, or, and }) =>
      and(eq(t.event, "halloween"), eq(t.visibility, "public")),
    columns: {
      id: true,
      publicName: true,
      gender: true,
      headline: true,
      profileImageId: true,
      profileSpotlightMediaId: true,
      slug: true,
    },
  });

  const scenarios = await db.query.scenarios.findMany({
    where: (t, { eq, or, and }) =>
      and(eq(t.event, "halloween"), eq(t.visibility, "public")),
    columns: {
      id: true,
      backgroundImageUrl: true,
      title: true,
      description: true,
    },
    limit: 2,
  });

  return (
    <div className="relative rounded-t-[16px] px-[12px] overflow-hidden z-0 min-h-[400px] pb-[64px] flex flex-col items-center">
      <div className="flex flex-col justify-center items-center gap-[8px] mt-[48px]">
        <div className="bg-orange-900 text-orange-300/80 text-[0.8rem] font-[700] px-[8px] py-[2px] rounded-[7px]">
          Limited time
        </div>
        <h2 className="text-[1.3rem] md:text-[2rem] font-[300] leading-tight text-white font-onest">
          Halloween Personas and Scenarios!
        </h2>
      </div>

      <div className="mt-[48px] flex flex-wrap px-[48px] max-w-[600px] items-center justify-center gap-[12px] w-full">
        {personas.map((persona) => (
          <Link
            href={`/personas/${persona.slug}`}
            key={persona.id}
            className="size-[96px] md:size-[128px] overflow-hidden relative z-0 rounded-[12px] shadow-xl border-purple-800/10 border-[2px] shadow-purple-400/80"
          >
            <img
              src={getImageUrl(persona.profileImageId!, "thumb")}
              className="w-full absolute top-0 left-0 h-full object-cover"
            />
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-[12px] w-full max-w-[600px] mx-auto mt-[64px]">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="w-full h-[260px] overflow-hidden relative z-0 rounded-[12px] flex flex-col gap-[24px] justify-end shadow-xl shadow-purple-600/50"
          >
            <div className="px-[24px] py-[12px]">
              <Link
                href={`/scenarios/${scenario.id}`}
                className="text-white/90 font-onest text-[1.6rem] leading-tight max-w-[80%] text-balance"
              >
                {scenario.title}
              </Link>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-full bg-linear-to-t from-black/80 to-black/0 -z-1" />

            <img
              src={scenario.backgroundImageUrl!}
              className="w-full absolute top-0 left-0 h-full object-cover -z-2"
            />
          </div>
        ))}

        <div className="mt-[24px] flex items-center justify-center">
          <Link
            href="/scenarios?event=halloween"
            className="flex justify-center text-center text-balance items-center gap-[8px] bg-purple-900/40 backdrop-blur-[5px] rounded-[12px] px-[24px] py-[12px] text-purple-400/80 text-[1.1rem] font-[800] font-onest"
          >
            <GhostIcon weight="fill" />
            <span className="w-full text-center">
              Discover more Halloween scenarios
            </span>
            <GhostIcon weight="fill" />
          </Link>
        </div>
      </div>

      <img
        src="/halloween-bg.jpg"
        alt="Halloween Background"
        className="absolute left-0 top-0 w-full h-full object-cover -z-2"
      />
      <StarsBackground className="absolute left-0 top-0 w-full h-full -z-1" />
    </div>
  );
}
