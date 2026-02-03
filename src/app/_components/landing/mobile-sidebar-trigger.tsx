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
      className="fixed top-4 left-4 z-50 size-10 rounded-full border border-border/60 bg-card/60 text-foreground backdrop-blur-md hover:bg-card/80 md:hidden"
      aria-label="Open menu"
      aria-expanded={openMobile}
    >
      <MenuIcon className="size-5" />
    </Button>
  );
}
