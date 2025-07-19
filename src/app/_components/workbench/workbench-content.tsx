import React from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MiniWaveLoader } from "@/components/ui/mini-wave-loader";
import usePersonaGenerationStore from "@/stores/persona-generation.store";
import PersonaContent from "./content/persona";
import { useWorkbenchContent } from "@/hooks/use-workbench-content.hook";

const GalleryContent = dynamic(() => import("./content/gallery"), {
  ssr: false,
});
const PersonaVersionModal = dynamic(
  () => import("./content/persona-version-modal"),
  { ssr: false }
);

export default function WorkbenchContent() {
  const [workbenchContent] = useWorkbenchContent();
  return (
    <div className="min-h-screen min-w-0 w-full p-4 pb-32 md:pb-64">
      <TopBar />

      {workbenchContent === "gallery" ? <GalleryContent /> : <PersonaContent />}
      <PersonaVersionModal />
    </div>
  );
}

function TopBar() {
  const personaGenerationStore = usePersonaGenerationStore();
  const [workbenchContent, setWorkbenchContent] = useWorkbenchContent();

  if (personaGenerationStore.isGenerating) {
    return (
      <div className="flex justify-center items-center">
        <MiniWaveLoader aria-label="Generating persona" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center">
      <Tabs
        defaultValue="persona"
        value={workbenchContent}
        onValueChange={setWorkbenchContent}
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
