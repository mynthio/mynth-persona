"use client";

import { generatePersonaAnonymousAction } from "@/actions/generate-persona-anonymous.action";
import Aurora from "@/components/backgrounds/aurora";
import type { PersonaData } from "@/types/persona-version.type";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import {
  CaretRightIcon,
  DotsSixVerticalIcon,
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
import { useAuth } from "@clerk/nextjs";
import { generatePersonaAction } from "@/actions/generate-persona.action";
import useSWR, { useSWRConfig } from "swr";
import {
  PersonaEvent,
  PersonaEventWithVersion,
} from "@/types/persona-event.type";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import Link from "next/link";
import { enhancePersonaAction } from "@/actions/enhance-persona.action";

export default function Home() {
  const { isSignedIn } = useAuth();
  const { mutate } = useSWRConfig();
  const [generation, setGeneration] = useState<any>({});
  const [personaData, setPersonaData] = useState<PersonaData | null>(null);

  const [personaId, setPersonaId] = useQueryState("persona_id");
  const [personaVersionId, setPersonaVersionId] =
    useQueryState("persona_version_id");

  const [isPersonaPanelOpen, setIsPersonaPanelOpen] = useQueryState("panel");
  const [isGenerating, setIsGenerating] = useState(false);

  const [prompt, setPrompt] = useState("");

  const { data: persona } = useSWR(
    personaId && isSignedIn ? `/api/personas/${personaId}` : null,
    {
      onSuccess: (data) => {
        setPersonaData(data.currentVersion?.personaData || null);
        setIsPersonaPanelOpen("1");
      },
    }
  );

  console.log("I'm re-rendering");

  const { data: personaEvents } = useSWR<PersonaEventWithVersion[]>(
    personaId && isSignedIn ? `/api/personas/${personaId}/events` : null
  );

  return (
    <>
      <main className="w-full h-screen-minus-nav">
        <PanelGroup
          autoSaveId="conditional"
          direction="horizontal"
          className="h-full"
        >
          <Panel id="chat" minSize={25} className="p-6">
            <div
              className={`w-full mx-auto overflow-auto max-w-3xl h-full flex items-center ${
                personaId
                  ? "flex-col items-center justify-between"
                  : "flex-col items-center justify-center"
              }`}
            >
              {personaId && (
                <>
                  <div className="space-y-6 mb-8 w-full">
                    {personaEvents?.map((personaEvent) => (
                      <div
                        className="space-y-8 flex flex-col items-end"
                        key={personaEvent.id}
                      >
                        <Card className="max-w-2xl w-fit bg-violet-600 text-white p-4 text-right text-balance">
                          {personaEvent.userMessage}
                        </Card>

                        <div className="max-w-2xl w-fit self-start space-y-6">
                          {/* Version Selector Card */}
                          <Link
                            prefetch={false}
                            href={`/?persona_id=${personaEvent.personaId}&persona_version_id=${personaEvent.versionId}&panel=1`}
                          >
                            <Card
                              shadow="sm"
                              className="px-4 py-3 bg-background"
                            >
                              <div className="flex items-center justify-between w-full gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                                    <span className="text-white font-semibold text-xs">
                                      V{personaEvent?.version?.versionNumber}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-default-800 leading-tight">
                                      Version{" "}
                                      {personaEvent?.version?.versionNumber}
                                      {personaEvent?.version?.title &&
                                        ` • ${personaEvent.version.title}`}
                                    </p>
                                    <p className="text-xs text-left text-default-500 mt-0.5">
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
                            <p className="text-sm text-default-600 leading-relaxed">
                              {personaEvent.aiNote}
                            </p>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!personaId && <PersonaStack />}

              <div className="w-full max-w-3xl px-4">
                <Card shadow="sm" className="p-2">
                  <Textarea
                    classNames={{
                      mainWrapper: "hover:bg-transparent hover:bg-none",
                      inputWrapper:
                        "bg-transparent border-none shadow-none hover:bg-none data-[hover=true]:bg-transparent data-[hover=true]:bg-none data-[focus=true]:bg-transparent data-[focus=true]:bg-none",
                    }}
                    value={prompt}
                    onValueChange={setPrompt}
                    minRows={1}
                    size="lg"
                    placeholder={
                      personaId
                        ? "Enhance your persona"
                        : "Write about your persona"
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
                    <div>
                      <Button
                        isDisabled={!prompt || prompt.trim() === ""}
                        isIconOnly
                        size="lg"
                        variant="solid"
                        color="secondary"
                        isLoading={isGenerating}
                        onPress={async () => {
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
                            : await generatePersonaAnonymousAction(prompt);

                          // @ts-ignore
                          setPersonaId(savedPersonaIds.personaId);

                          setPersonaVersionId(null);

                          mutate("/api/me/balance");

                          // For enhancement, start with current persona data and merge changes
                          if (
                            personaId &&
                            persona?.currentVersion?.personaData
                          ) {
                            setPersonaData(persona.currentVersion.personaData);
                          }

                          for await (const partialObject of readStreamableValue(
                            object
                          )) {
                            if (partialObject) {
                              if (
                                personaId &&
                                persona?.currentVersion?.personaData
                              ) {
                                // Enhancement: merge partial changes with existing data
                                setPersonaData((currentData) => {
                                  const baseData =
                                    currentData ||
                                    persona.currentVersion.personaData;
                                  return {
                                    ...baseData,
                                    ...partialObject?.persona,
                                  };
                                });
                              } else {
                                // New generation: use the streamed data directly
                                setPersonaData(partialObject?.persona || {});
                              }
                            }
                          }

                          setIsGenerating(false);
                          mutate(
                            // @ts-ignore
                            `/api/personas/${savedPersonaIds.personaId}/events`
                          );
                        }}
                      >
                        <ShootingStarIcon />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Panel>
          {personaData && isPersonaPanelOpen && (
            <>
              <PanelResizeHandle className="flex items-center justify-center cursor-grab active:cursor-grabbing group">
                <div className="w-2 h-32 rounded-xl bg-default-200 group-hover:bg-default-300 group-hover:scale-105 transition-all duration-300" />
              </PanelResizeHandle>
              <Panel
                id="persona-version-info"
                minSize={25}
                className="p-6 min-h-0"
              >
                <PersonaPanel
                  isGenerating={isGenerating}
                  personaData={personaData!}
                />
              </Panel>
            </>
          )}
        </PanelGroup>
      </main>
    </>
  );
}
