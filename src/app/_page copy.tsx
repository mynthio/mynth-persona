"use client";

import { generatePersonaAnonymousAction } from "@/actions/generate-persona-anonymous.action";
import Aurora from "@/components/backgrounds/aurora";
import type { PersonaData } from "@/types/persona.type";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import {
  CameraIcon,
  CaretRightIcon,
  DotsSixVerticalIcon,
  ImageIcon,
  ShootingStarIcon,
} from "@phosphor-icons/react/ssr";
import { readStreamableValue } from "ai/rsc";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { Badge } from "@heroui/badge";
import {
  getPanelElement,
  getPanelGroupElement,
  getResizeHandleElement,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import PersonaPanel from "./_components/persona-panel";
import PersonaStack from "./_components/persona-stack";
import { SignedOut, useAuth } from "@clerk/nextjs";
import { generatePersonaAction } from "@/actions/generate-persona.action";
import useSWR, { useSWRConfig } from "swr";
import {
  PersonaEvent,
  PersonaEventWithVersion,
} from "@/types/persona-event.type";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";

import Link from "next/link";
import { enhancePersonaAction } from "@/actions/enhance-persona.action";
import { PersonaImageGeneration } from "./_components/persona-image-generation";
import { Tooltip } from "@heroui/tooltip";
import { generatePersonaImage } from "@/actions/generate-persona-image";
import { PersonaImageEvent } from "./_components/persona-image-event";
import { addToast } from "@heroui/toast";
import { GetPersonaEventsByIdResponse } from "./api/personas/[personaId]/events/route";

export default function Home() {
  const { isSignedIn } = useAuth();
  const { mutate } = useSWRConfig();
  const [generation, setGeneration] = useState<any>({});
  const [data, setData] = useState<PersonaData | null>(null);

  const [generationMode, setGenerationMode] = useQueryState("m", {
    clearOnDefault: true,
    history: "replace",
    defaultValue: "creator",
  });

  const [personaId, setPersonaId] = useQueryState("persona_id");
  const [personaVersionId, setPersonaVersionId] =
    useQueryState("persona_version_id");

  const [isPersonaPanelOpen, setIsPersonaPanelOpen] = useQueryState("panel");
  const [isGenerating, setIsGenerating] = useState(false);

  const [prompt, setPrompt] = useState("");

  const { data: persona } = useSWR(
    personaId && isSignedIn ? `/api/personas/${personaId}` : null,
    {
      onSuccess: (persona) => {
        setData(persona.currentVersion?.data || null);
        setIsPersonaPanelOpen("1");
      },
    }
  );

  console.log("I'm re-rendering");

  const { data: personaEvents } = useSWR<GetPersonaEventsByIdResponse>(
    personaId && isSignedIn ? `/api/personas/${personaId}/events` : null
  );

  const handlePersonGenerate = async () => {
    if (!prompt || prompt.trim() === "") {
      return;
    }

    if (isGenerating) {
      return;
    }

    if (!isSignedIn && personaId) {
      return;
    }

    setIsGenerating(true);

    const { object, ...savedPersonaIds } = isSignedIn
      ? personaId
        ? await enhancePersonaAction(personaId, prompt)
        : await generatePersonaAction(prompt)
      : await generatePersonaAnonymousAction(prompt).catch((error) => {
          addToast({
            title: "Failed to generate persona",
            description: "Please try again later",
            color: "danger",
          });

          throw new Error("Failed to generate persona");
        });

    // @ts-ignore
    setPersonaId(savedPersonaIds.personaId ?? null);

    setIsPersonaPanelOpen("1");

    setPersonaVersionId(null);

    if (isSignedIn) {
      mutate("/api/me/balance");
    }

    // For enhancement, start with current persona data and merge changes
    if (personaId && persona?.currentVersion?.data) {
      setData(persona.currentVersion.data);
    }

    console.log("before stream");

    let contentGenerated = false;

    for await (const partialObject of readStreamableValue(object)) {
      console.log("partialObject", partialObject);
      if (partialObject) {
        contentGenerated = true;
        if (personaId && persona?.currentVersion?.data) {
          // Enhancement: merge partial changes with existing data
          setData((currentData) => {
            const baseData = currentData || persona.currentVersion.data;
            return {
              ...baseData,
              ...partialObject?.persona,
            };
          });
        } else {
          // New generation: use the streamed data directly
          setData(partialObject?.persona || {});
        }
      }
    }

    if (!contentGenerated) {
      addToast({
        title: "Failed to generate persona",
        description: "Please try again later",
        color: "danger",
      });
    }

    setPrompt("");
    setIsGenerating(false);

    if (isSignedIn) {
      mutate(
        // @ts-ignore
        `/api/personas/${savedPersonaIds.personaId}/events`
      );
    }
  };

  const handleImageGenerate = async () => {
    if (isGenerating) {
      return;
    }

    if (!personaId) {
      return;
    }

    if (!isSignedIn) {
      return;
    }

    setIsGenerating(true);

    const { publicAccessToken, taskId, event } = await generatePersonaImage(
      personaId
    );

    mutate(
      `/api/personas/${personaId}/events`,
      [...(personaEvents || []), event],
      {
        revalidate: false,
      }
    );

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 100);

    setIsGenerating(false);
  };

  return (
    <>
      <main className="w-full min-h-full">
        <PanelGroup
          autoSaveId="conditional"
          direction="horizontal"
          className="min-h-screen-minus-nav"
        >
          <Panel
            id="chat"
            minSize={25}
            className={`p-6 ${personaId ? "pb-36" : ""}`}
          >
            <div
              className={`w-full mx-auto max-w-3xl flex ${
                personaId
                  ? "flex-col items-center justify-start min-h-screen-minus-nav"
                  : "flex-col items-center justify-center min-h-screen-minus-nav"
              }`}
            >
              {personaId && (
                <>
                  <div className="space-y-6 mb-8 w-full flex-1">
                    {personaEvents?.map((personaEvent) => (
                      <div
                        className="space-y-8 flex flex-col items-end"
                        key={personaEvent.id}
                      >
                        <Card className="max-w-2xl w-fit bg-primary text-primary-foreground p-4 text-right text-balance">
                          {personaEvent.userMessage}
                        </Card>

                        <div className="max-w-2xl w-fit self-start space-y-6">
                          {/* Version Selector Card */}
                          {personaEvent.version &&
                            personaEvent.imageGenerations.length === 0 && (
                              <>
                                <Link
                                  prefetch={false}
                                  href={`/?persona_id=${personaEvent.personaId}&persona_version_id=${personaEvent.versionId}&panel=1`}
                                >
                                  <Card shadow="sm" className="px-4 py-3">
                                    <div className="flex items-center justify-between w-full gap-4">
                                      <div className="flex items-center gap-3 flex-1">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                                          <span className="text-white font-semibold text-xs">
                                            V
                                            {
                                              personaEvent?.version
                                                ?.versionNumber
                                            }
                                          </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-semibold text-default-800 leading-tight">
                                            Version{" "}
                                            {
                                              personaEvent?.version
                                                ?.versionNumber
                                            }
                                            {personaEvent?.version?.title &&
                                              ` • ${personaEvent.version.title}`}
                                          </p>
                                          <p className="text-xs text-left text-default-700 mt-0.5">
                                            Click to view details
                                          </p>
                                        </div>
                                      </div>
                                      <div className="w-4 h-4 text-default-400 flex-shrink-0">
                                        <CaretRightIcon />
                                      </div>
                                    </div>
                                  </Card>
                                </Link>
                                {/* AI Message */}
                                <Card
                                  className="py-4 mt-1 bg-transparent"
                                  shadow="none"
                                >
                                  <p className="text-sm text-default-800 leading-relaxed">
                                    {personaEvent.aiNote}
                                  </p>
                                </Card>
                              </>
                            )}

                          {personaEvent.imageGenerations.length > 0 && (
                            <PersonaImageEvent personaEvent={personaEvent} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!personaId && <PersonaStack />}

              <div
                className={`w-full max-w-3xl px-4 ${
                  personaId ? "fixed z-50 bottom-6" : ""
                }`}
              >
                <Card shadow="sm" className="p-2">
                  <Textarea
                    classNames={{
                      mainWrapper: "hover:bg-transparent hover:bg-none",
                      inputWrapper:
                        "bg-transparent border-none shadow-none hover:bg-none data-[hover=true]:bg-transparent data-[hover=true]:bg-none data-[focus=true]:bg-transparent data-[focus=true]:bg-none",
                    }}
                    isDisabled={isGenerating || generationMode === "image"}
                    value={generationMode === "creator" ? prompt : ""}
                    onValueChange={setPrompt}
                    minRows={1}
                    size="lg"
                    placeholder={
                      generationMode === "creator"
                        ? personaId
                          ? "Enhance your persona"
                          : "Write about your persona"
                        : "Describe the image you want to generate (coming soon)"
                    }
                  />

                  <div className="w-full flex items-center justify-between p-2">
                    <div className="flex items-center gap-4">
                      {/* <Badge
                        content="Soon"
                        size="sm"
                        color="warning"
                        variant="flat"
                      >
                        <Button isDisabled={true} variant="bordered" size="sm">
                          Style
                        </Button>
                      </Badge>
                      <Badge
                        content="Soon"
                        size="sm"
                        color="warning"
                        variant="flat"
                      >
                        <Button isDisabled={true} variant="bordered" size="sm">
                          Quality
                        </Button>
                      </Badge> */}
                    </div>
                    <div className="flex items-center gap-2">
                      {personaId && generationMode === "creator" && (
                        <Tooltip content="Switch to image generation">
                          <Button
                            isIconOnly
                            size="md"
                            variant="solid"
                            onPress={() => setGenerationMode("image")}
                          >
                            <CameraIcon />
                          </Button>
                        </Tooltip>
                      )}

                      {generationMode === "image" && (
                        <Tooltip content="Switch to creator mode">
                          <Button
                            isIconOnly
                            size="md"
                            variant="solid"
                            onPress={() => setGenerationMode("creator")}
                          >
                            <ShootingStarIcon />
                          </Button>
                        </Tooltip>
                      )}

                      <Button
                        isDisabled={
                          generationMode === "creator"
                            ? !prompt || prompt.trim() === ""
                            : !personaId
                        }
                        isIconOnly
                        size="lg"
                        variant="solid"
                        color="secondary"
                        isLoading={isGenerating}
                        onPress={async () => {
                          if (generationMode === "creator") {
                            await handlePersonGenerate();
                          } else {
                            await handleImageGenerate();
                          }
                        }}
                      >
                        {generationMode === "creator" ? (
                          <ShootingStarIcon />
                        ) : (
                          <ImageIcon />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
              <SignedOut>
                <p className="text-default-700 text-sm mt-3">
                  Sign in to keep your personas, enhance them, and generate
                  images.
                </p>
              </SignedOut>
            </div>
          </Panel>
          {personaData && isPersonaPanelOpen && (
            <>
              <PanelResizeHandle></PanelResizeHandle>
              <Panel
                id="persona-version-info"
                minSize={25}
                className="p-6 min-h-0 h-full"
              >
                <div className="h-full sticky top-0">
                  <PersonaPanel
                    isGenerating={isGenerating}
                    personaData={personaData!}
                  />
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </main>
    </>
  );
}
