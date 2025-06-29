"use client";

import { usePersonaStore } from "@/providers/persona-store-provider";
import PersonaEvents from "./persona-events";
import useSWR, { mutate, useSWRConfig } from "swr";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { useEffect, useMemo, useState } from "react";
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
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import {
  CopyIcon,
  ImageIcon,
  PaperPlaneTiltIcon,
  PencilIcon,
  PokerChipIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { SignedOut, SignUp, SignUpButton, useAuth } from "@clerk/nextjs";

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

export default function Home() {
  const isLargeScreen = useMediaQuery("(min-width: 768px)", {
    defaultValue: true,
  });
  const [personaId] = usePersonaId();
  const [personaVersionId] = usePersonaVersionId();

  const { data, setData, isLoadingData, setIsLoadingData } = usePersonaStore(
    (state) => state
  );

  const { isLoading, data: personaData } = useSWR<PersonaWithVersion>(
    personaId
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
      console.log("isLoading", isLoading);
      setIsLoadingData(true);
    }
  }, [isLoading]);

  useEffect(() => {
    if (personaData) {
      console.log("personaData", personaData);
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
            to save your persona, get higher rate limits, image generationp and
            free dailpy topkens
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
            to save your persona, get higher rate limits, image generationp and
            free dailpy topkens
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

  const generate = async () => {
    console.log("generate", prompt);
  };

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

  if (!personaId) return null;

  const generate = async () => {
    const { object, personaEventId } = await enhancePersonaAction(
      personaId,
      prompt
    );

    for await (const partialObject of readStreamableValue(object)) {
      if (!partialObject) continue;

      personaStore.setData({
        ...personaStore.data!,
        currentVersionId: "new",
        version: {
          ...personaStore.data?.version!,
          id: "new",
          personaData: {
            ...personaStore.data?.version?.personaData,
            ...partialObject?.persona,
          },
        },
      });
    }

    mutate(`/api/personas/${personaId}`);
    mutate(`/api/personas/${personaId}/events`);
    mutate(`/api/personas`);
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
          <Chip variant="flat" startContent={<PokerChipIcon />} color="primary">
            1 token
          </Chip>
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
            5 tokens
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

    // @ts-ignore
    const { personaId, ...response } = isSignedIn
      ? await generatePersonaAction(prompt)
      : await generatePersonaAnonymousAction(prompt);

    console.log("response", response);

    personaStore.setData({
      createdAt: new Date(),
      currentVersionId: "1",
      id: personaId ?? "1",
      title: null,
      profileImageId: null,
      updatedAt: new Date(),
      userId: isSignedIn ? userId : "",
      version: {
        aiModel: "",
        changedProperties: null,
        createdAt: new Date(),
        id: "1",
        personaData: {} as any,
        personaId: "1",
        systemPromptId: "",
        title: null,
        versionNumber: 1,
      },
    });

    setIsPanelOpen(true, { history: "replace" });
    setPersonaId(personaId ?? "1", { history: "replace" });

    const { object } = response;

    for await (const partialObject of readStreamableValue(object)) {
      if (!partialObject) continue;

      personaStore.setData({
        ...personaStore.data!,
        version: {
          ...personaStore.data?.version!,
          personaData: {
            // ...personaStore.data?.version?.personaData,
            ...partialObject?.persona,
          },
        },
      });
    }

    personaStore.setIsGenerationInProgress(false);
    mutate(`/api/personas/${personaId}`);
    mutate(`/api/personas/${personaId}/events`);
    mutate(`/api/personas`);
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
          <div className="p-4 pb-36">
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

                      {version && (
                        <Chip>
                          Version {version.versionNumber}: {version.title}
                        </Chip>
                      )}
                    </div>

                    <div className="flex items-center gap-2 min-h-0">
                      {version && (
                        <PersonaCopyButton
                          variant="light"
                          data={version.personaData}
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
      size="4xl"
      backdrop="blur"
    >
      <DrawerContent>
        <DrawerBody>
          <PersonaProfile />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
