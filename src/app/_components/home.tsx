"use client";

import { usePersonaStore } from "@/providers/persona-store-provider";
import PersonaEvents from "./persona-events";
import useSWR, { mutate, useSWRConfig } from "swr";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { Suspense, useEffect, useMemo, useState } from "react";
import { PersonaWithVersion } from "@/types/persona.type";
import { Drawer, DrawerContent, DrawerBody } from "@heroui/drawer";
import { useIsPersonaPanelOpened } from "@/hooks/use-is-persona-panel-opened.hook";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useMediaQuery } from "@/hooks/use-media-query.hook";
import PersonaProfile from "./persona-profile";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import {
  ImageIcon,
  PaperPlaneTiltIcon,
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
import { RadioGroup, Radio, RadioProps } from "@heroui/radio";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { useIsImagineMode } from "@/hooks/use-is-imagine-mode.hook";
import { cn } from "@heroui/react";
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

  return (
    <>
      {isLargeScreen ? <DesktopLayout /> : <MobileLayout />}

      <Suspense>
        <ImagineModal />
      </Suspense>
    </>
  );
}

function CustomRadio(props: RadioProps) {
  const { children, ...otherProps } = props;

  return (
    <Radio
      {...otherProps}
      classNames={{
        base: cn(
          "inline-flex m-0 bg-content1 hover:bg-content2 items-center justify-between",
          "flex-row-reverse max-w-[300px] cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent",
          "data-[selected=true]:border-primary"
        ),
      }}
    >
      {children}
    </Radio>
  );
}

function ImagineModal() {
  const [isOpen, setIsOpen] = useIsImagineMode();
  const personaStore = usePersonaStore((state) => state);
  const [isLoading, setIsLoading] = useState(false);

  const [personaId] = usePersonaId();

  if (!personaId) return null;

  const onGenerate = async () => {
    if (isLoading) return;
    setIsLoading(true);

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

    setIsLoading(false);

    // scroll to the bottom of the page
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    setIsOpen(false);

    addToast({
      title: "Image generation started",
      color: "success",
    });

    mutate<GetPersonaEventsByIdResponse>(
      `/api/personas/${personaId}/events`,
      (prev) => [...(prev ?? []), event as any],
      {
        revalidate: false,
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="4xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Generate Persona Image
            </ModalHeader>
            <ModalBody>
              <p className="text-sm text-default-700">
                We're planning to introduce much more options and models soon.
                We're still working on it. Feel free to check our{" "}
                <a
                  className="underline"
                  href="https://discord.gg/ktHXuPVaqB"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discord
                </a>{" "}
                for updates and suggestions about models.
              </p>

              <Form>
                <RadioGroup
                  defaultValue="low"
                  isRequired
                  classNames={{
                    base: "w-full",
                    wrapper: "grid grid-cols-3",
                  }}
                >
                  <CustomRadio description="Low quality" value="low">
                    Low <Chip>Free</Chip>
                  </CustomRadio>
                  <CustomRadio
                    description="High quality"
                    value="medium"
                    isDisabled
                  >
                    Medium (soon)
                  </CustomRadio>
                  <CustomRadio
                    description="High quality"
                    value="high"
                    isDisabled
                  >
                    High (soon)
                  </CustomRadio>
                </RadioGroup>
              </Form>
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="light"
                onPress={onClose}
                isDisabled={isLoading}
              >
                Close
              </Button>
              <Button
                color="primary"
                onPress={onGenerate}
                isLoading={isLoading}
              >
                Generate
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
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
  return (
    <div
      id="persona-prompt-wrapper"
      className="fixed max-md:right-0 bottom-4 max-md:w-full left-0 z-30 pl-4 max-md:pr-4 w-1/2"
    >
      <Card
        id="persona-prompt"
        className="flex flex-col gap-2 mx-auto p-2 w-full max-w-2xl"
      >
        <EnhancePersonaPrompt />
      </Card>
    </div>
  );
}

function EnhancePersonaPrompt() {
  const [prompt, setPrompt] = useState("");
  const personaStore = usePersonaStore((state) => state);
  const [generationMode, setGenerationMode] = useGenerationMode();
  const [isImagineMode, setIsImagineMode] = useIsImagineMode();
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
            onPress={() => setIsImagineMode(true, { history: "replace" })}
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
