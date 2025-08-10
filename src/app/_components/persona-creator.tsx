"use client";

import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import usePersonaGenerationStore from "@/stores/persona-generation.store";
import { CoinsIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr";
import { useSWRConfig } from "swr";
import { generatePersonaAction } from "@/actions/generate-persona.action";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { usePersonaVersionMutation } from "../_queries/use-persona-version.query";
import { PERSONA_SUGGESTIONS } from "@/lib/persona-suggestions";
import PersonaStack from "./persona-stack";

const suggestionExamples = PERSONA_SUGGESTIONS;

export default function PersonaCreator() {
  const [prompt, setPrompt] = useState("");
  const [_personaId, setPersonaId] = usePersonaId();
  const swrConfig = useSWRConfig();
  const personaGenerationStore = usePersonaGenerationStore();

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
    const response = await generatePersonaAction(text);

    if (response) {
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

          <Card className="flex flex-col gap-3 max-w-3xl mx-auto p-3 w-full border border-border">
            <Textarea
              placeholder="Write about your persona"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs flex items-center gap-1">
                  <CoinsIcon />1 token
                </span>
              </div>

              <Button
                disabled={!prompt || personaGenerationStore.isGenerating}
                onClick={() => handleGeneration(prompt)}
                className="px-4"
              >
                <span className="flex items-center gap-2">
                  <span>Generate</span>
                  <PaperPlaneTiltIcon />
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
