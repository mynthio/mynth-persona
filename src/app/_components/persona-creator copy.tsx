"use client";

import { Card } from "@/components/ui/card";
import { TextareaAutosize } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import usePersonaGenerationStore from "@/stores/persona-generation.store";
import { CoinsIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { useSWRConfig } from "swr";
import { generatePersonaAction } from "@/actions/generate-persona.action";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { PERSONA_SUGGESTIONS } from "@/lib/persona-suggestions";
import PersonaStack from "./persona-stack";
import { useTokensBalanceMutation } from "@/app/_queries/use-tokens-balance.query";
import { usePersonaEventsMutation } from "../_queries/use-persona-events.query";

const suggestionExamples = PERSONA_SUGGESTIONS;

export default function PersonaCreator() {
  const [prompt, setPrompt] = useState("");
  const [_personaId, setPersonaId] = usePersonaId();
  const swrConfig = useSWRConfig();
  const personaGenerationStore = usePersonaGenerationStore();
  const mutateBalance = useTokensBalanceMutation();

  const getRandomSuggestions = () => {
    const shuffled = [...suggestionExamples].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 7);
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
          swrConfig.mutate(`/api/personas/${response.personaId}/events`);
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
    <div className="min-h-screen bg-background h-full flex items-center">
      <div className="container mx-auto px-4 py-16 max-w-4xl w-full">
        <div className="space-y-8">
          <PersonaStack />

          <Card className="flex flex-col gap-3 max-w-3xl mx-auto p-3 w-full border border-zinc-200 rounded-3xl shadow-none">
            <TextareaAutosize
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
    </div>
  );
}
