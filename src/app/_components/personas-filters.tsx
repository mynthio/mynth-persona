"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePersistedNsfwFilter } from "@/hooks/use-persisted-query-state";
import { Sliders04 } from "@untitledui/icons";

export function PersonasFilters() {
  const [includeNsfw, setIncludeNsfw] = usePersistedNsfwFilter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost">
          <Sliders04 strokeWidth={1.5} />
          Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Mature Content</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setIncludeNsfw(true)}>
            Show
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIncludeNsfw(false)}>
            Hide
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
