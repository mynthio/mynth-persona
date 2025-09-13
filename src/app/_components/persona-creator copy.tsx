"use client";

import { Card } from "@/components/ui/card";
import { Textarea, TextareaAutosize } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import usePersonaGenerationStore from "@/stores/persona-generation.store";
import {
  CoinsIcon,
  QuestionMarkIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useSWRConfig } from "swr";
import { generatePersonaAction } from "@/actions/generate-persona.action";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { PERSONA_SUGGESTIONS } from "@/lib/persona-suggestions";
import PersonaStack from "./persona-stack";
import { useTokensBalanceMutation } from "@/app/_queries/use-tokens-balance.query";
import FloatingOrbs from "@/components/backgrounds/floating-orbs";
import DarkVeil from "@/components/backgrounds/dark-veil";

const suggestionExamples = PERSONA_SUGGESTIONS;

export default function PersonaCreator({
  onGenerate,
}: {
  onGenerate: (text: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [_personaId, setPersonaId] = usePersonaId();
  const swrConfig = useSWRConfig();
  const personaGenerationStore = usePersonaGenerationStore();
  const mutateBalance = useTokensBalanceMutation();

  const getRandomSuggestions = () => {
    const shuffled = [...suggestionExamples].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Set random suggestions only on client side to avoid hydration issues
  useEffect(() => {
    setSuggestions(getRandomSuggestions());
  }, []);

  const handleGeneration = async (text: string) => {
    if (personaGenerationStore.isGenerating) {
      return;
    }
    personaGenerationStore.setIsGenerating(true);
    const response = await generatePersonaAction(text).catch((e) => {
      personaGenerationStore.setIsGenerating(false);
      throw e;
    });

    if (response) {
      if (response.balance) {
        mutateBalance(() => response.balance);
      }
      swrConfig.mutate(
        `/api/personas/${response.personaId}`,
        () => ({
          id: response.personaId,
        }),
        {
          revalidate: false,
        }
      );

      swrConfig.mutate(
        `/api/personas/${response.personaId}/versions/current`,
        () => ({
          id: "",
          personaId: response.personaId,
          title: "",
          data: {},
        }),
        {
          revalidate: false,
        }
      );

      personaGenerationStore.stream(response.object!, {
        onData: (data) => {
          swrConfig.mutate(
            `/api/personas/${response.personaId}/versions/current`,
            () => ({
              id: "",
              personaId: response.personaId,
              title: "",
              data: data,
            }),
            {
              revalidate: false,
            }
          );
        },
        onFinish: () => {
          swrConfig.mutate(`/api/personas/${response.personaId}/versions`);
        },
      });

      setPersonaId(response.personaId!);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (prompt && !personaGenerationStore.isGenerating) {
        handleGeneration(prompt);
      }
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden rounded-[18px] min-h-[66vh]">
      <FloatingOrbs className="absolute left-0 top-0 right-0 z-0" />
      <div className="flex flex-col justify-center items-center z-10">
        <h1 className="font-onest text-[4.8rem] leading-[4.6rem] font-[150] text-center text-balance">
          Hi. I’m Persona
        </h1>
        <h3 className="font-onest leading-[1.64rem] font-[100] text-[1.48rem] mt-[8px] text-[#64646A]/80 text-center text-balance">
          Let me help you with your new perfect companion
        </h3>
      </div>

      <div className="w-full max-w-[720px] px-[16px] lg:px-0 flex flex-col items-center justify-center mt-[52px] z-10">
        <TextareaAutosize
          minRows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Kim Impossible, an adult version of Kim Possible"
          className="bg-surface-100/15 rounded-[22px] py-[14px] px-[16px] md:py-[16px] md:px-[22px] ring-0 ring-none focus:ring-none active:ring-none  border-[2px] border-surface-100/30 font-mono placeholder:text-[1.050rem] text-[0.98rem] placeholder:text-[#9998A0]  outline-none focus:shadow-none focus:outline-none focus:border-[#E5E4E8]/80 focus-visible:ring-none focus-visible:outline-none focus-visible:border-[#E5E4E8]/80 active:border-[#E5E4E8]/80"
        />

        <div className="flex items-center justify-between w-full mt-[24px] md:px-[12px]">
          <button
            type="button"
            className="text-foreground/50 font-onest text-[0.96rem] flex items-center gap-[12px] h-[52px] px-[24px]"
          >
            How to
            <QuestionMarkIcon size={16} />
          </button>

          <button
            onClick={() => onGenerate(prompt)}
            type="button"
            className="
              font-onest font-bold cursor-pointer
              flex items-center gap-[12px] 
              text-[1.05rem]
              h-[48px] px-[22px] rounded-[16px]
              transition-all duration-250
              hover:bg-surface-100/50 hover:scale-105 active:scale-100
              "
          >
            Generate
            <SparkleIcon weight="bold" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* <div className="container mx-auto px-4 py-6 max-w-4xl w-full">
        <div className="space-y-8 mt-16">
          

          <Card className="flex flex-col gap-3 max-w-3xl mx-auto p-3 w-full border border-zinc-200 rounded-3xl shadow-none">
            <TextareaAutosize
              id="persona-prompt"
              placeholder="Write about your persona"
              value={prompt}
              minRows={2}
              maxRows={4}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-none shadow-none background-none"
            />

            <div className="flex items-end justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs flex items-center gap-1 md:px-2">
                  <CoinsIcon />1 token
                </span>
              </div>

              <Button
                disabled={!prompt || personaGenerationStore.isGenerating}
                onClick={() => handleGeneration(prompt)}
                className="px-4 bg-zinc-100 text-zinc-800 rounded-lg"
              >
                <span className="flex items-center gap-2">
                  <span>Generate</span>
                  <SparkleIcon />
                </span>
              </Button>
            </div>
          </Card>

          
          <div className="max-w-5xl px-2 mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleGeneration(suggestion)}
                  disabled={personaGenerationStore.isGenerating}
                  className="text-xs bg-background/50 hover:bg-background border-border/50 hover:border-border transition-colors"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div> 
*/
