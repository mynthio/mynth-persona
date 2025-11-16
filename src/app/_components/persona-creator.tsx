"use client";

import { TextareaAutosize } from "@/components/mynth-ui/base/textarea";
import { useEffect, useRef, useState } from "react";
import {
  CaretUpIcon,
  CheckIcon,
  GhostIcon,
  ShuffleIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select } from "@base-ui-components/react/select";
import { AnimatePresence, motion } from "motion/react";
import posthog from "posthog-js";
import { personaGenerationModels } from "@/config/shared/models/persona-generation-models.config";

export default function PersonaCreator({
  onGenerate,
}: {
  onGenerate: (text: string, options?: { model?: string }) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("auto");

  // Animated placeholder: typewriter effect that cycles through prompts until focus
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const cursorChar = "▌"; // rectangle ASCII char for console-like cursor
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

  useEffect(() => {
    // Stop animation when user focuses or starts typing
    if (isFocused || prompt.length > 0) {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      return;
    }

    const typeStep = () => {
      const prompts = samplePrompts.current;
      const currentFull = prompts[promptIndexRef.current % prompts.length];

      if (!deletingRef.current) {
        // typing
        const next = currentFull.slice(0, charIndexRef.current + 1);
        setAnimatedPlaceholder(next);
        charIndexRef.current += 1;

        if (charIndexRef.current === currentFull.length) {
          // reached end, pause then start deleting
          deletingRef.current = true;
          timeoutRef.current = window.setTimeout(typeStep, 1100);
          return;
        }
        timeoutRef.current = window.setTimeout(typeStep, 74); // typing speed
      } else {
        // deleting
        const nextLen = Math.max(charIndexRef.current - 1, 0);
        const next = currentFull.slice(0, nextLen);
        setAnimatedPlaceholder(next);
        charIndexRef.current = nextLen;

        if (nextLen === 0) {
          // move to next prompt
          deletingRef.current = false;
          promptIndexRef.current =
            (promptIndexRef.current + 1) % prompts.length;
          timeoutRef.current = window.setTimeout(typeStep, 400); // small pause before typing next
          return;
        }
        timeoutRef.current = window.setTimeout(typeStep, 38); // deleting speed
      }
    };

    // initial small delay before starting
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

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden rounded-[18px] min-h-[66vh]">
      <div className="flex flex-col justify-center items-center z-10">
        <h1 className="font-onest text-[2.8rem] leading-loose md:text-[4.8rem] font-[150] text-center text-balance">
          Hi. I’m Persona
        </h1>
        <h3 className="font-onest text-[1.28rem] leading-[1.64rem] font-[100] text-[#64646A]/80 mt-[-24px] text-center text-balance">
          Let’s build your perfect AI companion
        </h3>
      </div>

      <div className="w-full max-w-[720px] px-[16px] lg:px-0 flex flex-col items-center justify-center mt-[52px] z-10">
        <TextareaAutosize
          onKeyDown={handleKeyDown}
          minRows={3}
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
          className="bg-white rounded-[22px] py-[14px] px-[16px] md:py-[16px] md:px-[22px] border-none ring ring-surface-200 font-mono placeholder:text-[0.98rem] text-[0.98rem] placeholder:text-[#9998A0] outline-none focus:shadow-none focus:outline-none focus:ring-surface-200 focus-visible:ring-none focus-visible:outline-none"
        />

        <div className="flex items-center justify-between w-full mt-[24px] md:px-[12px]">
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
                      <button
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
                        type="button"
                        className="font-onest font-bold cursor-pointer flex items-center justify-center gap-[12px] text-[1.05rem] size-[42px] rounded-[16px] transition-all duration-250 hover:bg-surface-100/50 hover:scale-105 active:scale-100"
                      >
                        <ShuffleIcon weight="bold" size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generate a random persona</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          try {
                            posthog.capture("halloween_persona_clicked", {
                              model,
                            });
                            posthog.capture("persona_generation_requested", {
                              mode: "halloween",
                              model,
                            });
                          } catch {}
                          onGenerate("Generate a special halloween character", {
                            model,
                          });
                        }}
                        type="button"
                        className="font-onest font-bold cursor-pointer flex items-center justify-center gap-[12px] text-[1.05rem] size-[42px] rounded-[16px] transition-all duration-250 hover:bg-surface-100/50 hover:scale-105 active:scale-100"
                      >
                        <GhostIcon weight="bold" size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generate a special halloween character</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => {
                try {
                  posthog.capture("persona_generation_requested", {
                    mode: "prompt",
                    model,
                    prompt_length: prompt.trim().length,
                  });
                } catch {}
                onGenerate(prompt, { model });
              }}
              disabled={prompt.trim() === ""}
              type="button"
              className="font-mono font-bold cursor-pointer flex items-center gap-[12px] text-[1.05rem] disabled:text-surface-foreground/30 disabled:cursor-not-allowed h-[48px] px-[22px] rounded-[16px] transition-all duration-250 hover:bg-surface-100/50 hover:scale-105 active:scale-100"
            >
              Generate
              <SparkleIcon weight="bold" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Transform config models to Select component format
const selectModels = personaGenerationModels.map((model) => ({
  value: model.id,
  label: <>{model.displayName}</>,
}));

export function ModelSelector({
  onModelSelect,
  defaultValue,
}: {
  onModelSelect: (model: string) => void;
  defaultValue: string;
}) {
  return (
    <Select.Root
      items={selectModels}
      value={defaultValue}
      modal={true}
      name="model"
      onValueChange={onModelSelect}
    >
      <Select.Trigger className="flex h-10 w-auto max-w-[180px] items-center gap-2 rounded-md bg-transparent text-surface-foreground/80 px-3 text-base select-none hover:bg-surface-100/50 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 data-[popup-open]:bg-surface-100/50 cursor-default transition-all duration-250">
        <Select.Value />
        <Select.Icon className="flex">
          <CaretUpIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          className="outline-none select-none z-10"
          sideOffset={8}
        >
          <Select.ScrollUpArrow className="top-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute before:top-[-100%] before:left-0 before:h-full before:w-full before:content-[''] data-[direction=down]:bottom-0 data-[direction=down]:before:bottom-[-100%]" />
          <Select.Popup className="group max-h-[var(--available-height)] origin-[var(--transform-origin)] overflow-y-auto bg-clip-padding rounded-md bg-surface py-1 text-surface-foreground/80 shadow-lg shadow-gray-200 outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[side=none]:data-[ending-style]:transition-none data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style]:transition-none data-[side=none]:scroll-py-5 dark:shadow-none dark:outline-gray-300">
            {selectModels.map(({ label, value }) => (
              <Select.Item
                key={value}
                value={value}
                className="grid min-w-[var(--anchor-width)] cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-4 pl-2.5 text-sm leading-4 outline-none select-none group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:text-base group-data-[side=none]:leading-4 group-data-[side=none]:scroll-my-1 data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-surface-foreground data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-surface-100 pointer-coarse:py-2.5 pointer-coarse:text-[0.925rem]"
              >
                <Select.ItemIndicator className="col-start-1">
                  <CheckIcon className="size-3" />
                </Select.ItemIndicator>
                <Select.ItemText className="col-start-2">
                  {label}
                </Select.ItemText>
              </Select.Item>
            ))}
          </Select.Popup>
          <Select.ScrollDownArrow className="bottom-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute before:top-[-100%] before:left-0 before:h-full before:w-full before:content-[''] data-[direction=down]:bottom-0 data-[direction=down]:before:bottom-[-100%]" />
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
