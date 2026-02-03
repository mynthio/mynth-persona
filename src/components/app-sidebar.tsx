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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { CreateButton } from "@/components/create-button";
import { Link } from "./ui/link";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="w-full flex flex-row items-center group-data-[collapsible=icon]:justify-center gap-3 justify-between">
              <Link
                href="/"
                className="flex items-center gap-2.5 group-data-[collapsible=icon]:gap-0"
              >
                {/* <img
                  className="aspect-square size-8 rounded-lg object-cover transition-transform hover:scale-105"
                  loading="lazy"
                  draggable={false}
                  src="https://mynth-persona-prod.b-cdn.net/static/prsna-logo.webp"
                  alt="Prsna"
                /> */}
                <span className="font-bold first-letter:text-primary text-foreground text-base tracking-tight group-data-[collapsible=icon]:hidden">
                  PRSNA
                </span>
              </Link>

              <CreateButton className="group-data-[collapsible=icon]:hidden" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <SidebarSeparator className="my-1" />
        <NavChats />
        <NavSecondary className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
