"use client";

import { Button } from "@/components/mynth-ui/base/button";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { ScenariosList } from "./_components/scenarios-list";
import { Link } from "@/components/ui/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PaginatedScenariosResponse = {
  data: Array<{
    id: string;
    title: string;
    visibility: "private" | "public" | "deleted";
    backgroundImageUrl: string | null;
    createdAt: Date;
  }>;
  nextCreatedAt: string | null;
  nextId: string | null;
  hasMore: boolean;
};

export default function ScenariosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventFilter = searchParams.get("event");
  const [initialData, setInitialData] = useState<PaginatedScenariosResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (eventFilter) {
          queryParams.set("event", eventFilter);
        }
        const response = await fetch(`/api/scenarios?${queryParams.toString()}`);
        const data = await response.json();
        setInitialData(data);
      } catch (error) {
        console.error("Failed to fetch scenarios:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [eventFilter]);

  const toggleHalloweenFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (eventFilter === "halloween") {
      params.delete("event");
    } else {
      params.set("event", "halloween");
    }
    router.push(`/scenarios?${params.toString()}`);
  };

  if (isLoading || !initialData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

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

          <Link
            href="/scenarios/creator"
            className="flex items-center gap-[4px]"
          >
            <PlusIcon />
            Create Scenario
          </Link>
        </div>

        <div className="mb-[12px]">
          <Button
            color={eventFilter === "halloween" ? "primary" : "default"}
            onClick={toggleHalloweenFilter}
          >
            {eventFilter === "halloween" ? "Show All Scenarios" : "Halloween Events Only"}
          </Button>
        </div>

        <ScenariosList initialData={initialData} eventFilter={eventFilter || undefined} />
      </div>
    </div>
  );
}
