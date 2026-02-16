"use client";

import { useRef, useState, useTransition, useCallback, useEffect } from "react";
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
import type { PersonaUIMessage } from "@/schemas/shared/messages/persona-ui-message.schema";

type ChatMessageAudioButtonProps = {
  message: PersonaUIMessage;
};

export function ChatMessageAudioButton({
  message,
}: ChatMessageAudioButtonProps) {
  const { chatId } = useChatMain();
  const [audioId, setAudioId] = useState<string | undefined>(
    message.metadata?.audioId
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPending, startTransition] = useTransition();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanupAudio();
  }, [cleanupAudio]);

  function handleEnded() {
    setIsPlaying(false);
  }

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const result = await generateMessageAudio(message.id, chatId);

        if (!result.success) {
          const { code, message: errorMessage } = result.error;

          if (code === "RATE_LIMIT_EXCEEDED") {
            toast.error("Rate limit exceeded", {
              description:
                "You've reached your TTS generation limit. Please try again later.",
            });
          } else if (code === "AUDIO_ALREADY_EXISTS") {
            toast.error("Audio already exists", {
              description: "Audio has already been generated for this message.",
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

        const newAudioId = result.data.audioId;
        setAudioId(newAudioId);

        // Auto-play the generated audio
        const url = getAudioUrl(newAudioId);
        cleanupAudio();
        const audio = new Audio(url);
        audio.addEventListener("ended", handleEnded);
        audioRef.current = audio;
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Failed to generate audio:", error);
        toast.error("Failed to generate audio", {
          description: "An unexpected error occurred. Please try again.",
        });
      }
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

  // No audio yet — show generate button
  if (!audioId) {
    return (
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleGenerate}
        disabled={isPending}
        aria-label={isPending ? "Generating audio..." : "Generate audio"}
        title={isPending ? "Generating audio..." : "Generate audio"}
      >
        {isPending ? (
          <HugeiconsIcon
            icon={Loading02Icon}
            size={14}
            className="animate-spin text-muted-foreground"
          />
        ) : (
          <HugeiconsIcon icon={VolumeHighIcon} size={14} />
        )}
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
      <HugeiconsIcon
        icon={isPlaying ? PauseIcon : PlayIcon}
        size={14}
      />
    </Button>
  );
}
