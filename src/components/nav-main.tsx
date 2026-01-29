"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Feather,
  GlobeSlated01,
  Hearts,
  Users03,
  Image02,
  Brush01,
  Home01,
  ChevronDown,
} from "@untitledui/icons";
import { Link } from "./ui/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

export function NavMain() {
  const [libraryOpen, setLibraryOpen] = useState(false);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Discover</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <Home01 strokeWidth={1.5} />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/explore">
                <GlobeSlated01 strokeWidth={1.5} />
                <span>Explore</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/art">
                <Brush01 strokeWidth={1.5} />
                <span>Art</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/scenarios">
                <Feather strokeWidth={1.5} />
                <span>Scenarios</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Your Library</SidebarGroupLabel>
        <SidebarMenu>
          <Collapsible open={libraryOpen} onOpenChange={setLibraryOpen}>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  <Hearts strokeWidth={1.5} />
                  <span>Library</span>
                  <ChevronDown
                    className="ml-auto transition-transform duration-200 data-[state=open]:rotate-180"
                    data-state={libraryOpen ? "open" : "closed"}
                    strokeWidth={1.5}
                  />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link href="/library/personas">
                        <Users03 strokeWidth={1.5} />
                        <span>Personas</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link href="/library/scenarios">
                        <Feather strokeWidth={1.5} />
                        <span>Scenarios</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link href="/library/images">
                        <Image02 strokeWidth={1.5} />
                        <span>Images</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
