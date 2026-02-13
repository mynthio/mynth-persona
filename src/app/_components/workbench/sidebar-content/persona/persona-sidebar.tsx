"use client";

import { Globe02Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Creator from "./creator";
import { useState } from "react";
import { useWorkbenchPersonaSidebarMode } from "@/hooks/use-workbench-persona-sidebar-mode";
import WorkbenchSidebarManage from "./manage";

export default function PersonaSidebar() {
  const [prompt, setPrompt] = useState("");
  const [personaWorkbenchMode, setPersonaWorkbenchMode] =
    useWorkbenchPersonaSidebarMode();

  return (
    <Tabs
      className="h-full min-h-0 max-h-full gap-0 flex flex-col"
      value={personaWorkbenchMode}
      onValueChange={(value) => setPersonaWorkbenchMode(value)}
    >
      <div className="pt-3 px-3">
        <TabsList className="w-full bg-card/50 border border-border/30 backdrop-blur-sm p-1 rounded-xl">
          <TabsTrigger
            value="creator"
            className="rounded-lg gap-1.5 text-xs font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
          >
            <HugeiconsIcon icon={SparklesIcon} className="size-3.5" />
            Creator
          </TabsTrigger>
          <TabsTrigger
            value="manage"
            className="rounded-lg gap-1.5 text-xs font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
          >
            <HugeiconsIcon icon={Globe02Icon} className="size-3.5" />
            Manage
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="creator" className="h-full min-h-0">
        <Creator prompt={prompt} setPrompt={setPrompt} />
      </TabsContent>
      <TabsContent value="manage" className="h-full min-h-0">
        <WorkbenchSidebarManage />
      </TabsContent>
    </Tabs>
  );
}
