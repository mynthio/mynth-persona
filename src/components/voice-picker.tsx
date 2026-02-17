"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckmarkCircle02Icon,
  PlayIcon,
  StopIcon,
  VolumeHighIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  voices,
  getVoiceById,
  type VoiceConfig,
  type VoiceGender,
} from "@/config/shared/voices.config";

interface VoicePickerProps {
  currentVoiceId: string | null;
  onVoiceChange: (voiceId: string) => void;
  trigger?: React.ReactNode;
}

const genderGroups: { gender: VoiceGender; label: string }[] = [
  { gender: "female", label: "Female" },
  { gender: "male", label: "Male" },
  { gender: "neutral", label: "Neutral" },
];

export function VoicePicker({
  currentVoiceId,
  onVoiceChange,
  trigger,
}: VoicePickerProps) {
  const [open, setOpen] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentVoice = currentVoiceId
    ? getVoiceById(currentVoiceId)
    : undefined;

  const grouped = useMemo(() => {
    return genderGroups
      .map(({ gender, label }) => ({
        label,
        voices: voices.filter((v) => v.gender === gender),
      }))
      .filter((g) => g.voices.length > 0);
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const playPreview = useCallback(
    (voice: VoiceConfig, e: React.MouseEvent) => {
      e.stopPropagation();

      if (playingId === voice.id) {
        stopAudio();
        return;
      }

      stopAudio();

      const audio = new Audio(voice.previewUrl);
      audioRef.current = audio;
      setPlayingId(voice.id);

      audio.addEventListener("ended", () => {
        setPlayingId(null);
        audioRef.current = null;
      });

      audio.addEventListener("error", () => {
        setPlayingId(null);
        audioRef.current = null;
      });

      audio.play();
    },
    [playingId, stopAudio]
  );

  const handleSelect = useCallback(
    (voiceId: string) => {
      stopAudio();
      onVoiceChange(voiceId);
      setOpen(false);
    },
    [onVoiceChange, stopAudio]
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) stopAudio();
      setOpen(isOpen);
    },
    [stopAudio]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-[12px] rounded-full border-border/40 bg-card/30 hover:bg-card/60 gap-1.5"
          >
            <HugeiconsIcon icon={VolumeHighIcon} className="size-3.5" />
            {currentVoice?.displayName ?? "Select voice"}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-[360px] p-0 rounded-xl border-border/50 dark:bg-[#0c0c0f]"
        align="start"
        sideOffset={8}
      >
        <Command
          filter={(value, search) => {
            const voice = voices.find((v) => v.id === value);
            if (!voice) return 0;
            const searchLower = search.toLowerCase();
            if (voice.displayName.toLowerCase().includes(searchLower)) return 1;
            if (voice.accent.toLowerCase().includes(searchLower)) return 1;
            if (voice.tags.some((t) => t.toLowerCase().includes(searchLower)))
              return 1;
            if (voice.gender.toLowerCase().includes(searchLower)) return 1;
            return 0;
          }}
        >
          <CommandInput placeholder="Search voices..." />
          <CommandList className="max-h-[420px]">
            <CommandEmpty>No voices found.</CommandEmpty>
            {grouped.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.voices.map((voice) => (
                  <CommandItem
                    key={voice.id}
                    value={voice.id}
                    onSelect={handleSelect}
                    className="flex items-start gap-3 px-3 py-2.5 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {voice.displayName}
                        </span>
                        {currentVoiceId === voice.id && (
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            className="size-3.5 text-primary"
                          />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {voice.accent} · {voice.age}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {voice.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 mt-0.5 size-7 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                      onClick={(e) => playPreview(voice, e)}
                      aria-label={
                        playingId === voice.id
                          ? `Stop ${voice.displayName} preview`
                          : `Play ${voice.displayName} preview`
                      }
                    >
                      <HugeiconsIcon
                        icon={playingId === voice.id ? StopIcon : PlayIcon}
                        className="size-3.5 text-muted-foreground"
                      />
                    </button>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
