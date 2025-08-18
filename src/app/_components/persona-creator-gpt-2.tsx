"use client";

import { Card } from "@/components/ui/card";
import { TextareaAutosize } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";
import usePersonaGenerationStore from "@/stores/persona-generation.store";
import { CoinsIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { useSWRConfig } from "swr";
import { generatePersonaAction } from "@/actions/generate-persona.action";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { PERSONA_SUGGESTIONS } from "@/lib/persona-suggestions";
// Removed PersonaStack per requirement
import { useTokensBalanceMutation } from "@/app/_queries/use-tokens-balance.query";
// Removed unused persona events mutation
import { motion } from "motion/react";

const suggestionExamples = PERSONA_SUGGESTIONS;

// Video showcase with autoplay, no controls, seamless transition to last frame, and optional replay triggers
function VideoShowcase() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [lastFrame, setLastFrame] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const replayTimer = useRef<number | null>(null);

  const captureFrame = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.videoWidth || !v.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    try {
      const data = canvas.toDataURL("image/jpeg", 0.9);
      setLastFrame(data);
    } catch (e) {
      // no-op fallback: if toDataURL fails, we'll just keep the video element visible
    }
  }, []);

  const onEnded = useCallback(() => {
    captureFrame();
    setEnded(true);
    // Optional replay after a short delay to keep the motion fresh without being distracting
    if (replayTimer.current) window.clearTimeout(replayTimer.current);
    replayTimer.current = window.setTimeout(() => {
      const v = videoRef.current;
      if (!v) return;
      setEnded(false);
      try {
        v.currentTime = 0;
        void v.play();
      } catch (e) {
        // ignore autoplay errors
      }
    }, 12000);
  }, [captureFrame]);

  const onHoverReplay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (ended || v.paused) {
      setEnded(false);
      try {
        v.currentTime = 0;
        void v.play();
      } catch (e) {
        // ignore autoplay errors
      }
    }
  }, [ended]);

  useEffect(() => {
    return () => {
      if (replayTimer.current) window.clearTimeout(replayTimer.current);
    };
  }, []);

  return (
    <div
      className="relative mx-auto w-[260px] sm:w-[300px] md:w-[340px] lg:w-[380px] xl:w-[420px]"
      onMouseEnter={onHoverReplay}
    >
      {/* Ambient gradient glow background */}
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[40px] bg-[radial-gradient(120%_80%_at_10%_10%,rgba(168,85,247,0.25),rgba(59,130,246,0.18)_35%,rgba(34,197,94,0.14)_70%,transparent_75%)] blur-2xl" />

      <div className="relative aspect-[9/16] overflow-hidden rounded-[28px] border border-white/50 bg-white/40 backdrop-blur-xl shadow-[0_20px_80px_-20px_rgba(109,40,217,0.25)]">
        {/* Frozen last frame for seamless transition after playback */}
        {lastFrame && (
          <img
            src={lastFrame}
            alt="video last frame"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              ended ? "opacity-100" : "opacity-0"
            }`}
            draggable={false}
          />
        )}

        <video
          ref={videoRef}
          src="/yumi-video.mp4"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            ended ? "opacity-0" : "opacity-100"
          }`}
          playsInline
          autoPlay
          muted
          controls={false}
          onEnded={onEnded}
          onLoadedData={() => {
            // Pre-capture an initial frame so we always have a fallback image
            captureFrame();
          }}
        />

        {/* Subtle gradient ring */}
        <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-violet-200/60" />
      </div>

      {/* Floating label chip */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 select-none rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-medium text-zinc-700 shadow-sm backdrop-blur-md">
        Live persona preview
      </div>
    </div>
  );
}

export default function PersonaCreator() {
  const [prompt, setPrompt] = useState("");
  const [_personaId, setPersonaId] = usePersonaId();
  const swrConfig = useSWRConfig();
  const personaGenerationStore = usePersonaGenerationStore();
  const mutateBalance = useTokensBalanceMutation();

  const getRandomSuggestions = () => {
    const shuffled = [...suggestionExamples].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5); // keep concise to fit single viewport
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
    <div className="relative h-screen overflow-hidden bg-white">
      {/* Decorative background layers for subtle depth while keeping light mode */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_20%_10%,rgba(124,58,237,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_50%_at_80%_20%,rgba(14,165,233,0.10),transparent_60%)]" />

      <div className="relative mx-auto flex h-full max-w-7xl items-center px-6 sm:px-8">
        <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Left: Video showcase */}
          <div className="flex items-center justify-center">
            <VideoShowcase />
          </div>

          {/* Right: Glass creator panel */}
          <div className="flex flex-col justify-center">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs text-zinc-600 backdrop-blur">
                <CoinsIcon /> 1 token per generation
              </span>
            </div>

            <h1 className="mb-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Design your perfect persona
            </h1>
            <p className="mb-6 max-w-xl text-sm leading-relaxed text-zinc-600">
              Describe their style, vibe, and energy. We’ll craft a unique
              persona that looks and feels alive.
            </p>

            <Card className="relative flex flex-col gap-4 border border-white/60 bg-white/60 p-4 backdrop-blur-xl sm:p-5">
              <div className="absolute -inset-px rounded-[20px] bg-gradient-to-br from-violet-200/50 via-fuchsia-200/40 to-sky-200/40 opacity-60 [mask-image:linear-gradient(white,transparent_40%)]" />

              <TextareaAutosize
                placeholder="Write about your persona"
                value={prompt}
                minRows={2}
                maxRows={4}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                className="z-10 resize-none border-none bg-transparent p-0 text-[15px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:ring-0"
              />

              <div className="z-10 flex items-end justify-between">
                <div className="text-xs text-zinc-500">
                  Press ⌘/Ctrl + Enter to generate
                </div>
                <Button
                  disabled={!prompt || personaGenerationStore.isGenerating}
                  onClick={() => handleGeneration(prompt)}
                  className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 px-4 py-2 text-white shadow-lg shadow-violet-600/20 transition-transform hover:scale-[1.02] active:scale-[0.99]"
                >
                  <span>Generate</span>
                  <SparkleIcon className="transition-transform group-hover:rotate-12" />
                </Button>
              </div>
            </Card>

            {/* Quick suggestion buttons */}
            <div className="mt-5">
              <p className="mb-3 text-center text-xs text-zinc-500">
                Or try one of these ideas:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                    }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGeneration(suggestion)}
                      disabled={personaGenerationStore.isGenerating}
                      className="border-border/60 bg-white/70 text-[12px] text-zinc-700 transition-colors hover:border-border hover:bg-white/90"
                    >
                      {suggestion}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient bar to anchor the layout visually without adding scroll */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 -z-10 bg-gradient-to-t from-white via-white/50 to-transparent" />
    </div>
  );
}
