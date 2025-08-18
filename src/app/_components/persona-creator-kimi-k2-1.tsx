"use client";

import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle, Send, Zap, Brain } from "lucide-react";
import { useSWRConfig } from "swr";
import { generatePersonaAction } from "@/actions/generate-persona.action";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { PERSONA_SUGGESTIONS } from "@/lib/persona-suggestions";
import { useTokensBalanceMutation } from "@/app/_queries/use-tokens-balance.query";
import usePersonaGenerationStore from "@/stores/persona-generation.store";

const suggestions = PERSONA_SUGGESTIONS;

export default function PersonaCreator() {
  const [prompt, setPrompt] = useState("");
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [_personaId, setPersonaId] = usePersonaId();
  const swrConfig = useSWRConfig();
  const personaGenerationStore = usePersonaGenerationStore();
  const mutateBalance = useTokensBalanceMutation();

  const getRandomSuggestions = () => {
    const shuffled = [...suggestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  };

  const [randomSuggestions, setRandomSuggestions] = useState<string[]>([]);

  useEffect(() => {
    setRandomSuggestions(getRandomSuggestions());
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
      videoRef.current.loop = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
    }
  }, []);

  const handleGeneration = async (text: string) => {
    if (personaGenerationStore.isGenerating || !text.trim()) return;

    personaGenerationStore.setIsGenerating(true);
    
    try {
      const response = await generatePersonaAction(text);
      
      if (response) {
        if (response.balance) {
          mutateBalance(() => response.balance);
        }
        
        swrConfig.mutate(
          `/api/personas/${response.personaId}`,
          () => ({ id: response.personaId }),
          { revalidate: false }
        );

        swrConfig.mutate(
          `/api/personas/${response.personaId}/versions/current`,
          () => ({
            id: "",
            personaId: response.personaId,
            title: "",
            data: {},
          }),
          { revalidate: false }
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
              { revalidate: false }
            );
          },
          onFinish: () => {
            swrConfig.mutate(`/api/personas/${response.personaId}/events`);
            setPersonaId(response.personaId!);
          },
        });
      }
    } catch (error) {
      console.error("Error generating persona:", error);
    } finally {
      personaGenerationStore.setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGeneration(prompt);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    handleGeneration(suggestion);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/20 overflow-hidden">
      <div className="relative min-h-screen flex items-center justify-center p-4">
        {/* Background Video Container */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/20 via-transparent to-blue-100/20" />
          
          <div 
            className="absolute inset-0 flex items-center justify-center"
            onMouseEnter={() => setIsVideoHovered(true)}
            onMouseLeave={() => setIsVideoHovered(false)}
          >
            <motion.div
              animate={{
                scale: isVideoHovered ? 1.05 : 1,
                rotate: isVideoHovered ? 1 : 0,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative w-full max-w-sm md:max-w-md aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20"
            >
              <video
                ref={videoRef}
                src="/yumi-video.mp4"
                className="w-full h-full object-cover"
                muted
                playsInline
                loop
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-transparent" />
              
              {/* Floating particles */}
              <div className="absolute inset-0">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white/30 rounded-full"
                    animate={{
                      y: [-20, 20],
                      x: [0, i % 2 === 0 ? 10 : -10],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 3 + i,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeInOut",
                    }}
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${30 + i * 10}%`,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <Brain className="w-12 h-12 text-purple-600" />
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 bg-clip-text text-transparent mb-4">
              Create Your AI Persona
            </h1>
            
            <p className="text-xl text-gray-600 max-w-md mx-auto leading-relaxed">
              Transform your imagination into reality with AI-powered persona generation
            </p>
          </motion.div>

          {/* Input Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-purple-500/10 border border-purple-100/50 p-6">
              <div className="relative">
                <Textarea
                  placeholder="Describe your dream persona..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full min-h-[120px] p-4 text-lg bg-transparent border-0 resize-none focus:outline-none placeholder:text-gray-400"
                  disabled={personaGenerationStore.isGenerating}
                />
                
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <span className="text-sm text-gray-500">⌘ + Enter</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-purple-100/50">
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  <Zap className="w-4 h-4" />
                  Need inspiration?
                </button>

                <Button
                  onClick={() => handleGeneration(prompt)}
                  disabled={!prompt.trim() || personaGenerationStore.isGenerating}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-8 py-3 font-semibold shadow-lg shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {personaGenerationStore.isGenerating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkle className="w-5 h-5 mr-2" />
                      Generate Persona
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 justify-center">
                    {randomSuggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm text-purple-600 border border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex items-center justify-center gap-8 mt-8 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>AI Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span>1 token per generation</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
