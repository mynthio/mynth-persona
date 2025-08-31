"use client";

import { useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PaperPlaneTiltIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { generatePersonaAnonymousAction } from "@/actions/generate-persona-anonymous.action";
import { readStreamableValue } from "@ai-sdk/rsc";
import { PERSONA_SUGGESTIONS } from "@/lib/persona-suggestions";
import { SignInButton } from "@clerk/nextjs";

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
    <div className="w-full h-full min-h-screen flex items-start justify-center py-12">
      <div className="w-full max-w-3xl space-y-8 px-4">
        {/* Announcement banner: Chats launch */}
        <div className="relative">
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-primary via-chart-2 to-chart-4 [background-size:200%_200%] animate-[gradient-x_12s_ease-in-out_infinite]">
            <div className="rounded-2xl bg-card/80 supports-[backdrop-filter]:bg-card/70 backdrop-blur border border-border/60 p-3 md:p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary ring-1 ring-primary/20">
                    <SparkleIcon className="size-3.5" /> New
                  </span>
                  <span className="text-sm text-muted-foreground">Chats are live</span>
                </div>
                <div className="text-sm md:flex-1 text-foreground/80">
                  Create a persona and start chatting instantly. We also offer free models to get you going.
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    onClick={() => document.getElementById('persona-prompt')?.focus()}
                  >
                    Try it now
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <SignInButton>Sign in</SignInButton>
                  </Button>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
            </div>
          </div>
        </div>

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
