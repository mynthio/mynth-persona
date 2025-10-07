import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getImageUrl = (
  imageId: string,
  variant: "full" | "thumb" = "full"
) => {
  const suffix = variant === "thumb" ? "_thumb" : "";
  return `${process.env.NEXT_PUBLIC_CDN_BASE_URL}/personas/${imageId}${suffix}.webp`;
};

/**
 * Adds an item to a collection organized by keys, avoiding duplicates.
 * @param prev The previous collection state, or undefined if creating a new collection
 * @param key The key to add the item under
 * @param item The item to add
 * @param idExtractor Optional function to extract an ID from the item for duplicate checking
 * @returns The updated collection
 */
export const addItemToCollection = <
  T,
  K extends string | number | symbol,
  U = unknown
>(
  prev: Record<K, T[]> | undefined,
  key: K,
  item: T,
  idExtractor?: (item: T) => U
): Record<K, T[]> => {
  // Handle null/undefined items
  if (item === null || item === undefined) {
    return prev || ({} as Record<K, T[]>);
  }

  if (!prev) {
    return { [key]: [item] } as Record<K, T[]>;
  }

  const existing = prev[key];
  if (!existing) {
    return { ...prev, [key]: [item] };
  }

  // Check for duplicates
  const isDuplicate = idExtractor
    ? existing.some(
        (existingItem) => idExtractor(existingItem) === idExtractor(item)
      )
    : existing.some((existingItem) => existingItem === item);

  if (isDuplicate) {
    return prev;
  }

  return { ...prev, [key]: [...existing, item] };
};

export type WeightedId = { id: string; priority: number };

/**
 * Picks a main id and two fallbacks (or fewer) using weighted random ordering without replacement.
 * Higher priority increases chance of earlier positions.
 */
export function pickByWeightedPriority(
  config: WeightedId[],
  totalPicks: number = 3
): { main: string; fallbacks: string[] } {
  if (!Array.isArray(config) || config.length === 0) {
    return { main: "", fallbacks: [] };
  }

  const valid = config.filter(
    (m) => m && typeof m.priority === "number" && m.priority > 0
  );
  const pool = valid.length > 0 ? valid : config;

  // Efraimidis–Spirakis: key = -ln(U) / weight; sort ascending by key
  const keyed = pool.map((m) => {
    const u = Math.random();
    const weight = Math.max(1e-6, m.priority || 0);
    const key = -Math.log(u) / weight;
    return { id: m.id, key };
  });

  keyed.sort((a, b) => a.key - b.key);

  const picks = keyed.slice(0, totalPicks).map((k) => k.id);
  const main = picks[0] ?? pool[0]?.id ?? config[0]?.id ?? "";
  const fallbacks = picks.slice(1).filter(Boolean);

  return { main, fallbacks };
}
