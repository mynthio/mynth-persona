import { Link } from "@/components/ui/link";
import { db } from "@/db/drizzle";
import { scenarioPersonas, scenarios } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { GlobeIcon, LockIcon } from "@phosphor-icons/react/dist/ssr";
import { and, eq, or } from "drizzle-orm";

type PersonaScenariosProps = {
  personaId: string;
};

export async function PersonaScenarios(props: PersonaScenariosProps) {
  const { userId } = await auth();

  const scenariosData = await db
    .select({
      scenario: scenarios,
      scenarioPersona: scenarioPersonas,
    })
    .from(scenarioPersonas)
    .innerJoin(scenarios, eq(scenarioPersonas.scenarioId, scenarios.id))
    .where(
      and(
        eq(scenarioPersonas.personaId, props.personaId),
        or(
          eq(scenarios.visibility, "public"),
          userId
            ? and(
                eq(scenarios.visibility, "private"),
                eq(scenarios.creatorId, userId)
              )
            : undefined
        )
      )
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[6px]">
      {scenariosData.map((scenario) => (
        <ScenarioCard key={scenario.scenario.id} scenario={scenario.scenario} />
      ))}
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: any }) {
  return (
    <div className="relative text-primary-foreground flex justify-between flex-col w-full overflow-hidden z-0 rounded-[12px] border-[3px] border-surface-foreground/25 h-[220px] bg-linear-to-tr from-primary to-primary/80">
      <div className="flex flex-wrap gap-[4px] px-[24px] py-[12px]">
        <div className="cursor-default pointer-events-none flex items-center gap-[4px] text-[0.80rem] bg-primary/50 backdrop-blur-[3px] rounded-[9px] h-[28px] px-[12px] text-primary-foreground/80">
          {scenario.visibility === "public" ? <GlobeIcon /> : <LockIcon />}
          {scenario.visibility === "public" ? "Public" : "Private"}
        </div>
      </div>
      <div className="max-w-11/12 px-[24px] py-[12px]">
        <Link
          href={`/scenarios/${scenario.id}`}
          className="font-onest text-balance text-[1.5rem] leading-tight text-primary-foreground/90 font-[300]"
        >
          {scenario.title}
        </Link>
      </div>

      {scenario.backgroundImageUrl && (
        <>
          <div className="absolute left-0 top-0 w-full h-full bg-linear-to-tr from-primary via-primary/80 to-primary/10 -z-10" />
          <img
            src={scenario.backgroundImageUrl}
            alt={scenario.title}
            className="absolute left-0 top-0 w-full h-full object-cover object-center -z-20"
          />
        </>
      )}
    </div>
  );
}
