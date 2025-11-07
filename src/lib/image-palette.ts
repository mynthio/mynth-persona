import "server-only";

import sharp from "sharp";
import { cache } from "react";

import { getImageUrl } from "@/lib/utils";

type RGB = [number, number, number];

const DEFAULT_GRADIENT: RGB[] = [
  [17, 24, 39],
  [76, 29, 149],
  [124, 58, 237],
];

const clampChannel = (value: number) => Math.max(0, Math.min(255, value));

const adjustColor = (color: RGB, amount: number): RGB => {
  if (amount === 0) {
    return color;
  }

  if (amount > 0) {
    return color.map((channel) =>
      clampChannel(Math.round(channel + (255 - channel) * amount))
    ) as RGB;
  }

  const factor = Math.max(0, 1 + amount);
  return color.map((channel) =>
    clampChannel(Math.round(channel * factor))
  ) as RGB;
};

const colorDistance = (a: RGB, b: RGB) => {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const toCssColor = ([r, g, b]: RGB) => `rgb(${r}, ${g}, ${b})`;
export const DEFAULT_GRADIENT_COLORS = DEFAULT_GRADIENT.map(toCssColor);

const quantizeChannel = (value: number) => Math.floor(value / 32); // 0-7

const computePalette = async (imageId: string): Promise<RGB[]> => {
  const imageUrl = getImageUrl(imageId, "full");

  const response = await fetch(imageUrl, {
    headers: {
      Accept: "image/webp,image/*,*/*;q=0.8",
      "Cache-Control": "public, max-age=86400",
    },
    cache: "force-cache",
    next: {
      revalidate: 60 * 60, // 1 hour cache on edge/runtime
      tags: [
        "persona-profile-images",
        imageId ? `persona-profile-image-${imageId}` : undefined,
      ].filter(Boolean) as string[],
    },
  });

  if (!response.ok) {
    return DEFAULT_GRADIENT;
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength === 0) {
    return DEFAULT_GRADIENT;
  }

  const { data, info } = await sharp(Buffer.from(arrayBuffer))
    .resize(96, 96, { fit: "inside" })
    .removeAlpha()
    .toColorspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  if (channels < 3) {
    return DEFAULT_GRADIENT;
  }

  const buckets = new Map<
    string,
    { r: number; g: number; b: number; count: number }
  >();

  for (let i = 0; i <= data.length - channels; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const key = `${quantizeChannel(r)}-${quantizeChannel(g)}-${quantizeChannel(
      b
    )}`;
    const bucket = buckets.get(key);

    if (bucket) {
      bucket.count += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  const candidates = Array.from(buckets.values())
    .map(({ r, g, b, count }) => ({
      color: [
        Math.round(r / count),
        Math.round(g / count),
        Math.round(b / count),
      ] as RGB,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const palette: RGB[] = [];

  for (const candidate of candidates) {
    const isDistinct = palette.every(
      (existing) => colorDistance(existing, candidate.color) >= 36
    );

    if (isDistinct || palette.length === 0) {
      palette.push(candidate.color);
    }

    if (palette.length >= 3) {
      break;
    }
  }

  if (palette.length === 0) {
    return DEFAULT_GRADIENT;
  }

  if (palette.length === 1) {
    const base = palette[0];
    return [adjustColor(base, -0.25), base, adjustColor(base, 0.25)];
  }

  if (palette.length === 2) {
    const [first, second] = palette;
    return [first, second, adjustColor(second, 0.2)];
  }

  return palette.slice(0, 3);
};

export const getImagePalette = cache(
  async (imageId: string | null | undefined) => {
    if (!imageId) {
      return DEFAULT_GRADIENT.map(toCssColor);
    }

    try {
      const colors = await computePalette(imageId);
      return colors.map(toCssColor);
    } catch (error) {
      console.error("Failed to compute palette", error);
      return DEFAULT_GRADIENT.map(toCssColor);
    }
  }
);

export const getGradientFromPalette = (colors: string[]) => {
  if (!colors.length) {
    return undefined;
  }

  const stops = colors.slice(0, 3);
  return `linear-gradient(125deg, ${stops.join(", ")})`;
};

export const DEFAULT_GRADIENT_BACKGROUND = getGradientFromPalette(
  DEFAULT_GRADIENT_COLORS
)!;
