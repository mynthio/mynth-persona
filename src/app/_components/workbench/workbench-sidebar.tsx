"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useWorkbenchMode } from "@/hooks/use-workbench-mode.hook";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ButterflyIcon,
  PaintBrushIcon,
  PlanetIcon,
  SparkleIcon,
  ToolboxIcon,
} from "@phosphor-icons/react/dist/ssr";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useState } from "react";

const Creator = dynamic(() => import("./sidebar-content/creator"), {
  ssr: false,
});
const Imagine = dynamic(() => import("./sidebar-content/imagine"), {
  ssr: false,
});
const Interact = dynamic(() => import("./sidebar-content/interact"), {
  ssr: false,
});
const Publish = dynamic(() => import("./sidebar-content/publish"), {
  ssr: false,
});

export default function WorkbenchSidebar() {
  const isMobile = useIsMobile();
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  const openMobilePanel = useCallback(() => setIsMobilePanelOpen(true), []);
  const closeMobilePanel = useCallback(() => setIsMobilePanelOpen(false), []);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="w-132 shrink-0 p-4 sticky top-0 h-screen hidden md:block">
        <Content />
      </div>

      {/* Mobile creator button */}
      {isMobile && !isMobilePanelOpen && (
        <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-full px-4">
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
        <div className="md:hidden fixed inset-0 z-50">
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
  const [workbenchMode, setWorkbenchMode] = useWorkbenchMode();

  const [creatorPrompt, setCreatorPrompt] = useState("");

  return (
    <Tabs
      className="bg-sidebar h-full rounded-lg p-2"
      defaultValue="creator"
      value={workbenchMode}
      onValueChange={setWorkbenchMode}
    >
      <TabsList className="w-full bg-sidebar">
        <TabsTrigger value="creator">
          <SparkleIcon />
          Creator
        </TabsTrigger>
        <TabsTrigger value="imagine">
          <PaintBrushIcon />
          Imagine
        </TabsTrigger>
        <TabsTrigger value="interact">
          <ButterflyIcon />
          Interact
        </TabsTrigger>
        <TabsTrigger value="publish">
          <PlanetIcon />
          Publish
        </TabsTrigger>
      </TabsList>

      <TabsContent value="creator" className="h-full min-h-0">
        <Suspense fallback={<div>Loading...</div>}>
          <Creator prompt={creatorPrompt} setPrompt={setCreatorPrompt} />
        </Suspense>
      </TabsContent>
      <TabsContent value="imagine" className="h-full min-h-0">
        <Suspense fallback={<div>Loading...</div>}>
          <Imagine />
        </Suspense>
      </TabsContent>
      <TabsContent value="interact" className="h-full min-h-0">
        <Suspense fallback={<div>Loading...</div>}>
          <Interact />
        </Suspense>
      </TabsContent>
      <TabsContent value="publish" className="h-full min-h-0">
        <Suspense fallback={<div>Loading...</div>}>
          <Publish />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
