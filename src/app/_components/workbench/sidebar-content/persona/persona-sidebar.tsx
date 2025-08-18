"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Creator from "./creator";
import { useState } from "react";
import { useWorkbenchPersonaSidebarMode } from "@/hooks/use-workbench-persona-sidebar-mode";
import { GlobeIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";

export default function PersonaSidebar() {
  const [prompt, setPrompt] = useState("");
  const [personaWorkbenchMode, setPersonaWorkbenchMode] =
    useWorkbenchPersonaSidebarMode();

  return (
    <Tabs
      className="h-full min-h-0 max-h-full gap-0"
      value={personaWorkbenchMode}
      onValueChange={(value) => setPersonaWorkbenchMode(value)}
    >
      <div className="pt-2 px-2">
        <TabsList className="w-full">
          <TabsTrigger value="creator">
            <SparkleIcon />
            Creator
          </TabsTrigger>
          <TabsTrigger value="Publish">
            <GlobeIcon />
            Publish
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="creator" className="h-full min-h-0">
        <Creator prompt={prompt} setPrompt={setPrompt} />
      </TabsContent>
    </Tabs>
  );
}
