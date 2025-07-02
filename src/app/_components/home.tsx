"use client";

import { usePersonaStore } from "@/providers/persona-store-provider";
import PersonaEvents from "./persona-events";
import useSWR, { mutate, useSWRConfig } from "swr";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { useEffect, useMemo, useState } from "react";
import { PersonaWithVersion } from "@/types/persona.type";
import { Drawer, DrawerContent, DrawerBody } from "@heroui/drawer";
import { useIsPersonaPanelOpened } from "@/hooks/use-is-persona-panel-opened.hook";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useMediaQuery } from "@/hooks/use-media-query.hook";
import PersonaProfile from "./persona-profile";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import {
  ImageIcon,
  PaperPlaneTiltIcon,
  PencilIcon,
  PokerChipIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { SignedOut, SignUpButton, useAuth } from "@clerk/nextjs";

import { generatePersonaAnonymousAction } from "@/actions/generate-persona-anonymous.action";
import { generatePersonaAction } from "@/actions/generate-persona.action";
import { readStreamableValue } from "ai/rsc";
import PersonaStack from "./persona-stack";
import { Chip } from "@heroui/chip";
import PersonaCopyButton from "./persona-copy-button";
import { Spinner } from "@heroui/spinner";
import { useGenerationMode } from "@/hooks/use-generation-mode.hook";
import { enhancePersonaAction } from "@/actions/enhance-persona.action";
import { usePersonaVersionId } from "@/hooks/use-persona-version-id.hook";
import { generatePersonaImage } from "@/actions/generate-persona-image";
import { GetPersonaEventsByIdResponse } from "../api/personas/[personaId]/events/route";
import { addToast } from "@heroui/toast";

export default function Home() {
  const isLargeScreen = useMediaQuery("(min-width: 768px)", {
    defaultValue: true,
  });
  const { isSignedIn } = useAuth();
  const [personaId] = usePersonaId();
  const [personaVersionId] = usePersonaVersionId();

  const { data, setData, isLoadingData, setIsLoadingData } = usePersonaStore(
    (state) => state
  );

  const { isLoading, data: persona } = useSWR<PersonaWithVersion>(
    isSignedIn && personaId
      ? personaVersionId
        ? `/api/personas/${personaId}/versions/${personaVersionId}`
        : `/api/personas/${personaId}`
      : null,
    {
      revalidateOnMount: true,
    }
  );

  useEffect(() => {
    if (isLoading) {
      setIsLoadingData(true);
    }
  }, [isLoading]);

  useEffect(() => {
    if (persona) {
      setData(persona);
    }
  }, [persona]);

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
      <div className="min-h-full relative grid grid-cols-1">
        <PersonaEvents />
        <PersonaPrompt />

        <SignedOut>
          <p className="text-center mx-auto max-w-2xl mt-4">
            <SignUpButton mode="modal">
              <button className="text-primary underline cursor-pointer">
                Create account
              </button>
            </SignUpButton>{" "}
            to save your persona, get higher rate limits, image generation, and
            free daily tokens
          </p>
        </SignedOut>
      </div>
    </>
  );
}

function Create() {
  return (
    <div className="flex w-full h-screen-minus-nav items-center justify-center">
      <div className="w-full">
        <PersonaStack />
        <CreatePropmpt />
        <SignedOut>
          <p className="text-center mx-auto max-w-2xl mt-4">
            <SignUpButton mode="modal">
              <button className="text-primary underline cursor-pointer">
                Create account
              </button>
            </SignUpButton>{" "}
            to save your persona, get higher rate limits, image generation, and
            free daily tokens
          </p>
        </SignedOut>
      </div>
    </div>
  );
}

function PersonaPrompt() {
  const [generationMode] = useGenerationMode();
  const [prompt, setPrompt] = useState("");
  const personaStore = usePersonaStore((state) => state);

  return (
    <div
      id="persona-prompt-wrapper"
      className="fixed max-md:right-0 bottom-4 max-md:w-full left-0 z-30 pl-4 max-md:pr-4 w-1/2"
    >
      <Card
        id="persona-prompt"
        className="flex flex-col gap-2 mx-auto p-2 w-full max-w-2xl"
      >
        {generationMode === "creator" ? (
          <EnhancePersonaPrompt />
        ) : (
          <ImaginePrompt />
        )}
      </Card>
    </div>
  );
}

