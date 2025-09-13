"use client";

import { TextareaAutosize } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import { QuestionMarkIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";

export default function PersonaCreator({
  onGenerate,
}: {
  onGenerate: (text: string) => void;
}) {
  const [prompt, setPrompt] = useState("");

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
      onGenerate(prompt);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden rounded-[18px] min-h-[66vh]">
      <div className="flex flex-col justify-center items-center z-10">
        <h1 className="font-onest text-[4.8rem] leading-[4.6rem] font-[150] text-center text-balance">
          Hi. I’m Persona
        </h1>
        <h3 className="font-onest leading-[1.64rem] font-[100] text-[1.48rem] mt-[8px] text-[#64646A]/80 text-center text-balance">
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
          className="bg-surface-100/50 
          rounded-[22px] py-[14px] px-[16px] md:py-[16px] md:px-[22px] 
          border-none ring ring-surface-200
          font-mono 
          placeholder:text-[0.98rem] text-[0.98rem] 
          placeholder:text-[#9998A0] 
          outline-none focus:shadow-none focus:outline-none focus:ring-surface-200
          focus-visible:ring-none focus-visible:outline-none
          "
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
            disabled={prompt.trim() === ""}
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
