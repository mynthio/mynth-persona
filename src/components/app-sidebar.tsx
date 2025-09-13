import "server-only";

import { Sidebar } from "@/components/ui/sidebar";

import { SidebarContentRouter } from "./app-sidebar-content";

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas" className="left-[64px]">
      <SidebarContentRouter />
    </Sidebar>
  );
}
