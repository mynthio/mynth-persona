"use client";

import {
  TopBar,
  TopBarSidebarTrigger,
  TopBarTitle,
} from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { useLocalStorage } from "@uidotdev/usehooks";
import { GlobeSlated01, GlobeSlated02, Sliders04 } from "@untitledui/icons";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { HeroCarousel } from "./hero-carousel";

const PublicPersonas = dynamic(() => import("./public-personas"), {
  ssr: false,
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
            <GlobeSlated01 strokeWidth={1.5} />{" "}
            <span className="uppercase text-[0.75rem]">Explore</span>
          </TopBarTitle>
        }
        right={<PersonasFilters />}
      />
      <HeroCarousel />
      <div className="h-4" />
      <PublicPersonas />
    </Suspense>
  );
}

function PersonasFilters() {
  const [includeNsfw, setIncludeNsfw] = useLocalStorage("show-nsfw", false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost">
          <Sliders04 strokeWidth={1.5} />
          Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Mature Content</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setIncludeNsfw(true)}>
            Show
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIncludeNsfw(false)}>
            Hide
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
