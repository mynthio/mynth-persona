"use client";

import { usePersonaStore } from "@/providers/persona-store-provider";
import PersonaEvents from "./persona-events";
import useSWR from "swr";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { useEffect } from "react";
import { PersonaWithVersion } from "@/types/persona.type";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/drawer";
import { useIsPersonaPanelOpened } from "@/hooks/use-is-persona-panel-opened.hook";
import {
  getPanelElement,
  getPanelGroupElement,
  getResizeHandleElement,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { useMediaQuery } from "@/hooks/use-media-query.hook";
import PersonaProfile from "./persona-profile";
import { Card } from "@heroui/card";
import { Textarea } from "@heroui/input";

export default function Home() {
  const isLargeScreen = useMediaQuery("(min-width: 768px)", {
    defaultValue: true,
  });
  const [personaId] = usePersonaId();

  const { data, setData, isLoadingData, setIsLoadingData } = usePersonaStore(
    (state) => state
  );

  const { isLoading, data: personaData } = useSWR<PersonaWithVersion>(
    personaId ? `/api/personas/${personaId}` : null,
    {
      revalidateOnMount: false,
    }
  );

  useEffect(() => {
    if (isLoading) {
      setIsLoadingData(true);
    }
  }, [isLoading]);

  useEffect(() => {
    if (personaData) {
      setData(personaData);
    }
  }, [personaData]);

  return isLargeScreen ? <DesktopLayout /> : <MobileLayout />;
}

function PersonaChat() {
  return (
    <>
      <PersonaEvents />
      <Prompt />
    </>
  );
}

function Prompt() {
  return (
    <Card className="">
      <Textarea
        classNames={{
          input: "outline-none border-none",
        }}
      />
    </Card>
  );
}

function DesktopLayout() {
  const [isOpen, setIsOpen] = useIsPersonaPanelOpened();

  return (
    <>
      <PanelGroup direction="horizontal">
        <Panel className="p-4 relative">
          <PersonaChat />
        </Panel>
        {isOpen && (
          <>
            <PanelResizeHandle />
            <Panel className="p-4 relative">
              <div>
                <PersonaProfile />
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </>
  );
}

function MobileLayout() {
  return (
    <>
      <PersonaChat />
      <MobilePersonaDrawer />
    </>
  );
}

function MobilePersonaDrawer() {
  const [isOpen, setIsOpen] = useIsPersonaPanelOpened();

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom"
      size="5xl"
    >
      <DrawerContent>
        <DrawerBody>
          <PersonaProfile />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
