"use client";

import { useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr";
import { generatePersonaAnonymousAction } from "@/actions/generate-persona-anonymous.action";
import { readStreamableValue } from "@ai-sdk/rsc";
import { PERSONA_SUGGESTIONS } from "@/lib/persona-suggestions";
import { SignInButton } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { Suspense } from "react";

type AnonymousPersona = Partial<{
  note_for_user: string;
  name: string;
  age: string;
  gender: string;
  appearance: string;
  personality: string;
  background: string;
  summary: string;
  occupation?: string;
  extensions?: Record<string, string>;
}>;

function getRandomSuggestions(): string[] {
  const shuffled = [...PERSONA_SUGGESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 7);
}

function mergePersona(existing: AnonymousPersona, incoming?: AnonymousPersona) {
  if (!incoming) return existing;
  const merged: AnonymousPersona = { ...existing, ...incoming };
  if (existing?.extensions || incoming?.extensions) {
    merged.extensions = {
      ...(existing?.extensions ?? {}),
      ...(incoming?.extensions ?? {}),
    };
  }
  return merged;
}

// Dynamically import PublicPersonas (client-only, no SSR)
const PublicPersonas = dynamic(() => import("./public-personas"), {
  ssr: false,
});

export default function AnonymousHome() {
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<AnonymousPersona>({});

  useEffect(() => {
    setSuggestions(getRandomSuggestions());
  }, []);

  const hasAnyPersonaData = useMemo(() => {
    return Object.keys(persona ?? {}).length > 0;
  }, [persona]);

  const handleGenerate = async (text: string) => {
    if (!text || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setPersona({});

    const response = await generatePersonaAnonymousAction(text);
    if (!response?.success || !response.object) {
      setIsGenerating(false);
      setError(
        (response as any)?.error === "RATE_LIMIT_EXCEEDED"
          ? "Rate limit exceeded. Try again later or sign up for higher limits."
          : "Failed to start generation."
      );
      return;
    }

    try {
      for await (const partial of readStreamableValue(response.object)) {
        if (!partial) continue;
        setPersona((prev) => mergePersona(prev, partial as AnonymousPersona));
      }
    } catch (e) {
      setError("Error while streaming persona.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (prompt && !isGenerating) handleGenerate(prompt);
    }
  };

  return (
    <div className="w-full h-full min-h-screen flex flex-col items-center py-12">
      <div className="w-full max-w-3xl space-y-8 px-4">
        {/* Removed announcement banner */}

        <div className="rounded-lg border bg-card text-card-foreground p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Demo mode</p>
              <p className="text-sm text-muted-foreground">
                This is a demo experience. To use better models, save personas,
                enhance them, and generate images, please sign in.
              </p>
            </div>
            <Button asChild>
              <SignInButton>Sign in</SignInButton>
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <Textarea
            id="persona-prompt"
            placeholder="Write about your persona"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {isGenerating ? "Generating..." : ""}
            </div>
            <Button
              size="icon"
              disabled={!prompt || isGenerating}
              onClick={() => handleGenerate(prompt)}
            >
              <PaperPlaneTiltIcon />
            </Button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-muted-foreground mb-3 text-center">
            Or try one of these ideas:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((s, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => handleGenerate(s)}
                disabled={isGenerating}
                className="text-xs"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-center text-sm text-red-500">{error}</div>
        )}

        {hasAnyPersonaData && (
          <div className="space-y-6">
            {persona.note_for_user && (
              <div className="text-sm text-muted-foreground">
                {persona.note_for_user}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {persona.name && <Field label="Name" value={persona.name} />}
              {persona.age && <Field label="Age" value={persona.age} />}
              {persona.gender && (
                <Field label="Gender" value={persona.gender} />
              )}
              {persona.occupation && (
                <Field label="Occupation" value={persona.occupation} />
              )}
            </div>

            {persona.summary && (
              <Field label="Summary" value={persona.summary} multiline />
            )}
            {persona.appearance && (
              <Field label="Appearance" value={persona.appearance} multiline />
            )}
            {persona.personality && (
              <Field
                label="Personality"
                value={persona.personality}
                multiline
              />
            )}
            {persona.background && (
              <Field label="Background" value={persona.background} multiline />
            )}

            {persona.extensions &&
              Object.keys(persona.extensions).length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Extensions</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(persona.extensions).map(([k, v]) => (
                      <div key={k} className="p-2 text-sm">
                        <div className="text-muted-foreground">{k}</div>
                        <div className="whitespace-pre-wrap">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Public personas section at the bottom */}
      <div className="w-full max-w-6xl mx-auto mt-12">
        <Suspense
          fallback={
            <div className="w-full p-6 text-center text-sm text-muted-foreground">
              Loading personas...
            </div>
          }
        >
          <PublicPersonas />
        </Suspense>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{label}</div>
      <div className={multiline ? "whitespace-pre-wrap" : ""}>{value}</div>
    </div>
  );
}
