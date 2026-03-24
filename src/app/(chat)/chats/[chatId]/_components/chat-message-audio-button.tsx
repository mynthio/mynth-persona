"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  VolumeHighIcon,
  PlayIcon,
  PauseIcon,
  Loading02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { generateMessageAudio } from "@/actions/generate-message-audio.action";
import { getAudioUrl } from "@/lib/utils";
import { useChatMain } from "../_contexts/chat-main.context";

type ChatMessageAudioButtonProps = {
  messageId: string;
  audioId: string | undefined;
  isGenerating: boolean;
  onAudioGenerated: (audioId: string) => void;
  onGeneratingChange: (generating: boolean) => void;
};

export function ChatMessageAudioButton({
  messageId,
  audioId,
  isGenerating,
  onAudioGenerated,
  onGeneratingChange,
}: ChatMessageAudioButtonProps) {
  const { chatId } = useChatMain();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevAudioIdRef = useRef(audioId);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    }
  }, []);

  // When audioId changes (e.g. regenerated via menu), auto-play the new audio
  useEffect(() => {
    if (audioId === prevAudioIdRef.current) return;
    prevAudioIdRef.current = audioId;

    cleanupAudio();

    if (audioId) {
      const url = getAudioUrl(audioId);
      const audio = new Audio(url);
      audio.addEventListener("ended", handleEnded);
      audioRef.current = audio;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(false);
    }
  }, [audioId, cleanupAudio]);

  useEffect(() => {
    return () => cleanupAudio();
  }, [cleanupAudio]);

  function handleEnded() {
    setIsPlaying(false);
  }

  const handleGenerate = () => {
    onGeneratingChange(true);
    toast.info("Generating speech", {
      description: "This takes about 10 seconds. It will auto-play when ready.",
    });

    generateMessageAudio(messageId, chatId)
      .then((result) => {
        if (!result.success) {
          onGeneratingChange(false);
          const { code, message: errorMessage } = result.error;

          if (code === "RATE_LIMIT_EXCEEDED") {
            toast.error("Rate limit exceeded", {
              description:
                "You've reached your TTS generation limit. Please try again later.",
            });
          } else if (code === "MESSAGE_TOO_LONG") {
            toast.error("Message too long", {
              description: errorMessage,
            });
          } else {
            toast.error("Failed to generate audio", {
              description: errorMessage,
            });
          }
          return;
        }

        onAudioGenerated(result.data.audioId);
      })
      .catch(() => {
        onGeneratingChange(false);
        toast.error("Failed to generate audio", {
          description: "An unexpected error occurred. Please try again.",
        });
      });
  };

  const handlePlayPause = async () => {
    if (!audioId) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // Create audio element if needed
    if (!audioRef.current) {
      const url = getAudioUrl(audioId);
      const audio = new Audio(url);
      audio.addEventListener("ended", handleEnded);
      audioRef.current = audio;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Failed to play audio:", error);
      toast.error("Failed to play audio");
    }
  };

  // Generating — show spinner regardless of audio state
  if (isGenerating) {
    return (
      <Button
        variant="ghost"
        size="icon-xs"
        disabled
        aria-label="Generating audio..."
        title="Generating audio..."
      >
        <HugeiconsIcon
          icon={Loading02Icon}
          size={14}
          className="animate-spin text-muted-foreground"
        />
      </Button>
    );
  }

  // No audio yet — show generate button
  if (!audioId) {
    return (
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleGenerate}
        aria-label="Generate audio"
        title="Generate audio"
      >
        <HugeiconsIcon icon={VolumeHighIcon} size={14} />
      </Button>
    );
  }

  // Has audio — show play/pause button
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={handlePlayPause}
      aria-label={isPlaying ? "Pause audio" : "Play audio"}
      title={isPlaying ? "Pause audio" : "Play audio"}
    >
      <HugeiconsIcon icon={isPlaying ? PauseIcon : PlayIcon} size={14} />
    </Button>
  );
}
