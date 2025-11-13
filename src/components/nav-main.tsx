"use client";

import { HomeIcon, ImageIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { HeartRounded } from "@untitledui/icons";

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
          <SidebarMenuButton>
            <HeartRounded strokeWidth={2} /> Library
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
