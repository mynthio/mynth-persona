import { Suspense } from "react";

import {
  DEFAULT_GRADIENT_BACKGROUND,
  getGradientFromPalette,
  getImagePalette,
} from "@/lib/image-palette";

type PersonaBannerProps = {
  profileImageIdMedia: string | null;
  fallbackGradient?: string;
};

function PersonaBannerSkeleton({
  fallbackGradient = DEFAULT_GRADIENT_BACKGROUND,
}: {
  fallbackGradient?: string;
}) {
  return (
    <div
      className="absolute w-full h-[220px] top-0 left-0 right-0"
      style={{ backgroundImage: fallbackGradient }}
    />
  );
}

async function PersonaBannerGradient({
  profileImageIdMedia,
  fallbackGradient = DEFAULT_GRADIENT_BACKGROUND,
}: PersonaBannerProps) {
  const palette = await getImagePalette(profileImageIdMedia);
  const gradient = getGradientFromPalette(palette) ?? fallbackGradient;

  return (
    <div
      className="absolute w-full h-[180px] md:h-[220px] top-0 left-0 right-0"
      style={{ backgroundImage: gradient }}
    />
  );
}

export function PersonaBanner(props: PersonaBannerProps) {
  return (
    <Suspense
      fallback={
        <PersonaBannerSkeleton fallbackGradient={props.fallbackGradient} />
      }
    >
      <PersonaBannerGradient {...props} />
    </Suspense>
  );
}
