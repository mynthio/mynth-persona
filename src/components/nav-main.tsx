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
} from "@untitledui/icons";
import { Link } from "./ui/link";

export function NavMain() {
  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <GlobeSlated01 strokeWidth={1.5} />
                <span>Explore</span>
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

        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <Link href="/library">
              <Hearts strokeWidth={1.5} /> <span>Library</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarGroup>
    </>
  );
}
