"use client";

import { Masonry } from "masonic";
import useSWRInfinite from "swr/infinite";
import { useMemo, useCallback } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getImageUrl } from "@/lib/utils";
import { useImageId } from "@/hooks/use-image-id.hook";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { useSearchParams } from "next/navigation";

type ArtItem = {
  id: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  nsfw: string;
  createdAt: Date;
  persona?: {
    id: string;
    profileImageIdMedia: string | null;
  };
  user?: {
    id: string;
    username: string | null;
    displayName: string | null;
    imageUrl: string | null;
  };
};

type ArtPage = {
  items: ArtItem[];
  nextCursor?: number;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Params that affect art grid fetching
const ART_FILTER_PARAMS = ["tags", "nsfw"] as const;

export function ArtGrid() {
  const [, setImageId] = useImageId();
  const searchParams = useSearchParams();

  // Only include params that actually affect the art query
  const filterParamsString = useMemo(() => {
    const params = new URLSearchParams();
    for (const key of ART_FILTER_PARAMS) {
      const values = searchParams.getAll(key);
      for (const value of values) {
        params.append(key, value);
      }
    }
    return params.toString();
  }, [searchParams]);

  const getKey = useCallback(
    (pageIndex: number, previousPageData: ArtPage | null) => {
      if (previousPageData && !previousPageData.items.length) return null;

      const params = new URLSearchParams(filterParamsString);

      if (pageIndex === 0) {
        params.set("cursor", "0");
      } else {
        if (!previousPageData?.nextCursor) return null;
        params.set("cursor", previousPageData.nextCursor.toString());
      }

      return `/api/art?${params.toString()}`;
    },
    [filterParamsString]
  );

  const { data, error, size, setSize, isValidating, isLoading } =
    useSWRInfinite<ArtPage>(getKey, fetcher);

  const items = data?.flatMap((page) => page.items) ?? [];

  const hasNextPage = data && data[data.length - 1]?.nextCursor !== undefined;

  const [sentryRef] = useInfiniteScroll({
    loading: isValidating,
    hasNextPage: !!hasNextPage,
    onLoadMore: () => setSize(size + 1),
    disabled: !!error,
    rootMargin: "0px 0px 400px 0px",
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error: {error.message || "Failed to load"}
      </div>
    );
  }

  return (
    <div className="w-full">
      {items.length > 0 ? (
        <Masonry
          key={filterParamsString}
          items={items}
          columnGutter={0}
          columnWidth={160}
          maxColumnCount={6}
          overscanBy={5}
          render={({ data: item }: { data: ArtItem }) => (
            <div
              className="relative group overflow-hidden rounded-none bg-muted/20 cursor-pointer break-inside-avoid"
              onClick={() => setImageId(item.id)}
            >
              <img
                src={getImageUrl(item.id, "full")}
                alt={item.tags?.[0] || "Art image"}
                className="w-full h-auto object-cover object-top transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                {item.user && (
                  <div className="text-white/80 text-xs truncate">
                    by {item.user.displayName || item.user.username || "User"}
                  </div>
                )}
                {!item.user && (
                  <div className="text-white/80 text-xs truncate">
                    by Anonymous
                  </div>
                )}
              </div>
            </div>
          )}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p>No art found matching your criteria</p>
        </div>
      )}

      <div ref={sentryRef} className="flex justify-center py-8">
        {isValidating && <Spinner className="size-6" />}
      </div>
    </div>
  );
}
