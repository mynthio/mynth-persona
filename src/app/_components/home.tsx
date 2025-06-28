"use client";

import { usePersonaStore } from "@/providers/persona-store-provider";
import PersonaEvents from "./persona-events";
import useSWR from "swr";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { useEffect, useState } from "react";
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
import { Button } from "@heroui/button";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr";
import { SignedOut, SignUp, SignUpButton, useAuth } from "@clerk/nextjs";
import { P } from "pino";

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

  if (!personaId) {
    return <Create />;
  }

  return isLargeScreen ? <DesktopLayout /> : <MobileLayout />;
}

function PersonaChat() {
  const { isSignedIn } = useAuth();

  const [personaId] = usePersonaId();

  return (
    <>
      <PersonaEvents />
      <CreatePropmpt />

      <SignedOut>
        <p className="text-center mx-auto max-w-2xl mt-4">
          <SignUpButton mode="modal">
            <button className="text-primary underline cursor-pointer">
              Create account
            </button>
          </SignUpButton>{" "}
          to save your persona, get higher rate limits, image generationp and
          free dailpy topkens
        </p>
      </SignedOut>
    </>
  );
}

function Create() {
  return (
    <div className="flex w-full h-full items-center justify-center">
      <div>
        <CreatePropmpt />
        <SignedOut>
          <p className="text-center mx-auto max-w-2xl mt-4">
            <SignUpButton mode="modal">
              <button className="text-primary underline cursor-pointer">
                Create account
              </button>
            </SignUpButton>{" "}
            to save your persona, get higher rate limits, image generationp and
            free dailpy topkens
          </p>
        </SignedOut>
      </div>
    </div>
  );
}

function CreatePropmpt() {
  const { isSignedIn } = useAuth();
  const [personaId] = usePersonaId();

  const [prompt, setPrompt] = useState("");

  return (
    <Card className="flex flex-col gap-2 max-w-2xl mx-auto p-2 w-full">
      <Textarea
        placeholder="Write about your persona"
        value={prompt}
        onValueChange={setPrompt}
        minRows={1}
        classNames={{
          input: "outline-none border-none",
          inputWrapper:
            "bg-transparent border-none shadow-none hover:bg-none data-[hover=true]:bg-transparent data-[hover=true]:bg-none data-[focus=true]:bg-transparent data-[focus=true]:bg-none",
        }}
      />

      <div className="flex items-center justify-between">
        <div></div>

        <Button isIconOnly color="primary" isDisabled={!prompt}>
          <PaperPlaneTiltIcon />
        </Button>
      </div>
    </Card>
  );
}

function DesktopLayout() {
  const [isOpen, setIsOpen] = useIsPersonaPanelOpened();

  return (
    <>
      <PanelGroup direction="horizontal" className="min-h-screen-minus-nav">
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
