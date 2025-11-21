"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@uidotdev/usehooks";
import { Sliders04, XClose } from "@untitledui/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { useState, useEffect } from "react";

export function ArtFilters() {
  const [tags, setTags] = useQueryState(
    "tags",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [nsfw, setNsfw] = useQueryState(
    "nsfw",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [tagsQuery, setTagsQuery] = useState(tags.join(", "));
  const debouncedTags = useDebounce(tagsQuery, 500);

  // Update URL tags from debounced input
  useEffect(() => {
    const newTags = debouncedTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setTags(newTags);
  }, [debouncedTags, setTags]);

  const toggleNsfw = (value: string) => {
    setNsfw((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const clearTags = () => {
    setTagsQuery("");
    setTags([]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Sliders04 strokeWidth={1.5} />
          Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>NSFW Rating</DropdownMenuLabel>

        <DropdownMenuCheckboxItem
          checked={nsfw.includes("sfw")}
          onCheckedChange={() => toggleNsfw("sfw")}
        >
          SFW
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={nsfw.includes("suggestive")}
          onCheckedChange={() => toggleNsfw("suggestive")}
        >
          Suggestive
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={nsfw.includes("explicit")}
          onCheckedChange={() => toggleNsfw("explicit")}
        >
          Explicit
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        <div className="p-2">
          <DropdownMenuLabel className="px-0 pt-0">Tags</DropdownMenuLabel>
          <div className="flex gap-1">
            <Input
              placeholder="anime, girl..."
              value={tagsQuery}
              onChange={(e) => setTagsQuery(e.target.value)}
              className="h-8 text-xs"
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={clearTags}
              className="h-8 px-2"
            >
              <XClose className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Comma separated required tags
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
