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
  useSidebar,
} from "@/components/ui/sidebar";
import { Link } from "./ui/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Album02Icon, ArrowDown01Icon, FeatherIcon, FolderLibraryIcon, Globe02Icon, HeartCheckIcon, Home01Icon, Home02Icon, Image02Icon, PaintBrush02Icon, QuillWrite02Icon, SaturnIcon, UserGroupIcon, UserMultipleIcon } from "@hugeicons/core-free-icons";

export function NavMain() {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Discover</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <HugeiconsIcon icon={Home02Icon} />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/explore">
                <HugeiconsIcon icon={SaturnIcon} />
                <span>Explore</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/art">
                <HugeiconsIcon icon={Album02Icon} />
                <span>Art</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/scenarios">
                <HugeiconsIcon icon={QuillWrite02Icon} />
                <span>Scenarios</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Your Library</SidebarGroupLabel>
        <SidebarMenu>
          {isCollapsed ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Library">
                <Link href="/library">
                  <HugeiconsIcon icon={FolderLibraryIcon} />
                  <span>Library</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <Collapsible open={libraryOpen} onOpenChange={setLibraryOpen}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <HugeiconsIcon icon={FolderLibraryIcon} />
                    <span>Library</span>
                    <HugeiconsIcon icon={ArrowDown01Icon}
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
                          <HugeiconsIcon icon={UserMultipleIcon} />
                          <span>Personas</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <Link href="/library/scenarios">
                          <HugeiconsIcon icon={QuillWrite02Icon} />
                          <span>Scenarios</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <Link href="/library/images">
                          <HugeiconsIcon icon={Album02Icon} />A
                          <span>Images</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
