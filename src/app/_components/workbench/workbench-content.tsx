import React from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MiniWaveLoader } from "@/components/ui/mini-wave-loader";
import usePersonaGenerationStore from "@/stores/persona-generation.store";
import PersonaContent from "./content/persona/persona";

import { useWorkbenchMode } from "@/hooks/use-workbench-mode.hook";

const GalleryContent = dynamic(() => import("./content/gallery/gallery"), {
  ssr: false,
});
const PersonaVersionModal = dynamic(
  () => import("./content/persona/persona-version-modal"),
  { ssr: false }
);

export default function WorkbenchContent() {
  const [workbenchMode] = useWorkbenchMode();

  return (
    <div className="h-full min-w-0 w-full px-[12px] md:px-[24px] flex flex-col pb-[80px] md:pb-[12px]">
      <TopBar />

      {workbenchMode === "gallery" && <GalleryContent />}
      {workbenchMode === "persona" && <PersonaContent />}
      <PersonaVersionModal />
    </div>
  );
}

function TopBar() {
  const personaGenerationStore = usePersonaGenerationStore();
  const [workbenchMode, setWorkbenchMode] = useWorkbenchMode();

  if (personaGenerationStore.isGenerating) {
    return (
      <div className="flex justify-center items-center mt-[12px]">
        <MiniWaveLoader aria-label="Generating persona" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center sticky top-[12px] mt-[12px] z-50">
      <Tabs
        defaultValue="persona"
        value={workbenchMode}
        onValueChange={setWorkbenchMode}
      >
        <TabsList>
          <TabsTrigger value="persona">Persona</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

// PixelGridLoader moved to shared UI component
