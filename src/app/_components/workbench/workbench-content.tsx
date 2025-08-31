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
const ChatContent = dynamic(() => import("./content/chat/chat"), {
  ssr: false,
});
const PersonaVersionModal = dynamic(
  () => import("./content/persona/persona-version-modal"),
  { ssr: false }
);

export default function WorkbenchContent() {
  const [workbenchMode] = useWorkbenchMode();

  return (
    <div className="min-h-screen min-w-0 w-full flex flex-col">
      <TopBar />

      {workbenchMode === "gallery" && <GalleryContent />}
      {workbenchMode === "chat" && <ChatContent />}
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
      <div className="flex justify-center items-center">
        <MiniWaveLoader aria-label="Generating persona" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center sticky top-2 z-50">
      <Tabs
        defaultValue="persona"
        value={workbenchMode}
        onValueChange={setWorkbenchMode}
      >
        <TabsList>
          <TabsTrigger value="persona">Persona</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

// PixelGridLoader moved to shared UI component
