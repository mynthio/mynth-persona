"use client";

import { TextareaAutosize } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import usePersonaGenerationStore from "@/stores/persona-generation.store";
import { CoinsIcon, SparkleIcon, PlayIcon } from "@phosphor-icons/react/dist/ssr";
import { useSWRConfig } from "swr";
import { generatePersonaAction } from "@/actions/generate-persona.action";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { PERSONA_SUGGESTIONS } from "@/lib/persona-suggestions";
import { useTokensBalanceMutation } from "@/app/_queries/use-tokens-balance.query";

const suggestionExamples = PERSONA_SUGGESTIONS;

export default function PersonaCreator() {
  const [prompt, setPrompt] = useState("");
  const [_personaId, setPersonaId] = usePersonaId();
  const swrConfig = useSWRConfig();
  const personaGenerationStore = usePersonaGenerationStore();
  const mutateBalance = useTokensBalanceMutation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showReplayButton, setShowReplayButton] = useState(false);

  const getRandomSuggestions = () => {
    const shuffled = [...suggestionExamples].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  };

  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Set random suggestions only on client side to avoid hydration issues
  useEffect(() => {
    setSuggestions(getRandomSuggestions());
  }, []);

  // Video replay functionality
  const handleVideoEnd = () => {
    setVideoEnded(true);
    // Show replay button after 3 seconds
    setTimeout(() => {
      setShowReplayButton(true);
    }, 3000);
  };

  const replayVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setVideoEnded(false);
      setShowReplayButton(false);
    }
  };

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
    <div className="relative min-h-screen h-screen overflow-hidden bg-white">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50" />
      
      {/* Video Background */}
      <div className="absolute right-0 top-0 h-full w-2/5 overflow-hidden">
        <div className="relative h-full">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="h-full w-full object-cover"
            onEnded={handleVideoEnd}
            style={{ transform: 'scale(1.1)' }} // Slight zoom for better crop
          >
            <source src="/yumi-video.mp4" type="video/mp4" />
          </video>
          
          {/* Video Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-white/90" />
          
          {/* Replay Button */}
          {showReplayButton && (
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer group"
              onClick={replayVideo}
              onMouseEnter={replayVideo}
            >
              <div className="bg-white/20 backdrop-blur-md rounded-full p-6 group-hover:bg-white/30 transition-all duration-300">
                <PlayIcon className="w-8 h-8 text-white" weight="fill" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="w-3/5 px-12 py-20">
          <div className="max-w-2xl space-y-12">
            
            {/* Hero Section */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-6xl font-light text-slate-900 leading-tight">
                  Create Your
                  <span className="block bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent font-medium">
                    Perfect Persona
                  </span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Bring your imagination to life with AI-powered persona generation
                </p>
              </div>
            </div>

            {/* Input Section */}
            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-2xl">
                  <TextareaAutosize
                    placeholder="Describe your ideal persona..."
                    value={prompt}
                    minRows={3}
                    maxRows={5}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full border-none bg-transparent resize-none focus:outline-none text-lg placeholder-slate-500 text-slate-800"
                  />
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/50">
                    <div className="flex items-center gap-2 text-slate-500">
                      <CoinsIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">1 token</span>
                    </div>
                    
                    <Button
                      disabled={!prompt || personaGenerationStore.isGenerating}
                      onClick={() => handleGeneration(prompt)}
                      className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        {personaGenerationStore.isGenerating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            Generate
                            <SparkleIcon className="w-5 h-5" weight="fill" />
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-4">
                <p className="text-sm text-slate-600 font-medium">
                  ✨ Quick inspiration:
                </p>
                <div className="flex flex-wrap gap-3">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleGeneration(suggestion)}
                      disabled={personaGenerationStore.isGenerating}
                      className="px-4 py-2 bg-white/60 backdrop-blur-sm hover:bg-white/80 border border-violet-200 hover:border-violet-300 text-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-sm"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-violet-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-700 font-medium">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-blue-200">
                <SparkleIcon className="w-4 h-4 text-blue-600" weight="fill" />
                <span className="text-sm text-slate-700 font-medium">Instant Results</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-20 h-20 bg-gradient-to-br from-violet-400 to-purple-600 rounded-full opacity-20 blur-xl animate-pulse"></div>
      <div className="absolute bottom-32 left-32 w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full opacity-15 blur-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full opacity-10 blur-md animate-pulse" style={{ animationDelay: '2s' }}></div>
    </div>
  );
}
