import { Globe02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  TopBar,
  TopBarSidebarTrigger,
  TopBarTitle,
} from "@/components/layout/top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { PersonasFilters } from "./personas-filters";

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

const PublicPersonas = dynamic(() => import("./public-personas"), {
  ssr: true,
  loading: () => <PersonasLoadingSkeleton />,
});

export default function Home() {
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
            <HugeiconsIcon icon={Globe02Icon} strokeWidth={1.5} />{" "}
            <span className="uppercase text-[0.75rem]">Explore</span>
          </TopBarTitle>
        }
        right={<PersonasFilters />}
      />
      <PublicPersonas />
    </Suspense>
  );
}
