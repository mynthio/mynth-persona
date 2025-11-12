"use client";

import { HomeIcon, ImageIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { PersonIcon } from "@phosphor-icons/react/dist/ssr";

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
            <PersonIcon /> Personas
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton>
            <ImageIcon /> Images
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
