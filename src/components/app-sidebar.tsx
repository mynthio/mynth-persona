"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavChats } from "@/components/nav-chats";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CreateButton } from "@/components/create-button";
import { Link } from "./ui/link";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      variant="floating"
      className="rounded-none"
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="w-full flex flex-row items-center group-data-[collapsible=icon]:justify-center gap-2 justify-between">
              <Link href="/">
                <img
                  className="aspect-square size-8 rounded-md object-cover"
                  loading="lazy"
                  draggable={false}
                  src="https://mynth-persona-prod.b-cdn.net/static/prsna-logo.webp"
                  alt="Prsna"
                />
              </Link>

              <CreateButton className="group-data-[collapsible=icon]:hidden" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavChats />
        <NavSecondary className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
