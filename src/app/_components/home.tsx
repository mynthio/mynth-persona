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
import { Card } from "@/components/ui/card";
import { Textarea } from "@heroui/input";
import { Button } from "@/components/ui/button";
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
      errorRetryCount: 0,
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

    try {
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
    } catch (error) {
      console.error("Failed to generate persona image:", error);
      addToast({
        title: "Failed to generate image",
        description: "Please try again later",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
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
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Close
              </Button>
              <Button onClick={onGenerate} disabled={isLoading}>
                {isLoading ? "Generating..." : "Generate"}
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
      <div className="h-full min-h-screen relative flex flex-col gap-10 justify-between bg-background">
        <PersonaEvents />
        <PersonaPrompt />

        <SignedOut>
          <div className="text-center mx-auto max-w-2xl mt-6">
            <p className="text-muted-foreground font-light">
              <SignUpButton mode="modal">
                <button className="text-primary underline cursor-pointer font-medium">
                  Create account
                </button>
              </SignUpButton>{" "}
              to save your persona, get higher rate limits, image generation,
              and free daily tokens
            </p>
          </div>
        </SignedOut>
      </div>
    </>
  );
}

function Create() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light tracking-tight text-foreground mb-3">
            Create Your Persona
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            Describe your character and watch them come to life
          </p>
        </div>

        <div className="space-y-8">
          <PersonaStack />
          <CreatePropmpt />

          <SignedOut>
            <div className="text-center">
              <p className="text-muted-foreground font-light">
                <SignUpButton mode="modal">
                  <button className="text-primary underline cursor-pointer font-medium">
                    Create account
                  </button>
                </SignUpButton>{" "}
                to save your persona, get higher rate limits, image generation,
                and free daily tokens
              </p>
            </div>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}

