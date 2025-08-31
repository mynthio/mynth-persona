"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Imagine from "./imagine";
import Advanced from "./advanced";
import { useWorkbenchGallerySidebarMode } from "@/hooks/use-workbench-gallery-sidebar-mode";
import { SparkleIcon, GearIcon } from "@phosphor-icons/react/dist/ssr";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function GallerySidebar() {
  const [galleryWorkbenchMode, setGalleryWorkbenchMode] =
    useWorkbenchGallerySidebarMode();

  return (
    <Tabs
      className="h-full min-h-0"
      value={galleryWorkbenchMode}
      onValueChange={(value) => setGalleryWorkbenchMode(value)}
    >
      <div className="p-2">
        <TabsList className="w-full">
          <TabsTrigger value="imagine">
            <SparkleIcon />
            Imagine
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <GearIcon />
            Advanced
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="imagine" className="h-full min-h-0">
        <Imagine />
      </TabsContent>

      <TabsContent value="advanced" className="h-full">
        <Advanced />
      </TabsContent>
    </Tabs>
  );
}
