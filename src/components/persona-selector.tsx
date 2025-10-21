"use client";

import {
  CheckSquareIcon,
  GlobeIcon,
  GlobeSimpleIcon,
  SquareIcon,
  SquaresFourIcon,
  UserIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "./mynth-ui/base/button";
import { ButtonGroup } from "./mynth-ui/base/button-group";
import {
  Dialog,
  DialogTrigger,
  DialogBackdrop,
  DialogPortal,
  DialogPopup,
  DialogTitle,
} from "./mynth-ui/base/dialog";
import { Input } from "./mynth-ui/base/input";
import { useState, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import { cn, getImageUrl } from "@/lib/utils";
import { useDebounce } from "@uidotdev/usehooks";
import { fetcher } from "@/lib/fetcher";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { ScrollArea } from "./mynth-ui/base/scroll-area";

const MAX_PERSONAS = 250;

type PersonaSelectorProps = {
  multiple?: boolean;
  onSelect?: (ids: string[]) => void;
  defaultSelected?: string[];
  trigger?: React.ReactNode;
};

type Persona = {
  id: string;
  title: string | null;
  publicName: string | null;
  headline: string | null;
  profileImageId: string | null;
  profileSpotlightMediaId: string | null;
  gender: "female" | "male" | "other";
  ageBucket:
    | "unknown"
    | "under-18"
    | "18-24"
    | "25-34"
    | "35-44"
    | "45-54"
    | "55-64"
    | "65-plus";
  isOwned: boolean;
  createdAt: Date | null;
  visibility: "public" | "private";
};

type PersonaSearchResponse = {
  data: Persona[];
  nextCreatedAt: string | null;
  nextId: string | null;
  hasMore: boolean;
};

const AGE_BUCKET_LABELS: Record<Persona["ageBucket"], string> = {
  unknown: "Age unknown",
  "under-18": "Under 18",
  "18-24": "18-24",
  "25-34": "25-34",
  "35-44": "35-44",
  "45-54": "45-54",
  "55-64": "55-64",
  "65-plus": "65+",
};

const GENDER_LABELS: Record<Persona["gender"], string> = {
  female: "Female",
  male: "Male",
  other: "Other",
};

export default function PersonaSelector(props: PersonaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [filterType, setFilterType] = useState<"all" | "mine">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const initial = props.defaultSelected ?? [];
    return props.multiple ? initial : initial.slice(0, 1);
  });

  const { data, error, isLoading, size, setSize } =
    useSWRInfinite<PersonaSearchResponse>(
      (pageIndex, previousPageData) => {
        if (previousPageData && !previousPageData.hasMore) return null;

        const params = new URLSearchParams();
        if (debouncedSearch) params.set("q", debouncedSearch);
        params.set("filter", filterType);

        if (previousPageData?.nextCreatedAt && previousPageData?.nextId) {
          params.set("cursorCreatedAt", previousPageData.nextCreatedAt);
          params.set("cursorId", previousPageData.nextId);
        }

        return `/api/personas/search?${params.toString()}`;
      },
      fetcher,
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateFirstPage: false,
      }
    );

  useEffect(() => {
    setSize(1);
  }, [debouncedSearch, filterType, setSize]);

  const allPersonas = data?.flatMap((page) => page.data) ?? [];
  const hasMore =
    (data?.[data.length - 1]?.hasMore ?? false) &&
    allPersonas.length < MAX_PERSONAS;
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  const [sentryRef] = useInfiniteScroll({
    loading: isLoading,
    hasNextPage: hasMore,
    onLoadMore: () => setSize((prev) => prev + 1),
    disabled: !!error,
    rootMargin: "0px 0px 200px 0px",
  });

  const handleSelect = (id: string) => {
    if (props.multiple) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && props.onSelect) {
      props.onSelect(selectedIds);
    }
  };

  const getDisplayName = (persona: Persona) => {
    return persona.publicName || persona.title || "Untitled";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        {props.trigger ? props.trigger : <Button>Select Persona</Button>}
      </DialogTrigger>

      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle className="sr-only">Select Persona</DialogTitle>

          <div className="w-full h-full flex flex-col">
            {/* Search and filter section */}
            <div className="px-[24px] py-[12px] space-y-[12px]">
              <Input
                className="w-full"
                placeholder="Search personas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <ButtonGroup>
                <Button
                  variant={filterType === "mine" ? "outline" : "default"}
                  onClick={() =>
                    setFilterType(filterType === "mine" ? "all" : "mine")
                  }
                >
                  {filterType === "mine" ? <CheckSquareIcon /> : <SquareIcon />}
                  My library
                </Button>
              </ButtonGroup>
            </div>

            <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
              {isLoading && allPersonas.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Loading personas...
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full text-sm text-destructive">
                  Failed to load personas
                </div>
              ) : allPersonas.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No personas found
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {allPersonas.map((persona) => (
                    <button
                      key={persona.id}
                      onClick={() => handleSelect(persona.id)}
                      className={cn(
                        "w-full flex items-center py-[12px] rounded-[12px] px-[24px] gap-[12px]",
                        selectedIds.includes(persona.id) && "bg-surface-100"
                      )}
                    >
                      <div className="shrink-0 size-[32px] rounded-[12px] overflow-hidden bg-surface-100 flex items-center justify-center">
                        {persona.profileImageId ? (
                          <img
                            src={getImageUrl(persona.profileImageId, "thumb")}
                            alt={getDisplayName(persona)}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <UserIcon className="text-surface-foreground/50" />
                        )}
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-sm truncate">
                          {getDisplayName(persona)}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {persona.visibility === "public" && (
                            <>
                              <GlobeSimpleIcon className="text-blue-500" />
                              <span>•</span>
                            </>
                          )}
                          <span>{AGE_BUCKET_LABELS[persona.ageBucket]}</span>
                          <span>•</span>
                          <span>{GENDER_LABELS[persona.gender]}</span>
                        </div>
                      </div>
                    </button>
                  ))}

                  {hasMore && (
                    <div
                      ref={sentryRef}
                      className="flex items-center justify-center py-4 text-sm text-muted-foreground"
                    >
                      {isLoadingMore ? "Loading more..." : ""}
                    </div>
                  )}

                  {allPersonas.length >= MAX_PERSONAS && (
                    <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                      Showing first {MAX_PERSONAS} personas
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
