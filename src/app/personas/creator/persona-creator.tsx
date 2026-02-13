"use client";

import { ShuffleIcon, SparklesIcon, StarsIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
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
import { cn } from "@/lib/utils";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      if (prompt.trim() === "") return;
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
    <section className="relative min-h-[75vh] flex flex-col items-center justify-center overflow-hidden bg-background">
      <div className="relative z-10 w-full max-w-3xl mx-auto px-5 sm:px-6 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground/70 shadow-[0_10px_30px_-18px_rgba(124,58,237,0.55)] mb-6">
            <HugeiconsIcon icon={SparklesIcon} className="size-4 text-primary/90" />
            Persona Creator
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground tracking-tight leading-tight mb-4">
            Bring your{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-violet-500 to-pink-500">
              imagination
            </span>{" "}
            to life.
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Describe your character any way you want — brief or detailed. The AI
            fills in the rest with personality, style, and depth.
          </p>
        </motion.div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full"
        >
          <div className="relative group">
            {/* Animated Glow Gradient */}
            <div
              className={cn(
                "absolute -inset-1 bg-linear-to-r from-primary/40 via-violet-500/40 to-pink-500/40 rounded-[28px] blur-xl transition-all duration-500 opacity-0 group-hover:opacity-30",
                isFocused && "opacity-50 scale-[1.01]",
              )}
            />

            {/* Input Container */}
            <div
              className={cn(
                "relative rounded-3xl border bg-card/50 dark:bg-card/30 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] transition-all duration-300 ring-1 ring-white/5",
                isFocused
                  ? "border-primary/30 dark:border-primary/40"
                  : "border-border/50 dark:border-border/30",
              )}
            >
              {/* Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  onKeyDown={handleKeyDown}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={
                    isFocused
                      ? "Describe your ideal persona..."
                      : `${animatedPlaceholder}${cursorChar}`
                  }
                  rows={3}
                  className={cn(
                    "w-full bg-transparent border-none outline-none resize-none",
                    "px-5 sm:px-6 pt-5 sm:pt-6 pb-3",
                    "text-base sm:text-lg text-foreground",
                    "placeholder:text-muted-foreground/60 placeholder:font-light",
                    "min-h-[120px] field-sizing-content",
                  )}
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between px-4 sm:px-5 pb-4 sm:pb-5 pt-1">
                {/* Left: Model Selector */}
                <div className="flex items-center gap-2">
                  <ModelSelector
                    onModelSelect={setModel}
                    defaultValue={model}
                  />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  <AnimatePresence>
                    {prompt.trim() === "" && (
                      <motion.div
                        key="random"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => {
                                try {
                                  posthog.capture("random_persona_clicked", {
                                    model,
                                  });
                                  posthog.capture(
                                    "persona_generation_requested",
                                    {
                                      mode: "random",
                                      model,
                                    },
                                  );
                                } catch {}
                                onGenerate("Random", { model });
                              }}
                              variant="ghost"
                              size="icon"
                              className="size-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all"
                            >
                              <HugeiconsIcon icon={ShuffleIcon} strokeWidth={1.5} className="size-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Generate a random persona</p>
                          </TooltipContent>
                        </Tooltip>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Generate Button */}
                  <Button
                    onClick={() => triggerGeneration(prompt)}
                    disabled={prompt.trim() === ""}
                    className={cn(
                      "h-10 px-5 rounded-xl gap-2 font-semibold transition-all duration-300",
                      prompt.trim() !== ""
                        ? "bg-primary text-primary-foreground shadow-[0_12px_30px_-10px_rgba(124,58,237,0.6)] hover:shadow-[0_16px_40px_-10px_rgba(124,58,237,0.7)] hover:scale-[1.02]"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    Generate
                    <HugeiconsIcon icon={StarsIcon} strokeWidth={1.8} className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
        >
          <span className="text-xs text-muted-foreground/70">Try:</span>
          {[
            "A wise mentor with secrets",
            "Playful rival",
            "Mysterious stranger",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setPrompt(suggestion);
                textareaRef.current?.focus();
              }}
              className="rounded-full border border-border/40 bg-card/40 hover:bg-card/70 hover:border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              {suggestion}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
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
      <SelectTrigger className="w-auto max-w-[180px] h-9 rounded-xl border-border/40 bg-card/50 hover:bg-card/80 text-muted-foreground hover:text-foreground transition-colors text-sm">
        <HugeiconsIcon icon={StarsIcon} strokeWidth={1.5} className="size-4 mr-1.5 opacity-60" />
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        <SelectGroup>
          {personaGenerationModels.map((model) => (
            <SelectItem key={model.id} value={model.id} className="rounded-lg">
              {model.displayName}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
