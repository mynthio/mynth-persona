"use client";

import { CommandIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "./ui/badge";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "./ui/sidebar";

export function AppSidebarHeader() {
  const sidebar = useSidebar();

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          {sidebar.state === "collapsed" ? (
            <AppSidebarHeaderContentCollapsed />
          ) : (
            <AppSidebarHeaderContentExpanded />
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}

function AppSidebarHeaderContentCollapsed() {
  return (
    <SidebarMenuButton asChild>
      <SidebarTrigger />
    </SidebarMenuButton>
  );
}

function AppSidebarHeaderContentExpanded() {
  return (
    <div className="flex items-center justify-between">
      <img
        src="https://cdn.persona.mynth.io/logo.webp"
        width={36}
        height={36}
      />

      <div className="flex items-center gap-1">
        <Badge variant="secondary">
          <CommandIcon />B
        </Badge>

        <SidebarTrigger />
      </div>
    </div>
  );
}
