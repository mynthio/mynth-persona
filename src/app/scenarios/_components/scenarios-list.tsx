"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GlobeIcon,
  LockIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { Link } from "@/components/ui/link";

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} />
        ))}
      </div>

      {(hasPrevious || hasMore) && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={!hasPrevious || isLoading}
          >
            <CaretLeftIcon className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={!hasMore || isLoading}
          >
            Next
            <CaretRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  return (
    <Link href={`/scenarios/${scenario.id}`} className="block group">
      <Card className="relative h-[220px] overflow-hidden border-2 transition-all hover:border-primary/50 hover:shadow-lg p-0">
        {scenario.backgroundImageUrl && (
          <>
            <div className="absolute inset-0 z-0">
              <img
                src={scenario.backgroundImageUrl}
                alt={scenario.title}
                className="w-full h-full object-cover object-center transition-transform group-hover:scale-105 duration-300"
              />
            </div>
            <div className="absolute inset-0 z-10 bg-gradient-to-tr from-background/95 via-background/80 to-background/60" />
          </>
        )}

        <div className="relative z-20 h-full flex flex-col justify-between p-6">
          <div className="flex items-center gap-2">
            <Badge variant={scenario.visibility === "public" ? "secondary" : "outline"} className="gap-1.5">
              {scenario.visibility === "public" ? (
                <GlobeIcon className="h-3 w-3" />
              ) : (
                <LockIcon className="h-3 w-3" />
              )}
              {scenario.visibility === "public" ? "Public" : "Private"}
            </Badge>
          </div>

          <div>
            <h3 className="text-2xl font-light leading-tight tracking-tight line-clamp-2">
              {scenario.title}
            </h3>
          </div>
        </div>
      </Card>
    </Link>
  );
}
