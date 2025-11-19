"use client";

import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import {
  GhostIcon,
  ShuffleIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "motion/react";
import posthog from "posthog-js";
import { personaGenerationModels } from "@/config/shared/models/persona-generation-models.config";
import { Button } from "@/components/ui/button";
import { Shuffle01, Stars02 } from "@untitledui/icons";

export default function PersonaCreator({
  onGenerate,
  initialPrompt,
}: {
  onGenerate: (text: string, options?: { model?: string }) => void;
  initialPrompt?: string;
}) {
  const [prompt, setPrompt] = useState(() => initialPrompt ?? "");
  const [model, setModel] = useState("auto");

  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const cursorChar = "▌";
  const samplePrompts = useRef<string[]>([
    "Kim Impossible, an adult version of Kim Possible",
    "A charming sous-chef AI coach who loves puns",
    "A battle-hardened starship captain with a soft spot for poetry",
    "An ancient forest spirit who speaks in riddles",
    "A cyberpunk detective with a glitchy memory",
  ]);
  const promptIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const deletingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const previousInitialRef = useRef<string | undefined>(initialPrompt);
  useEffect(() => {
    if (initialPrompt === undefined) return;
    if (previousInitialRef.current === initialPrompt) return;
    previousInitialRef.current = initialPrompt;
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    if (isFocused || prompt.length > 0) {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      return;
    }

    const typeStep = () => {
      const prompts = samplePrompts.current;
      const currentFull = prompts[promptIndexRef.current % prompts.length];

      if (!deletingRef.current) {
        const next = currentFull.slice(0, charIndexRef.current + 1);
        setAnimatedPlaceholder(next);
        charIndexRef.current += 1;

        if (charIndexRef.current === currentFull.length) {
          deletingRef.current = true;
          timeoutRef.current = window.setTimeout(typeStep, 1100);
          return;
        }
        timeoutRef.current = window.setTimeout(typeStep, 74);
      } else {
        const nextLen = Math.max(charIndexRef.current - 1, 0);
        const next = currentFull.slice(0, nextLen);
        setAnimatedPlaceholder(next);
        charIndexRef.current = nextLen;

        if (nextLen === 0) {
          deletingRef.current = false;
          promptIndexRef.current =
            (promptIndexRef.current + 1) % prompts.length;
          timeoutRef.current = window.setTimeout(typeStep, 400);
          return;
        }
        timeoutRef.current = window.setTimeout(typeStep, 38);
      }
    };

    timeoutRef.current = window.setTimeout(typeStep, 500);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [isFocused, prompt]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      try {
        posthog.capture("persona_generation_requested", {
          mode: "prompt",
          model,
          prompt_length: prompt.trim().length,
        });
      } catch {}
      onGenerate(prompt, { model });
    }
  };

  const triggerGeneration = (value: string) => {
    try {
      posthog.capture("persona_generation_requested", {
        mode: "prompt",
        model,
        prompt_length: value.trim().length,
      });
    } catch {}
    onGenerate(value, { model });
  };

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden rounded-[18px] min-h-[66vh]">
      <div className="flex flex-col justify-center items-center z-10">
        <h1 className="text-[2.3rem] text-foreground/80 font-bold md:text-6xl text-center text-balance">
          Persona Creator
        </h1>
        <p className="text-foreground/60 text-center text-balance mt-2 text-sm max-w-xl">
          Describe your character any way you want - brief or detailed, the
          choice is yours. Include style, personality, traits, or just the
          essentials. The AI fills in the rest.
        </p>
      </div>

      <div className="w-full max-w-[720px] px-[16px] lg:px-0 flex flex-col items-center justify-center mt-8 z-10">
        <Textarea
          onKeyDown={handleKeyDown}
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            isFocused
              ? ""
              : `${animatedPlaceholder}${
                  animatedPlaceholder ? "" : ""
                }${cursorChar}`
          }
          className="rounded-3xl py-4 px-5 min-h-26 placeholder:text-[0.98rem] text-[0.98rem] resize-none"
        />

        <div className="flex items-center justify-between w-full mt-4 md:px-[12px]">
          <div className="flex items-center gap-[2px]">
            <ModelSelector onModelSelect={setModel} defaultValue={model} />
          </div>

          <div className="flex items-center gap-[2px]">
            <AnimatePresence>
              {prompt.trim() === "" && (
                <motion.div
                  key="random"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="flex items-center gap-[2px]"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => {
                          try {
                            posthog.capture("random_persona_clicked", {
                              model,
                            });
                            posthog.capture("persona_generation_requested", {
                              mode: "random",
                              model,
                            });
                          } catch {}
                          onGenerate("Random", { model });
                        }}
                        variant="ghost"
                        size="icon"
                        className="size-[42px] rounded-[16px]"
                      >
                        <Shuffle01 strokeWidth={1.5} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generate a random persona</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={() => triggerGeneration(prompt)}
              disabled={prompt.trim() === ""}
              variant="ghost"
              size="lg"
              className="gap-[12px] text-[1.05rem] h-[48px] px-[22px] rounded-[16px]"
            >
              Generate
              <Stars02 strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModelSelector({
  onModelSelect,
  defaultValue,
}: {
  onModelSelect: (model: string) => void;
  defaultValue: string;
}) {
  return (
    <Select value={defaultValue} onValueChange={onModelSelect}>
      <SelectTrigger className="w-auto max-w-[180px]">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {personaGenerationModels.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.displayName}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
