"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu01 as MenuIcon } from "@untitledui/icons";

export function MobileSidebarTrigger() {
  const { toggleSidebar, openMobile } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="fixed top-4 left-4 z-50 size-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-black/70 hover:text-white md:hidden"
      aria-label="Open menu"
      aria-expanded={openMobile}
    >
      <MenuIcon className="size-5" />
    </Button>
  );
}
