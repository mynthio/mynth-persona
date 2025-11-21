import {
  TopBar,
  TopBarSidebarTrigger,
  TopBarTitle,
} from "@/components/layout/top-bar";
import { ArtGrid } from "../_components/art-grid";
import { Brush01 } from "@untitledui/icons";
import { MediaDialog } from "../_components/media-dialog";
import { ArtFilters } from "../_components/art-filters";
import { Suspense } from "react";

export const metadata = {
  title: "Art Gallery | Mynth Persona",
  description: "Explore community generated art.",
};

export default function ArtPage() {
  return (
    <>
      <TopBar
        left={<TopBarSidebarTrigger />}
        center={
          <TopBarTitle>
            <Brush01 strokeWidth={1.5} /> Art
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
