"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Feather,
  GlobeSlated01,
  HeartRounded,
  Hearts,
  PlusCircle,
  Users03,
  Image02,
  Brush01,
  Home01,
} from "@untitledui/icons";
import { Link } from "./ui/link";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";

export function NavMain() {
  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <Home01 strokeWidth={1.5} />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/explore">
                <GlobeSlated01 strokeWidth={1.5} />
                <span>Explore</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/art">
                <Brush01 strokeWidth={1.5} /> <span>Art</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/scenarios">
                <Feather strokeWidth={1.5} /> <span>Scenarios</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Your Prsna</SidebarGroupLabel>

        <SidebarMenuItem className="list-none">
          <HoverCard openDelay={0} closeDelay={0}>
            <HoverCardTrigger asChild>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/library">
                  <Hearts strokeWidth={1.5} /> <span>Library</span>
                </Link>
              </SidebarMenuButton>
            </HoverCardTrigger>
            <HoverCardContent side="right" align="start" className="w-48 p-1">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 font-normal"
                  asChild
                >
                  <Link href="/library/personas">
                    <Users03 className="size-4" strokeWidth={1.5} />
                    <span>Personas</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 font-normal"
                  asChild
                >
                  <Link href="/library/scenarios">
                    <Feather className="size-4" strokeWidth={1.5} />
                    <span>Scenarios</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 font-normal"
                  asChild
                >
                  <Link href="/library/images">
                    <Image02 className="size-4" strokeWidth={1.5} />
                    <span>Images</span>
                  </Link>
                </Button>
              </div>
            </HoverCardContent>
          </HoverCard>
        </SidebarMenuItem>
      </SidebarGroup>
    </>
  );
}
