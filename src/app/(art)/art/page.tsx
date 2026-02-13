import { PaintBrush02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  TopBar,
  TopBarSidebarTrigger,
  TopBarTitle,
} from "@/components/layout/top-bar";
import { ArtGrid } from "../_components/art-grid";
import { MediaDialog } from "../_components/media-dialog";
import { ArtFilters } from "../_components/art-filters";
import { Suspense } from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Art Gallery - Character Portraits & Generated Images",
  description:
    "Explore stunning AI-generated character art and portraits. Browse community creations or generate your own AI character images on Persona.",
  keywords: [
    "AI art gallery",
    "AI character art",
    "AI generated portraits",
    "character images",
    "AI art generation",
    "anime character art",
  ],
  openGraph: {
    title: "AI Art Gallery - Character Portraits & Generated Images",
    description:
      "Explore stunning AI-generated character art and portraits. Browse community creations or generate your own.",
    url: "/art",
  },
  alternates: {
    canonical: "/art",
  },
};

export default function ArtPage() {
  return (
    <>
      <TopBar
        left={<TopBarSidebarTrigger />}
        center={
          <TopBarTitle>
            <HugeiconsIcon icon={PaintBrush02Icon} strokeWidth={1.5} /> Art
          </TopBarTitle>
        }
        right={
          <Suspense>
            <ArtFilters />
          </Suspense>
        }
      />
      <Suspense>
        <ArtGrid />
      </Suspense>
      <MediaDialog />
    </>
  );
}
