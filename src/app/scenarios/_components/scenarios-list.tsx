"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import {
  GlobeIcon,
  LockIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import useSWR from "swr";
import { useState, useEffect } from "react";

type Scenario = {
  id: string;
  title: string;
  visibility: "private" | "public" | "deleted";
  backgroundImageUrl: string | null;
  createdAt: Date;
};

type PaginatedScenariosResponse = {
  data: Scenario[];
  nextCreatedAt: string | null;
  nextId: string | null;
  hasMore: boolean;
};

type ScenariosListProps = {
  initialData: PaginatedScenariosResponse;
  eventFilter?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ScenariosList({ initialData, eventFilter }: ScenariosListProps) {
  const [cursors, setCursors] = useState<
    Array<{ createdAt: string; id: string } | null>
  >([null]); // Stack of cursors for navigation
  const [currentPage, setCurrentPage] = useState(0);

  const currentCursor = cursors[currentPage];
  const queryParams = new URLSearchParams();
  if (currentCursor) {
    queryParams.set("cursorCreatedAt", currentCursor.createdAt);
    queryParams.set("cursorId", currentCursor.id);
  }
  if (eventFilter) {
    queryParams.set("event", eventFilter);
  }

  // Reset pagination when filter changes
  useEffect(() => {
    setCursors([null]);
    setCurrentPage(0);
  }, [eventFilter]);

  const { data, isLoading } = useSWR<PaginatedScenariosResponse>(
    `/api/scenarios?${queryParams.toString()}`,
    fetcher,
    {
      fallbackData: currentPage === 0 && !eventFilter ? initialData : undefined,
      keepPreviousData: true,
    }
  );

  const scenarios = data?.data ?? [];
  const hasMore = data?.hasMore ?? false;
  const hasPrevious = currentPage > 0;

  const handleNext = () => {
    if (!hasMore || !data) return;

    const nextCursor = {
      createdAt: data.nextCreatedAt!,
      id: data.nextId!,
    };

    // Add the next cursor to our stack
    setCursors((prev) => [...prev.slice(0, currentPage + 1), nextCursor]);
    setCurrentPage((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (!hasPrevious) return;
    setCurrentPage((prev) => prev - 1);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[6px]">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} />
        ))}
      </div>

      {(hasPrevious || hasMore) && (
        <div className="flex items-center justify-center gap-[8px] mt-[24px]">
          <Button
            onClick={handlePrevious}
            disabled={!hasPrevious || isLoading}
          >
            <CaretLeftIcon />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!hasMore || isLoading}
          >
            Next
            <CaretRightIcon />
          </Button>
        </div>
      )}
    </>
  );
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
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