function EnhancePersonaPrompt() {
  const [prompt, setPrompt] = useState("");
  const personaStore = usePersonaStore((state) => state);
  const [generationMode, setGenerationMode] = useGenerationMode();
  const [personaId] = usePersonaId();
  const { mutate } = useSWRConfig();

  const { isSignedIn } = useAuth();
  if (!personaId) return null;

  if (!isSignedIn) return <p>Sign in to enhance your persona</p>;

  const generate = async () => {
    if (personaStore.isGenerationInProgress) return;
    personaStore.setIsGenerationInProgress(true);

    const response = await enhancePersonaAction(personaId, prompt);

    if (!response.success) {
      if (response.error === "INSUFFICIENT_TOKENS") {
        addToast({
          title: "Insufficient tokens",
          description:
            "You don't have enough tokens to enhance your persona. Please try again tomorrow or buy more tokens.",
          color: "danger",
        });
      }

      personaStore.setIsGenerationInProgress(false);
      return;
    }

    const { object, personaEventId } = response;

    if (!object) {
      personaStore.setIsGenerationInProgress(false);
      return;
    }

    for await (const partialObject of readStreamableValue(object!)) {
      if (!partialObject) continue;

      personaStore.setData({
        ...personaStore.data!,
        currentVersionId: "new",
        version: {
          ...personaStore.data?.version!,
          id: "new",
          data: {
            ...personaStore.data?.version?.data,
            ...partialObject?.persona,
          },
        },
      });
    }

    setPrompt("");

    mutate(`/api/personas/${personaId}`);
    mutate(`/api/personas/${personaId}/events`);
    mutate(`/api/personas`);
    mutate(`/api/me/balance`);

    personaStore.setIsGenerationInProgress(false);
  };

  return (
    <>
      <Textarea
        placeholder="Enhance your persona with followup prompts"
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
        <div>
          {isSignedIn && (
            <Chip
              variant="flat"
              startContent={<PokerChipIcon />}
              color="primary"
            >
              1 token
            </Chip>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="light"
            isIconOnly
            onPress={() => setGenerationMode("imagine")}
          >
            <ImageIcon />
          </Button>

          <Button
            isIconOnly
            color="primary"
            isDisabled={!prompt}
            isLoading={personaStore.isGenerationInProgress}
            onPress={generate}
          >
            <PaperPlaneTiltIcon />
          </Button>
        </div>
      </div>
    </>
  );
}

function ImaginePrompt() {
  const personaStore = usePersonaStore((state) => state);
  const [generationMode, setGenerationMode] = useGenerationMode();

  const [personaId] = usePersonaId();

  if (!personaId) return null;

  const generate = async () => {
    if (personaStore.isGenerationInProgress) return;
    personaStore.setIsGenerationInProgress(true);

    const {
      event,
      taskId: runId,
      publicAccessToken,
    } = await generatePersonaImage(personaId);

    personaStore.setImageGenerationRuns({
      ...personaStore.imageGenerationRuns,
      [runId]: {
        runId,
        publicAccessToken,
      },
    });

    personaStore.setIsGenerationInProgress(false);

    mutate<GetPersonaEventsByIdResponse>(
      `/api/personas/${personaId}/events`,
      (prev) => [...(prev ?? []), event as any],
      {
        revalidate: false,
      }
    );
  };

  return (
    <>
      <Textarea
        placeholder="Imagine your persona (image prompts will be available soon)"
        isDisabled
        minRows={1}
        classNames={{
          input: "outline-none border-none",
          inputWrapper:
            "bg-transparent border-none shadow-none hover:bg-none data-[hover=true]:bg-transparent data-[hover=true]:bg-none data-[focus=true]:bg-transparent data-[focus=true]:bg-none",
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <Chip variant="flat" startContent={<PokerChipIcon />} color="primary">
            0 tokens
          </Chip>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="light"
            isIconOnly
            onPress={() => setGenerationMode("creator")}
          >
            <PencilIcon />
          </Button>

          <Button
            isIconOnly
            color="primary"
            isLoading={personaStore.isGenerationInProgress}
            onPress={generate}
          >
            <ImageIcon />
          </Button>
        </div>
      </div>
      <p className="text-sm text-center text-default-700 mt-2">
        During beta testing, image generation is free for all users but uses
        basic models. Higher quality models will be available soon.
      </p>
    </>
  );
}

function CreatePropmpt() {
  const { isSignedIn, userId } = useAuth();
  const [personaId, setPersonaId] = usePersonaId();

  const { mutate } = useSWRConfig();

  const [prompt, setPrompt] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useIsPersonaPanelOpened();

  const personaStore = usePersonaStore((state) => state);

  const generate = async () => {
    if (personaStore.isGenerationInProgress) return;
    personaStore.setIsGenerationInProgress(true);

    // Handle signed in users
    if (isSignedIn) {
      const response = await generatePersonaAction(prompt);

      if (!response.success) {
        if (response.error === "INSUFFICIENT_TOKENS") {
          addToast({
            title: "Insufficient tokens",
            description:
              "You don't have enough tokens to create a persona. Please try again tomorrow or buy more tokens.",
            color: "danger",
          });
        }

        personaStore.setIsGenerationInProgress(false);
        return;
      }

      const { object, personaId: newPersonaId } = response;

      if (!object) {
        personaStore.setIsGenerationInProgress(false);
        return;
      }

      personaStore.setData({
        createdAt: new Date(),
        currentVersionId: "1",
        id: newPersonaId ?? "1",
        title: null,
        profileImageId: null,
        updatedAt: new Date(),
        userId: userId,
        version: {
          aiModel: "",
          changedProperties: null,
          createdAt: new Date(),
          id: "1",
          data: {} as any,
          personaId: "1",
          settings: {},
          title: null,
          versionNumber: 1,
        },
      });

      setIsPanelOpen(true, { history: "replace" });
      setPersonaId(newPersonaId ?? "new", { history: "replace" });

      for await (const partialObject of readStreamableValue(object)) {
        if (!partialObject) continue;

        personaStore.setData({
          ...personaStore.data!,
          version: {
            ...personaStore.data?.version!,
            data: {
              // ...personaStore.data?.version?.data,
              ...partialObject?.persona,
            },
          },
        });
      }

      setPrompt("");
      personaStore.setIsGenerationInProgress(false);
      mutate(`/api/personas/${newPersonaId}`);
      mutate(`/api/personas/${newPersonaId}/events`);
      mutate(`/api/personas`);
    } else {
      // Handle anonymous users
      const response = await generatePersonaAnonymousAction(prompt);

      if (!response.success) {
        if (response.error === "RATE_LIMIT_EXCEEDED") {
          addToast({
            title: "Rate limit exceeded",
            description:
              "You have reached the daily rate limit. Please try again tomorrow or sign up for a free account and get higher rate limits.",
            color: "danger",
          });
        }

        personaStore.setIsGenerationInProgress(false);
        return;
      }

      const { object } = response;

      if (!object) {
        personaStore.setIsGenerationInProgress(false);
        return;
      }

      personaStore.setData({
        createdAt: new Date(),
        currentVersionId: "1",
        id: "1",
        title: null,
        profileImageId: null,
        updatedAt: new Date(),
        userId: "",
        version: {
          aiModel: "",
          changedProperties: null,
          createdAt: new Date(),
          id: "1",
          data: {} as any,
          personaId: "1",
          settings: {},
          title: null,
          versionNumber: 1,
        },
      });

      setIsPanelOpen(true, { history: "replace" });
      setPersonaId("new", { history: "replace" });

      for await (const partialObject of readStreamableValue(object)) {
        if (!partialObject) continue;

        personaStore.setData({
          ...personaStore.data!,
          version: {
            ...personaStore.data?.version!,
            data: {
              // ...personaStore.data?.version?.data,
              ...partialObject?.persona,
            },
          },
        });
      }

      setPrompt("");
      personaStore.setIsGenerationInProgress(false);
    }
  };

  return (
    <Card className="flex flex-col gap-2 max-w-3xl mx-auto p-2 w-full">
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

        <Button
          isIconOnly
          color="primary"
          isDisabled={!prompt}
          isLoading={personaStore.isGenerationInProgress}
          onPress={generate}
        >
          <PaperPlaneTiltIcon />
        </Button>
      </div>
    </Card>
  );
}

function DesktopLayout() {
  const [isOpen, setIsOpen] = useIsPersonaPanelOpened();

  const personaStore = usePersonaStore((state) => state);

  const version = useMemo(() => {
    if (!personaStore.data) return null;
    return personaStore.data.version;
  }, [personaStore.data]);

  return (
    <>
      <PanelGroup direction="horizontal" className="w-full" autoSaveId={null}>
        <Panel
          minSize={25}
          defaultSize={50}
          onResize={(size) => {
            document
              .getElementById("persona-prompt-wrapper")
              ?.style.setProperty("width", `${size}%`);
          }}
        >
          <div className="p-4 pb-64">
            <PersonaChat />
          </div>
        </Panel>
        {isOpen && (
          <>
            <PanelResizeHandle />

            <Panel
              id="persona-panel"
              minSize={25}
              defaultSize={50}
              className="h-screen-minus-nav"
            >
              <div className="p-4 h-full">
                <Card shadow="sm" className="h-full">
                  <CardHeader className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {(personaStore.isGenerationInProgress ||
                        personaStore.isLoadingData) && <Spinner />}

                      {version && version.versionNumber > 0 && (
                        <Chip>
                          Version {version.versionNumber}: {version.title}
                        </Chip>
                      )}
                    </div>

                    <div className="flex items-center gap-2 min-h-0">
                      {version && (
                        <PersonaCopyButton
                          variant="light"
                          data={version.data}
                        />
                      )}

                      <Button
                        variant="light"
                        isIconOnly
                        onPress={() => setIsOpen(false)}
                      >
                        <XIcon />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardBody className="max-lg:p-4 p-8 mx-auto overflow-y-auto h-full min-h-0">
                    <PersonaProfile />
                  </CardBody>
                </Card>
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
      className="max-h-full h-11/12"
      backdrop="blur"
      scrollBehavior="inside"
    >
      <DrawerContent>
        <DrawerBody className="overflow-y-auto">
          <PersonaProfile />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
