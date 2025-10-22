/**
 * PersonaSelector - A modular, composable persona selection component
 *
 * This component follows a composition pattern similar to Radix UI and React Select,
 * providing maximum flexibility through separate, composable components.
 *
 * @example
 * // Basic usage with just a trigger
 * <PersonaSelector value={selectedIds} onChange={setSelectedIds}>
 *   <PersonaSelectorTrigger>
 *     <Button>Select Persona</Button>
 *   </PersonaSelectorTrigger>
 * </PersonaSelector>
 *
 * @example
 * // Multiple selection with selected persona display
 * <PersonaSelector value={selectedIds} onChange={setSelectedIds} multiple>
 *   <PersonaSelectorValue>
 *     {({ selectedPersonas, removePersona }) => (
 *       <div className="flex gap-2 flex-wrap">
 *         {selectedPersonas.map(persona => (
 *           <PersonaChip
 *             key={persona.id}
 *             persona={persona}
 *             onRemove={() => removePersona(persona.id)}
 *           />
 *         ))}
 *       </div>
 *     )}
 *   </PersonaSelectorValue>
 *
 *   <PersonaSelectorTrigger asChild>
 *     <Button>Add Personas</Button>
 *   </PersonaSelectorTrigger>
 * </PersonaSelector>
 *
 * @example
 * // Using the hook for programmatic access
 * function MyComponent() {
 *   const { selectedPersonas, removePersona, openDialog } = usePersonaSelector();
 *
 *   return (
 *     <button onClick={openDialog}>
 *       Open Dialog ({selectedPersonas.length} selected)
 *     </button>
 *   );
 * }
 *
 * @example
 * // Advanced: Custom trigger in multiple places
 * <PersonaSelector value={ids} onChange={setIds} multiple>
 *   <div className="space-y-4">
 *     <PersonaSelectorTrigger asChild>
 *       <Button>Select from Sidebar</Button>
 *     </PersonaSelectorTrigger>
 *
 *     <PersonaSelectorValue>
 *       {({ selectedPersonas, removePersona, openDialog }) => (
 *         <div>
 *           {selectedPersonas.map(p => (
 *             <PersonaChip key={p.id} persona={p} onRemove={() => removePersona(p.id)} />
 *           ))}
 *           <Button onClick={openDialog}>Add More</Button>
 *         </div>
 *       )}
 *     </PersonaSelectorValue>
 *   </div>
 * </PersonaSelector>
 */
"use client";

import {
  CheckSquareIcon,
  GlobeSimpleIcon,
  SquareIcon,
  UserIcon,
  XIcon,
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
import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  ReactElement,
} from "react";
import useSWRInfinite from "swr/infinite";
import { cn, getImageUrl } from "@/lib/utils";
import { useDebounce } from "@uidotdev/usehooks";
import { fetcher } from "@/lib/fetcher";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { ScrollArea } from "./mynth-ui/base/scroll-area";

const MAX_PERSONAS = 250;

