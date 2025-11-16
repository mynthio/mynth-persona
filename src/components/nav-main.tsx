"use client";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Globe04, HeartRounded } from "@untitledui/icons";

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {/* <SidebarMenuItem>
          <SidebarMenuButton>
            <HomeIcon /> Prsna
          </SidebarMenuButton>
        </SidebarMenuItem> */}

        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Globe04 strokeWidth={2} />
            <span>PrsnaNet</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <HeartRounded strokeWidth={2} /> <span>Library</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
