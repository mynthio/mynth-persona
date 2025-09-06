"use client";

import { PublicPersonaListItem } from "@/schemas/shared/persona-public.schema";
import { getImageUrl } from "@/lib/utils";
import { Masonry, useInfiniteLoader } from "masonic";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@uidotdev/usehooks";

export default function PublicPersonas() {
  const [items, setItems] = useState<PublicPersonaListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [includeNsfw, setIncludeNsfw] = useLocalStorage("show-nsfw", false);
  const loadingLock = useRef(false);
  const includeNsfwRef = useRef(includeNsfw);

  // Update ref when includeNsfw changes
  useEffect(() => {
    includeNsfwRef.current = includeNsfw;
  }, [includeNsfw]);

  const loadInitialPage = useCallback(async () => {
    if (loadingLock.current) return;
    
    loadingLock.current = true;
    setIsLoading(true);
    
    try {
      const base = "/api/public/personas";
      const params = new URLSearchParams();
      
      if (includeNsfw) {
        params.set("includeNsfw", "true");
      }
      
      const url = params.toString() ? `${base}?${params.toString()}` : base;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Failed to load personas: ${res.status}`);
      }
      
      const json: {
        data: PublicPersonaListItem[];
        nextCursor: string | null;
        hasMore: boolean;
      } = await res.json();

      setItems(json.data);
      setCursor(json.nextCursor);
      setHasMore(json.hasMore);
    } finally {
      setIsLoading(false);
      loadingLock.current = false;
    }
  }, [includeNsfw]);

  const loadPage = useCallback(async () => {
    if (loadingLock.current || !hasMore) return;
    
    loadingLock.current = true;
    setIsLoading(true);
    
    try {
      const base = "/api/public/personas";
      const params = new URLSearchParams();
      
      if (cursor) {
        params.set("cursor", cursor);
      }
      
      if (includeNsfwRef.current) {
        params.set("includeNsfw", "true");
      }
      
      const url = params.toString() ? `${base}?${params.toString()}` : base;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Failed to load personas: ${res.status}`);
      }
      
      const json: {
        data: PublicPersonaListItem[];
        nextCursor: string | null;
        hasMore: boolean;
      } = await res.json();

      setItems((prev) => prev.concat(json.data));
      setCursor(json.nextCursor);
      setHasMore(json.hasMore);
    } finally {
      setIsLoading(false);
      loadingLock.current = false;
    }
  }, [cursor, hasMore]);

  // Initial load and reload when includeNsfw changes
  useEffect(() => {
    // Reset pagination state whenever filter changes
    setItems([]);
    setCursor(null);
    setHasMore(true);
    // Load first page
    loadInitialPage();
  }, [includeNsfw, loadInitialPage]);

  // Setup infinite loader for Masonry
  const maybeLoadMore = useInfiniteLoader(
    async (_startIndex, _stopIndex, _currentItems) => {
      if (isLoading || !hasMore) return;
      await loadPage();
    },
    {
      isItemLoaded: (index, items) => !!items[index],
      threshold: 3,
    }
  );

  if (!items.length && isLoading)
    return (
      <div className="w-full p-8 flex justify-center">
        <CircleNotchIcon
          className="animate-spin text-muted-foreground"
          size={24}
        />
      </div>
    );

  return (
    <div className="p-2 px-6">
      <div className="flex items-center justify-end gap-3 py-2">
        <Label htmlFor="nsfw-toggle" className="text-sm text-muted-foreground">
          Show NSFW
        </Label>
        <Switch
          id="nsfw-toggle"
          checked={includeNsfw}
          onCheckedChange={(checked) => setIncludeNsfw(!!checked)}
        />
      </div>

      <Masonry<PublicPersonaListItem>
        items={items}
        columnGutter={16}
        columnWidth={320}
        overscanBy={2}
        itemKey={(item) => item.id}
        render={({ data: persona }) => <Tile persona={persona} />}
        onRender={maybeLoadMore}
      />

      {isLoading && items.length > 0 ? (
        <div className="w-full p-8 flex justify-center">
          <CircleNotchIcon
            className="animate-spin text-muted-foreground"
            size={24}
          />
        </div>
      ) : null}

      {!hasMore && items.length > 0 ? (
        <div className="p-4 text-center text-xs text-muted-foreground">
          You're all caught up.
        </div>
      ) : null}
    </div>
  );
}

function Tile({ persona }: { persona: PublicPersonaListItem }) {
  // Create a deterministic small height variation per persona to better visualize masonry
  const variationSeed = Array.from(persona.id).reduce(
    (acc, ch) => acc + ch.charCodeAt(0),
    0
  );
  const imageHeight = [420, 480, 560][variationSeed % 3];

  return (
    <Link
      href={`/personas/${persona.slug}`}
      className="block rounded-md overflow-hidden group relative"
      prefetch={false}
    >
      <img
        style={{ height: imageHeight }}
        className="w-full block object-top object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        src={getImageUrl(persona.profileImageId)}
        alt={persona.headline || persona.publicName || "Persona"}
        loading="lazy"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pt-10 pb-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="text-white font-semibold text-base md:text-lg leading-tight">
          {persona.publicName}
        </div>
        <div className="text-white/80 text-[11px] md:text-xs">
          {persona.ageBucket}
        </div>
        {persona.headline ? (
          <div className="text-white/90 text-xs md:text-sm truncate">
            {persona.headline}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
