"use client";

import { generatePersonaAnonymousAction } from "@/actions/generate-persona-anonymous.action";
import Aurora from "@/components/backgrounds/aurora";
import type { PersonaData } from "@/types/persona-version.type";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import {
  DotsSixVerticalIcon,
  ShootingStarIcon,
} from "@phosphor-icons/react/ssr";
import { readStreamableValue } from "ai/rsc";
import { useQueryState } from "nuqs";
import { useState } from "react";
import {
  getPanelElement,
  getPanelGroupElement,
  getResizeHandleElement,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import PersonaPanel from "./_components/persona-panel";

export default function Home() {
  const [generation, setGeneration] = useState<any>({});
  const [personaData, setPersonaData] = useState<PersonaData | null>(null);

  const [personaId, setPersonaId] = useQueryState("personaId");
  const [personaVersionId, setPersonaVersionId] =
    useQueryState("personaVersionId");

  const [isGenerating, setIsGenerating] = useState(false);

  const [prompt, setPrompt] = useState("");

  return (
    <>
      <main className="w-full h-screen-minus-nav">
        <PanelGroup
          autoSaveId="conditional"
          direction="horizontal"
          className="h-full"
        >
          <Panel id="chat" minSize={25} className="p-6">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full max-w-3xl">
                <Textarea
                  value={prompt}
                  onValueChange={setPrompt}
                  minRows={1}
                  size="lg"
                  placeholder="Write about your persona"
                  endContent={
                    <Button
                      isIconOnly
                      isLoading={isGenerating}
                      onPress={async () => {
                        if (!prompt || prompt.trim() === "") {
                          return;
                        }

                        if (isGenerating) {
                          return;
                        }

                        setIsGenerating(true);

                        const { object } = await generatePersonaAnonymousAction(
                          prompt
                        );

                        setPersonaId("some_id");
                        setPersonaVersionId("some_version_id");

                        // setPersonaData({
                        //   name: "Kenji Tanaka",
                        //   age: "Late 20s",
                        //   universe:
                        //     "Modern-day Japanese high school, typical of slice-of-life or comedy anime genres.",
                        //   species: "Human",
                        //   appearance:
                        //     "Medium height with a lean build. His black hair is perpetually slightly messy, often falling into his eyes, which are framed by slightly thick-rimmed glasses that he constantly pushes up. He typically wears a slightly rumpled suit jacket over a casual button-down shirt, sometimes with a tie that's either loosened or missing entirely. He often carries a stack of papers or a well-worn textbook. His most distinctive feature is his bright, often overly enthusiastic smile.",
                        //   personality:
                        //     "Energetic, passionate, and slightly eccentric. Kenji is incredibly enthusiastic about his subject, often getting lost in dramatic retellings of historical events. He genuinely cares about his students' learning and well-being, though he can be easily flustered by their antics or unexpected questions. He tries to be a cool, relatable teacher but often comes across as endearingly awkward. He's prone to sudden bursts of energy, philosophical tangents, and occasionally forgetting where he put his chalk.",
                        //   background:
                        //     "From a young age, Kenji was a history buff, devouring books on ancient civilizations and historical events. He struggled with social anxiety during his own high school years but found a sense of purpose and confidence when explaining historical concepts to friends. Inspired by a particularly passionate history teacher, he decided to pursue education, hoping to make history come alive for a new generation. Despite his classroom energy, he remains a bit awkward in purely social situations.",
                        //   occupation:
                        //     "High School History Teacher and advisor for the (small) History Club.",
                        // });

                        // setTimeout(() => {
                        //   setIsGenerating(false);
                        // }, 5000);

                        for await (const partialObject of readStreamableValue(
                          object
                        )) {
                          if (partialObject) {
                            setPersonaData(partialObject?.persona || {});
                          }
                        }

                        setIsGenerating(false);
                      }}
                    >
                      <ShootingStarIcon />
                    </Button>
                  }
                />
              </div>
            </div>
          </Panel>
          {personaVersionId && personaData && (
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
      <Aurora
        colorStops={["#BB87E0", "#E2C9F4", "#DE98DD"]}
        blend={0.6}
        amplitude={0.3}
        speed={0.4}
      />
    </>
  );
}