export type Persona = {
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

// Context
type PersonaSelectorContextValue = {
  selectedPersonas: Persona[];
  setSelectedPersonas: (personas: Persona[]) => void;
  multiple: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  removePersona: (id: string) => void;
  openDialog: () => void;
  closeDialog: () => void;
};

const PersonaSelectorContext = createContext<
  PersonaSelectorContextValue | undefined
>(undefined);

export function usePersonaSelector() {
  const context = useContext(PersonaSelectorContext);
  if (!context) {
    throw new Error(
      "usePersonaSelector must be used within PersonaSelector component"
    );
  }
  return context;
}

// Root component
type PersonaSelectorProps = {
  value?: Persona[];
  onChange?: (personas: Persona[]) => void;
  multiple?: boolean;
  children: ReactNode;
};

export function PersonaSelector({
  value = [],
  onChange,
  multiple = false,
  children,
}: PersonaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>(value);

  const handleSetSelectedPersonas = (personas: Persona[]) => {
    setSelectedPersonas(personas);
    onChange?.(personas);
  };

  const removePersona = (id: string) => {
    const newPersonas = selectedPersonas.filter((p) => p.id !== id);
    handleSetSelectedPersonas(newPersonas);
  };

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

  const contextValue: PersonaSelectorContextValue = {
    selectedPersonas,
    setSelectedPersonas: handleSetSelectedPersonas,
    multiple,
    isOpen,
    setIsOpen,
    removePersona,
    openDialog,
    closeDialog,
  };

  return (
    <PersonaSelectorContext.Provider value={contextValue}>
      {children}
    </PersonaSelectorContext.Provider>
  );
}

// Trigger component
type PersonaSelectorTriggerProps = {
  children?: ReactElement;
  asChild?: boolean;
};

export function PersonaSelectorTrigger({
  children,
  asChild = false,
}: PersonaSelectorTriggerProps) {
  const { isOpen, setIsOpen } = usePersonaSelector();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={asChild && children ? children : <Button />}
      >
        {asChild ? children : children || <>Select Persona</>}
      </DialogTrigger>

      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <PersonaSelectorContent />
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

// Value display component with render prop
type PersonaSelectorValueProps = {
  children: (props: {
    selectedPersonas: Persona[];
    removePersona: (id: string) => void;
    openDialog: () => void;
    closeDialog: () => void;
  }) => ReactNode;
};

export function PersonaSelectorValue({
  children,
}: PersonaSelectorValueProps) {
  const { selectedPersonas, removePersona, openDialog, closeDialog } =
    usePersonaSelector();

  return (
    <>
      {children({ selectedPersonas, removePersona, openDialog, closeDialog })}
    </>
  );
}

// Persona chip component for easy display
type PersonaChipProps = {
  persona: Persona;
  onRemove?: () => void;
  className?: string;
};

export function PersonaChip({
  persona,
  onRemove,
  className,
}: PersonaChipProps) {
  const getDisplayName = (persona: Persona) => {
    return persona.publicName || persona.title || "Untitled";
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-[8px] px-[12px] py-[6px] rounded-[8px] bg-surface-100 border border-surface-200",
        className
      )}
    >
      <div className="shrink-0 size-[24px] rounded-[6px] overflow-hidden bg-surface-200 flex items-center justify-center">
        {persona.profileImageId ? (
          <img
            src={getImageUrl(persona.profileImageId, "thumb")}
            alt={getDisplayName(persona)}
            width={24}
            height={24}
            className="object-cover"
          />
        ) : (
          <UserIcon className="text-surface-foreground/50 size-[14px]" />
        )}
      </div>

      <span className="text-sm font-medium truncate">
        {getDisplayName(persona)}
      </span>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 size-[16px] rounded-[4px] hover:bg-surface-200 flex items-center justify-center transition-colors"
          aria-label={`Remove ${getDisplayName(persona)}`}
        >
          <XIcon className="size-[12px]" />
        </button>
      )}
    </div>
  );
}

// Internal content component
function PersonaSelectorContent() {
  const { selectedPersonas, setSelectedPersonas, multiple, setIsOpen } =
    usePersonaSelector();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [filterType, setFilterType] = useState<"all" | "mine">("all");

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

  const handleSelect = (persona: Persona) => {
    if (multiple) {
      const isSelected = selectedPersonas.some((p) => p.id === persona.id);
      if (isSelected) {
        setSelectedPersonas(selectedPersonas.filter((p) => p.id !== persona.id));
      } else {
        setSelectedPersonas([...selectedPersonas, persona]);
      }
    } else {
      // Auto-close for single select
      setSelectedPersonas([persona]);
      setTimeout(() => {
        setIsOpen(false);
      }, 150);
    }
  };

  const handleDone = () => {
    setIsOpen(false);
  };

  const getDisplayName = (persona: Persona) => {
    return persona.publicName || persona.title || "Untitled";
  };

  return (
    <>
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
          <div className="flex items-center justify-between">
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

            {multiple && selectedPersonas.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedPersonas.length} selected
              </span>
            )}
          </div>
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
              {allPersonas.map((persona) => {
                const isSelected = selectedPersonas.some(
                  (p) => p.id === persona.id
                );
                return (
                  <button
                    key={persona.id}
                    onClick={() => handleSelect(persona)}
                    className={cn(
                      "w-full flex items-center py-[12px] rounded-[12px] px-[24px] gap-[12px] transition-colors",
                      isSelected && "bg-surface-100"
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

                    {isSelected && (
                      <CheckSquareIcon className="shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}

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

        {/* Footer with done button for multiple select */}
        {multiple && (
          <div className="px-[24px] py-[12px] border-t border-surface-200">
            <Button onClick={handleDone} className="w-full">
              Done
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

// Default export for backward compatibility
export default PersonaSelector;
