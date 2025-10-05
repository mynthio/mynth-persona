"use client";

import { Button } from "@/components/ui/button";
import { useWorkbenchMode } from "@/hooks/use-workbench-mode.hook";
import { useMediaQuery } from "@/hooks/use-media-query.hook";
import { ToolboxIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

const PersonaSidebar = dynamic(
  () => import("./sidebar-content/persona/persona-sidebar"),
  {
    ssr: false,
  }
);
const GallerySidebar = dynamic(
  () => import("./sidebar-content/gallery/gallery-sidebar"),
  {
    ssr: false,
  }
);

const workbenchModeToSidebarComponent: Record<string, React.ComponentType> = {
  persona: PersonaSidebar,
  gallery: GallerySidebar,
};

export default function WorkbenchSidebar() {
  // Use Tailwind's xl breakpoint (1280px) as the cutoff for switching to the mobile overlay
  const isMobile = useMediaQuery("(max-width: 1279px)");
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [workbenchMode] = useWorkbenchMode();

  const openMobilePanel = useCallback(() => setIsMobilePanelOpen(true), []);
  const closeMobilePanel = useCallback(() => setIsMobilePanelOpen(false), []);

  // Determine mobile button icon and label based on workbench mode
  const MobileIcon = workbenchMode === "gallery" ? SparkleIcon : ToolboxIcon; // default persona
  const mobileLabel = workbenchMode === "gallery" ? "create" : "workbench";

  return (
    <>
      {/* Desktop sidebar */}
      <div className="w-[420px] shrink-0 grow-0 p-4 fixed  right-[9px] top-[9px] min-h-0 h-auto bottom-[9px] hidden xl:block">
        <Content />
      </div>

      {/* Mobile creator button */}
      {isMobile && !isMobilePanelOpen && (
        <div className="xl:hidden fixed bottom-[90px] left-1/2 -translate-x-1/2 z-40 max-w-full px-4">
          <button
            onClick={openMobilePanel}
            className="inline-flex items-center justify-center gap-2 w-56 h-12 rounded-full bg-sidebar text-sidebar-foreground text-sm font-medium px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            <MobileIcon className="h-4 w-4" />
            {mobileLabel}
          </button>
        </div>
      )}

      {/* Mobile full-screen overlay panel */}
      {isMobile && isMobilePanelOpen && (
        <div className="xl:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeMobilePanel}
          />
          {/* Panel container with small spacing from sides */}
          <div className="absolute inset-2 rounded-lg text-sidebar-foreground flex flex-col overflow-hidden pb-[80px]">
            <div className="flex-1 min-h-0 overflow-y-auto p-2">
              <Content />
            </div>
            <div className="p-3">
              <Button
                onClick={closeMobilePanel}
                className="w-full rounded-full py-6 text-base"
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Content() {
  const [workbenchMode] = useWorkbenchMode();
  const SidebarComponent =
    workbenchModeToSidebarComponent[workbenchMode as string];

  return (
    <div className="bg-surface-100 h-full min-h-0 rounded-lg overflow-hidden">
      {SidebarComponent ? <SidebarComponent /> : null}
    </div>
  );
}
