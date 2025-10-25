import { Button } from "@/components/mynth-ui/base/button";
import { getPaginatedScenarios } from "@/services/scenarios/get-paginated-scenarios";
import { auth } from "@clerk/nextjs/server";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { ScenariosList } from "./_components/scenarios-list";

export default async function ScenariosPage() {
  const { userId } = await auth();
  if (!userId) notFound();

  const initialData = await getPaginatedScenarios({ userId });

  return (
    <div className="w-full h-full">
      <div className="px-[12px] mx-auto">
        <div className="flex items-center justify-between my-[12px]">
          <div className="flex items-start gap-[4px]">
            <h1 className="text-center uppercase font-onest font-[600] text-[1.1rem]">
              Scenarios
            </h1>
            <p className="shrink-0 uppercase font-mono text-[0.7rem] font-bold text-black/80 bg-yellow-400/80 rounded-[6px] px-[4px] py-[1px]">
              Beta
            </p>
          </div>

          <Button color="primary">
            <PlusIcon />
            Create Scenario
          </Button>
        </div>

        <ScenariosList initialData={initialData} />
      </div>
    </div>
  );
}