function PersonaPrompt() {
  return (
    <div
      id="persona-prompt-wrapper"
      className="sticky max-md:right-0 max-md:w-full bottom-4 z-30 pl-4 max-md:pr-4 w-full min-h-min h-min max-w-2xl mx-auto"
    >
      <Card
        id="persona-prompt"
        className="flex flex-col gap-4 mx-auto p-4 w-full border border-border"
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

  const { isSignedIn, userId } = useAuth();
  if (!personaId) return null;

  if (!isSignedIn)
    return (
      <p className="text-muted-foreground font-light text-center py-4">
        Sign in to enhance your persona
      </p>
    );

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

    // Add user prompt event to the events list immediately
    if (personaEventId) {
      mutate<GetPersonaEventsByIdResponse>(
        `/api/personas/${personaId}/events`,
        (prev) => [
          ...(prev ?? []),
          {
            id: personaEventId,
            personaId,
            userId: userId ?? "",
            type: "persona_edit" as const,
            userMessage: prompt,
            aiNote: null,
            errorMessage: null,
            tokensCost: 1,
            createdAt: new Date(),
            versionId: null,
            version: null,
            imageGenerations: [],
          },
        ],
        {
          revalidate: false,
        }
      );
    }

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (prompt && !personaStore.isGenerationInProgress) {
        generate();
      }
    }
  };

  return (
    <>
      <Textarea
        placeholder="Enhance your persona with followup prompts"
        value={prompt}
        onValueChange={setPrompt}
        onKeyDown={handleKeyDown}
        minRows={1}
        classNames={{
          input: "outline-none border-none",
          inputWrapper:
            "bg-transparent border-none shadow-none hover:bg-none data-[hover=true]:bg-transparent data-[hover=true]:bg-none data-[focus=true]:bg-transparent data-[focus=true]:bg-none",
        }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSignedIn && (
            <span className="text-xs text-muted-foreground font-light">
              1 token
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            disabled={personaStore.isGenerationInProgress}
            onClick={() => setIsImagineMode(true, { history: "replace" })}
          >
            <ImageIcon />
          </Button>

          <Button
            size="icon"
            disabled={!prompt || personaStore.isGenerationInProgress}
            onClick={generate}
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

  // Quick suggestion examples
  const suggestionExamples = [
    "Anime cat girl who's secretly a hacker",
    "Medieval knight who discovered time travel",
    "Cosplayer girl who builds robots in her spare time",
    "Wizard librarian who collects ancient memes",
    "Space pirate captain with a pet dragon",
    "Shy bookstore owner who's actually a superhero",
    "Gaming streamer who can talk to computers",
    "Coffee shop barista who reads minds",
    "Fashion designer from the future",
    "Detective cat who solves mysteries",
    "Alien exchange student learning human culture",
    "Vampire chef who only cooks vegan food",
    "Robot maid who dreams of becoming an artist",
    "Fairy tale princess who's a tech startup CEO",
    "Ninja who runs a flower shop",
    "Cyberpunk musician with neon hair",
    "Witch who runs a modern potion delivery service",
    "Astronaut who collects space plants",
    "Artist who paints with magical colors",
    "Photographer who captures souls in pictures",
    "A ghost who haunts a social media app",
    "A mermaid who works as a marine biologist",
    "A retired god running a bed and breakfast",
    "A sentient AI trying to understand human emotions through poetry",
    "A time-traveling historian who corrects Wikipedia articles",
    "A dimension-hopping delivery person",
    "An elf who is a famous rockstar in the human world",
    "A street artist whose graffiti comes to life",
    "A private investigator who is also a werewolf",
    "A gnome who invents steampunk gadgets",
    "A cyborg detective in a noir city",
    "An oracle who gives prophecies in the form of cryptic tweets",
    "A dragon who hoards vintage video games instead of gold",
    "A demon who works in customer service",
    "A super-soldier who now runs a successful bakery",
  ];

  // Get 3 random suggestions
  const getRandomSuggestions = () => {
    const shuffled = [...suggestionExamples].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Set random suggestions only on client side to avoid hydration issues
  useEffect(() => {
    setSuggestions(getRandomSuggestions());
  }, []);

  const handleSuggestionClick = async (suggestion: string) => {
    if (personaStore.isGenerationInProgress) return;
    setPrompt(suggestion);

    // Trigger generation immediately
    await generate(suggestion);
  };

  const generate = async (promptText?: string) => {
    const textToUse = promptText || prompt;
    if (!textToUse) return;

    if (personaStore.isGenerationInProgress) return;
    personaStore.setIsGenerationInProgress(true);

    // Handle signed in users
    if (isSignedIn) {
      const response = await generatePersonaAction(textToUse);

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

      const { object, personaId: newPersonaId, personaEventId } = response;

      // Add user prompt event to the events list immediately
      if (personaEventId && newPersonaId) {
        mutate<GetPersonaEventsByIdResponse>(
          `/api/personas/${newPersonaId}/events`,
          (prev) => [
            ...(prev ?? []),
            {
              id: personaEventId,
              personaId: newPersonaId,
              userId: userId ?? "",
              type: "persona_create" as const,
              userMessage: textToUse,
              aiNote: null,
              errorMessage: null,
              tokensCost: 1,
              createdAt: new Date(),
              versionId: null,
              version: null,
              imageGenerations: [],
            },
          ],
          {
            revalidate: false,
          }
        );
      }

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

      try {
        for await (const partialObject of readStreamableValue(object)) {
          console.log("partialObject", partialObject);
          if (!partialObject) continue;

          if (partialObject.error) {
            personaStore.setIsGenerationInProgress(false);
            addToast({
              title: "Error",
              description:
                "Error generating persona. Please try again or contact support.",
              color: "danger",
            });
            return;
          }

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
      } catch (error) {
        console.error(error);
        console.log("Error happened here  heheheh");
        personaStore.setIsGenerationInProgress(false);
        addToast({
          title: "Error",
          description:
            "Error generating persona. Please try again or contact support.",
          color: "danger",
        });
        return;
      }

      setPrompt("");
      personaStore.setIsGenerationInProgress(false);
      mutate(`/api/personas/${newPersonaId}`);
      mutate(`/api/personas/${newPersonaId}/events`);
      mutate(`/api/personas`);
    } else {
      // Handle anonymous users
      const response = await generatePersonaAnonymousAction(textToUse);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (prompt && !personaStore.isGenerationInProgress) {
        generate();
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-3 max-w-3xl mx-auto p-3 w-full border border-border">
        <Textarea
          placeholder="Write about your persona"
          value={prompt}
          onValueChange={setPrompt}
          onKeyDown={handleKeyDown}
          minRows={1}
          classNames={{
            input: "outline-none border-none text-foreground",
            inputWrapper:
              "bg-transparent border-none shadow-none hover:bg-none data-[hover=true]:bg-transparent data-[hover=true]:bg-none data-[focus=true]:bg-transparent data-[focus=true]:bg-none",
          }}
        />

        <div className="flex items-center justify-between">
          <div></div>

          <Button
            size="icon"
            disabled={!prompt || personaStore.isGenerationInProgress}
            onClick={() => generate()}
          >
            <PaperPlaneTiltIcon />
          </Button>
        </div>
      </Card>

      {/* Quick suggestion buttons */}
      <div className="max-w-3xl mx-auto">
        <p className="text-sm text-muted-foreground mb-3 text-center">
          Or try one of these ideas:
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={personaStore.isGenerationInProgress}
              className="text-xs bg-background/50 hover:bg-background border-border/50 hover:border-border transition-colors"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
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
      <PanelGroup
        direction="horizontal"
        className="w-full min-h-screen !overflow-clip"
        autoSaveId={null}
      >
        <Panel minSize={25} defaultSize={60} className="!overflow-clip h-full">
          <div className="p-6 h-full w-full">
            <PersonaChat />
          </div>
        </Panel>
        {isOpen && (
          <>
            <PanelResizeHandle />

            <Panel
              id="persona-panel"
              className="!overflow-clip bg-muted/30 border-l border-border"
              minSize={25}
              defaultSize={40}
            >
              <div className="h-screen sticky top-0 bottom-0 flex flex-col gap-6 px-6 py-8 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(personaStore.isGenerationInProgress ||
                      personaStore.isLoadingData) && <Spinner />}

                    {version && version.versionNumber > 0 && (
                      <Chip>
                        Version {version.versionNumber}: {version.title}
                      </Chip>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                  >
                    <XIcon />
                  </Button>
                </div>

                <div className="h-full">
                  <PersonaProfile />
                </div>
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
