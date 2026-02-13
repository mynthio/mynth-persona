"use client";

import { FeatherIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { ScenariosList } from "./_components/scenarios-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/components/ui/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  TopBar,
  TopBarSidebarTrigger,
  TopBarTitle,
} from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";

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
  const searchParams = useSearchParams();
  const eventFilter = searchParams.get("event");
  const [initialData, setInitialData] =
    useState<PaginatedScenariosResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (eventFilter) {
          queryParams.set("event", eventFilter);
        }
        const response = await fetch(
          `/api/scenarios?${queryParams.toString()}`
        );
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

  if (isLoading || !initialData) {
    return (
      <div className="w-full h-full">
        <TopBar
          left={<TopBarSidebarTrigger />}
          center={
            <TopBarTitle>
              <HugeiconsIcon icon={FeatherIcon} strokeWidth={1.5} />{" "}
              <span className="uppercase text-[0.75rem]">Scenarios</span>
              <Badge variant="destructive">Beta</Badge>
            </TopBarTitle>
          }
          right={
            <Button variant="ghost" size="sm" disabled>
              <HugeiconsIcon icon={PlusSignIcon} />
              <span className="hidden md:block">Create Scenario</span>
            </Button>
          }
        />

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[220px] w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <TopBar
        left={<TopBarSidebarTrigger />}
        center={
          <TopBarTitle>
            <HugeiconsIcon icon={FeatherIcon} strokeWidth={1.5} />{" "}
            <span className="uppercase text-[0.75rem]">Scenarios</span>
            <Badge variant="destructive">Beta</Badge>
          </TopBarTitle>
        }
        right={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/scenarios/creator" className="flex items-center gap-1">
              <HugeiconsIcon icon={PlusSignIcon} />
              <span className="hidden md:block">Create Scenario</span>
            </Link>
          </Button>
        }
      />

      <div className="px-6 py-6">
        <ScenariosList
          initialData={initialData}
          eventFilter={eventFilter || undefined}
        />
      </div>
    </div>
  );
}
