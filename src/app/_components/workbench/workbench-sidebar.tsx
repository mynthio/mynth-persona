"use client";

import { Button } from "@/components/ui/button";
import { useWorkbenchMode } from "@/hooks/use-workbench-mode.hook";
import { useMediaQuery } from "@/hooks/use-media-query.hook";
import { ToolboxIcon } from "@phosphor-icons/react/dist/ssr";
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
const ChatSidebar = dynamic(
  () => import("./sidebar-content/chat/chat-sidebar"),
  {
    ssr: false,
  }
);

const workbenchModeToSidebarComponent: Record<string, React.ComponentType> = {
  persona: PersonaSidebar,
  chat: ChatSidebar,
  gallery: GallerySidebar,
};

export default function WorkbenchSidebar() {
  // Use Tailwind's xl breakpoint (1280px) as the cutoff for switching to the mobile overlay
  const isMobile = useMediaQuery("(max-width: 1279px)");
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  const openMobilePanel = useCallback(() => setIsMobilePanelOpen(true), []);
  const closeMobilePanel = useCallback(() => setIsMobilePanelOpen(false), []);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="w-132 shrink-0 grow-0 p-4 sticky top-0 min-h-0 h-screen hidden xl:block">
        <Content />
      </div>

      {/* Mobile creator button */}
      {isMobile && !isMobilePanelOpen && (
        <div className="xl:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-full px-4">
          <button
            onClick={openMobilePanel}
            className="group relative max-w-full w-64 h-14 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            <span
              className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-emerald-400 opacity-90 blur-[6px] group-hover:blur-[8px] transition-all duration-300"
              aria-hidden="true"
            />
            <span className="relative block h-full rounded-full p-[2px]">
              <span className="flex h-full w-full items-center justify-center gap-2 rounded-full bg-sidebar text-sidebar-foreground text-base font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_8px_20px_-12px_rgba(6,182,212,0.25)] transition-shadow duration-300">
                <ToolboxIcon className="h-5 w-5" />
                Workbench
              </span>
            </span>
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
          <div className="absolute inset-2 rounded-lg border shadow-lg bg-sidebar text-sidebar-foreground flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto p-2">
              <Content />
            </div>
            <div className="p-3 border-t border-sidebar-border">
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
