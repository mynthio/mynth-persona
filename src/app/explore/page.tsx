import {
  TopBar,
  TopBarSidebarTrigger,
  TopBarTitle,
} from "@/components/layout/top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { GlobeSlated01 } from "@untitledui/icons";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { PersonasFilters } from "../_components/personas-filters";

function PersonasLoadingSkeleton() {
  return (
    <div className="p-2 px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton
            key={i}
            className="rounded-[24px]"
            style={{ height: [520, 580, 620][i % 3] }}
          />
        ))}
      </div>
    </div>
  );
}

const PublicPersonas = dynamic(() => import("../_components/public-personas"), {
  ssr: true,
  loading: () => <PersonasLoadingSkeleton />,
});

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full p-8 text-center text-sm text-muted-foreground">
          <Spinner />
        </div>
      }
    >
      <TopBar
        left={<TopBarSidebarTrigger />}
        center={
          <TopBarTitle>
            <GlobeSlated01 strokeWidth={1.5} />{" "}
            <span className="uppercase text-[0.75rem]">Explore</span>
          </TopBarTitle>
        }
        right={<PersonasFilters />}
      />
      <PublicPersonas />
    </Suspense>
  );
}
