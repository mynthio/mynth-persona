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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight01Icon,
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
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
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

  const triggerNode =
    trigger ?? (
      <Button
        variant="outline"
        size="sm"
        className="h-9 w-full justify-between rounded-xl border border-border/40 bg-card/30 px-3 text-[12px] font-medium hover:bg-card/60"
      >
        <span className="flex min-w-0 items-center gap-2">
          <HugeiconsIcon icon={VolumeHighIcon} className="size-3.5 shrink-0" />
          <span className="truncate">
            {currentVoice ? "Change voice" : "Choose voice"}
          </span>
        </span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="size-3.5 shrink-0 text-muted-foreground"
        />
      </Button>
    );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{triggerNode}</DrawerTrigger>
        <DrawerContent className="max-h-[85vh] border-border/50 dark:bg-[#0c0c0f]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Choose voice</DrawerTitle>
            <DrawerDescription>
              Preview and select a voice without opening the keyboard.
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 px-3 pb-3">
            <div className="max-h-[calc(85vh-7rem)] overflow-y-auto overscroll-contain pr-1">
              <div className="flex flex-col gap-4">
                {grouped.map((group) => (
                  <div key={group.label} className="flex flex-col gap-2">
                    <p className="px-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {group.label}
                    </p>

                    <div className="flex flex-col gap-2">
                      {group.voices.map((voice) => {
                        const isSelected = currentVoiceId === voice.id;
                        const isPlaying = playingId === voice.id;

                        return (
                          <div
                            key={voice.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelect(voice.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleSelect(voice.id);
                              }
                            }}
                            className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-border/50 bg-card/40 px-3 py-3 text-left transition-colors hover:bg-accent/60 focus:outline-none focus:ring-2 focus:ring-ring/50"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium">
                                  {voice.displayName}
                                </span>
                                {isSelected && (
                                  <HugeiconsIcon
                                    icon={CheckmarkCircle02Icon}
                                    className="size-3.5 shrink-0 text-primary"
                                  />
                                )}
                              </div>

                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {voice.accent} · {voice.age}
                              </p>

                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {voice.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="h-4 px-1.5 py-0 text-[10px]"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <button
                              type="button"
                              className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-accent transition-colors"
                              onClick={(e) => playPreview(voice, e)}
                              aria-label={
                                isPlaying
                                  ? `Stop ${voice.displayName} preview`
                                  : `Play ${voice.displayName} preview`
                              }
                            >
                              <HugeiconsIcon
                                icon={isPlaying ? StopIcon : PlayIcon}
                                className="size-4 text-muted-foreground"
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{triggerNode}</PopoverTrigger>
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
