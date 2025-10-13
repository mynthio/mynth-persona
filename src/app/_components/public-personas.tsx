"use client";

import { PublicPersonaListItem } from "@/schemas/shared/persona-public.schema";
import { getImageUrl, getVideoUrl } from "@/lib/utils";
import { Masonry, useInfiniteLoader } from "masonic";
import { useCallback, useMemo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CircleNotchIcon,
  EyeClosedIcon,
  EyeIcon,
  FadersHorizontalIcon,
  GenderFemaleIcon,
  GenderMaleIcon,
  GenderNonbinaryIcon,
  QuestionMarkIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useLocalStorage } from "@uidotdev/usehooks";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/fetcher";
import { Menu } from "@base-ui-components/react/menu";
import { Button } from "@/components/mynth-ui/base/button";

export default function PublicPersonas() {
  const [includeNsfw, setIncludeNsfw] = useLocalStorage("show-nsfw", false);

  // Build SWR Infinite key function (cursorPublishedAt + cursorId)
  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData?: {
        data: PublicPersonaListItem[];
        hasMore: boolean;
        nextPublishedAt?: string | null;
        nextId?: string | null;
      }
    ) => {
      const base = "/api/public/personas";
      const params = new URLSearchParams();

      if (includeNsfw) {
        params.set("includeNsfw", "true");
      }

      // First page
      if (pageIndex === 0) {
        const qs = params.toString();
        return qs ? `${base}?${qs}` : base;
      }

      // Stop if no more pages
      if (!previousPageData || !previousPageData.hasMore) return null;

      // Prefer server-provided cursors, fall back to computing from last item
      let cursorPublishedAt: string | null = null;
      let cursorId: string | null = null;

      // Check for server-provided cursor values first
      if (previousPageData.nextPublishedAt && previousPageData.nextId) {
        cursorPublishedAt = previousPageData.nextPublishedAt;
        cursorId = previousPageData.nextId;
      } else {
        // Fall back to computing from the last item of the previous page
        const prevItems = previousPageData.data || [];
        if (!prevItems.length) return null;

        const last = prevItems[prevItems.length - 1]!;
        cursorPublishedAt = new Date(last.publishedAt as any).toISOString();
        cursorId = last.id;
      }

      // Only set URLSearchParams keys when cursor values exist
      if (cursorPublishedAt) {
        params.set("cursorPublishedAt", cursorPublishedAt);
      }
      if (cursorId) {
        params.set("cursorId", cursorId);
      }

      const qs = params.toString();
      return `${base}?${qs}`;
    },
    [includeNsfw]
  );

  const { data, size, setSize, isLoading, isValidating } = useSWRInfinite<{
    data: PublicPersonaListItem[];
    hasMore: boolean;
    nextPublishedAt?: string | null;
    nextId?: string | null;
  }>(getKey, fetcher, {
    revalidateFirstPage: false,
  });

  // Reset pagination when filter changes to avoid mixing datasets
  useEffect(() => {
    setSize(1);
  }, [includeNsfw, setSize]);

  const items = useMemo(
    () => (data ? data.flatMap((page) => page?.data ?? []) : []),
    [data]
  );

  const hasMore = data ? data[data.length - 1]?.hasMore ?? false : true;

  // Setup infinite loader for Masonry
  const maybeLoadMore = useInfiniteLoader(
    async (_startIndex, _stopIndex, _currentItems) => {
      if (isLoading || isValidating || !hasMore) return;
      await setSize(size + 1);
    },
    {
      isItemLoaded: (index, items) => items[index] != null,
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
      <div className="flex items-center justify-end gap-3 px-[24px] mb-[12px] z-50 relative">
        <Menu.Root>
          <Menu.Trigger render={<Button variant="outline" />}>
            filters
            <FadersHorizontalIcon />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner className="outline-none z-[100]" sideOffset={8}>
              <Menu.Popup className="z-50 w-[124px] p-[4px] origin-[var(--transform-origin)] rounded-[16px] bg-[canvas] text-gray-900 shadow-lg shadow-surface-foreground/30 outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
                <div className="px-[12px] py-[6px] text-xs font-medium text-surface-foreground/60 capitalize">
                  mature content
                </div>
                <Menu.Item
                  onClick={() => setIncludeNsfw(false)}
                  className="flex cursor-default w-full
                   items-center justify-between gap-[6px]
                h-[36px] px-[12px]
                rounded-[12px]
                text-sm leading-4 
                outline-none 
                select-none 
                transition-colors
                duration-200
                text-surface-foreground/80
                
                data-[highlighted]:text-surface-foreground
                
                data-[highlighted]:bg-surface-foreground/10
                "
                >
                  Off
                  <EyeClosedIcon />
                </Menu.Item>
                <Menu.Item
                  onClick={() => setIncludeNsfw(true)}
                  className="flex cursor-default w-full
                   items-center justify-between gap-[6px]
                h-[36px] px-[12px]
                rounded-[12px]
                text-sm leading-4 
                outline-none 
                select-none 
                transition-colors
                duration-200
                text-surface-foreground/80
                
                data-[highlighted]:text-surface-foreground
                
                data-[highlighted]:bg-surface-foreground/10
                "
                >
                  On
                  <EyeIcon />
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>

      <Masonry<PublicPersonaListItem>
        key={includeNsfw ? "nsfw-on" : "nsfw-off"}
        items={items}
        columnGutter={16}
        columnWidth={320}
        overscanBy={2}
        maxColumnCount={4}
        itemKey={(item) => item.id}
        render={({ data: persona }) => <Tile persona={persona} />}
        onRender={maybeLoadMore}
      />

      {isValidating && items.length > 0 ? (
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
  const genderIcon = useMemo(() => {
    switch (persona.gender) {
      case "female":
        return (
          <div className="size-[38px] bg-pink-500/30 flex items-center justify-center backdrop-blur-md rounded-[13px] text-pink-500/80">
            <GenderFemaleIcon size={18} />
          </div>
        );
      case "male":
        return (
          <div className="size-[38px] bg-blue-500/30 flex items-center justify-center backdrop-blur-md rounded-[13px] text-blue-500/80">
            <GenderMaleIcon size={18} />
          </div>
        );
      default:
        return (
          <div className="size-[38px] bg-surface-100/50 flex items-center justify-center backdrop-blur-md rounded-[13px] text-surface-foreground/80">
            <GenderNonbinaryIcon size={18} />
          </div>
        );
    }
  }, [persona.gender]);
  const variationSeed = Array.from(persona.id).reduce(
    (acc, ch) => acc + ch.charCodeAt(0),
    0
  );
  const imageHeight = [520, 580, 620][variationSeed % 3];

  const hasVideo = Boolean(persona.profileSpotlightMediaId);
  const videoUrl = hasVideo
    ? getVideoUrl(persona.profileSpotlightMediaId as string)
    : undefined;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoVisible, setVideoVisible] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);

  useEffect(() => {
    if (!hasVideo || !videoRef.current) return;

    const el = videoRef.current;
    let observer: IntersectionObserver | null = null;

    const tryPlay = () => {
      if (!el) return;
      if (hasPlayedOnce) return;
      el.play().catch(() => {
        // Autoplay might be blocked; we'll rely on hover
      });
    };

    // Prefer IntersectionObserver; fallback to immediate attempt
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              tryPlay();
              break;
            }
          }
        },
        { threshold: 0.25 }
      );
      observer.observe(el);
    } else {
      tryPlay();
    }

    return () => {
      if (observer && el) observer.unobserve(el);
      observer = null;
    };
  }, [hasVideo, hasPlayedOnce]);

  const onVideoEnded = useCallback(() => {
    setVideoVisible(false);
    setHasPlayedOnce(true);
  }, []);

  const onVideoPlay = useCallback(() => {
    setVideoVisible(true);
  }, []);

  const onHoverReplay = useCallback(() => {
    if (!hasVideo || !videoRef.current) return;
    // Replay on hover; make it visible again
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
  }, [hasVideo]);

  return (
    <Link
      href={`/personas/${persona.slug}`}
      className="rounded-[24px] overflow-hidden group relative bg-background flex flex-col justify-between hover:scale-101 transition-all duration-250 shadow-xl shadow-zinc-300/0 hover:shadow-zinc-800/10"
      style={{ height: imageHeight }}
      prefetch={false}
      onMouseEnter={onHoverReplay}
    >
      <div className="flex items-center gap-[6px] justify-end z-10 p-[11px]">
        <div
          className="h-[38px] px-[9px] bg-surface-100/50 flex items-center justify-center backdrop-blur-md rounded-[13px] 
        text-surface-foreground/80 text-[0.66rem]"
        >
          {persona.ageBucket === "unknown" ? (
            <QuestionMarkIcon size={14} />
          ) : (
            persona.ageBucket
          )}
        </div>
        {genderIcon}
      </div>

      <div className="pointer-events-none z-10 bg-gradient-to-t from-background via-background to-background/0 pt-[48px] pb-[32px] px-[24px]">
        <div className="text-foreground/80 font-[600] font-onest text-[1.66rem] leading-[1.52rem]">
          {persona.publicName}
        </div>
        {/* <div className="text-white/80 text-[11px] md:text-xs">
          {persona.ageBucket}
        </div> */}

        <div className="text-foreground/70 text-[0.93rem] leading-[0.935rem] mt-[6px]">
          {persona.headline}
        </div>
      </div>
      {/* Base image as poster and fallback */}
      <img
        className="w-full h-full block absolute           
          top-0 left-0 right-0 bottom-0 
          object-top object-cover "
        src={getImageUrl(persona.profileImageId)}
        alt={persona.headline || persona.publicName || "Persona"}
        loading="lazy"
      />

      {/* Spotlight video overlay (plays once, then hides; hover to replay) */}
      {hasVideo && videoUrl ? (
        <video
          ref={videoRef}
          className={`w-full h-full absolute top-0 left-0 right-0 bottom-0 object-cover transition-opacity duration-200 ${
            isVideoVisible ? "opacity-100" : "opacity-0"
          }`}
          src={videoUrl}
          poster={getImageUrl(persona.profileImageId)}
          muted
          playsInline
          preload="metadata"
          onPlay={onVideoPlay}
          onEnded={onVideoEnded}
          crossOrigin="anonymous"
        />
      ) : null}
    </Link>
  );
}
