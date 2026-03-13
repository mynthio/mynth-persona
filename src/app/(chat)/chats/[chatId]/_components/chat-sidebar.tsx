"use client";

import { ArrowReloadVerticalIcon, ArrowUpRight01Icon, Cancel01Icon, Image02Icon, InformationCircleIcon, PencilEdit02Icon, PinIcon, ScrollVerticalIcon, SparklesIcon, User03Icon, VolumeHighIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { cn, getImageUrl } from "@/lib/utils";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { useChatMain } from "../_contexts/chat-main.context";
import { useChatBranchesContext } from "../_contexts/chat-branches.context";
import { useSwitchBranch } from "../_hooks/use-switch-branch.hook";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CompactSpinner } from "@/components/ui/loading-spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSettingsNavigation } from "../_hooks/use-settings-navigation.hook";
import { generateChatSceneImage } from "@/actions/generate-chat-scene-image";
import {
  IMAGE_MODELS,
  type ImageModelId,
  isModelBeta,
  isModelNew,
} from "@/config/shared/image-models";
import { useChatImageGenerationStore } from "@/stores/chat-image-generation.store";
import { ChatSettingsSceneImageInProgress } from "./chat-settings-scene-image-in-progress";
import { updateChatAction } from "@/actions/update-chat.action";
import { toast } from "sonner";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/components/ui/link";
import { getVoiceById } from "@/config/shared/voices.config";

// Lazy load VoicePicker for client-side only rendering
const VoicePicker = dynamic(
  () => import("@/components/voice-picker").then((mod) => ({ default: mod.VoicePicker })),
  { ssr: false }
);

const SIDEBAR_WIDTH = "18rem";

// ---------------------------------------------------------------------------
// Section label
// ---------------------------------------------------------------------------
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground/70">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Persona Header – avatar, name, quick actions
// ---------------------------------------------------------------------------
function PersonaHeader() {
  const { personas } = useChatPersonas();
  const { settings } = useChatMain();

  const persona = personas[0];
  const imageId = settings.sceneImageMediaId ?? persona.profileImageIdMedia;
  const personaPageHref =
    persona.slug && persona.visibility === "public"
      ? `/personas/${persona.slug}`
      : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Avatar */}
      {imageId && (
        <div className="overflow-hidden rounded-xl border border-border/40">
          <img
            src={getImageUrl(imageId)}
            alt={persona.name}
            className="aspect-3/4 w-full object-cover object-top"
          />
        </div>
      )}

      {/* Name + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold leading-tight text-foreground">
            {persona.name}
          </h3>
        </div>
      </div>

      {/* Quick Action Buttons – extensible row */}
      <div className="flex flex-wrap gap-1.5">
        {personaPageHref && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="xs"
                className="gap-1.5 text-muted-foreground"
                asChild
              >
                <Link href={personaPageHref} target="_blank">
                  <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3" />
                  <span>Persona page</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              View public persona page
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Your Character Section
// ---------------------------------------------------------------------------
function CharacterSection() {
  const { settings } = useChatMain();
  const { navigateSettings } = useSettingsNavigation();

  const hasCharacter = !!settings.user_persona?.name;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <SectionLabel>Your character</SectionLabel>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigateSettings("user")}
        >
          <HugeiconsIcon icon={PencilEdit02Icon} className="size-3" />
        </Button>
      </div>

      {hasCharacter ? (
        <div className="space-y-1 rounded-lg border border-border/40 bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={User03Icon} className="size-3.5 shrink-0 text-muted-foreground" />
            <p className="truncate text-xs font-medium text-foreground">
              {settings.user_persona?.name}
            </p>
          </div>
          {settings.user_persona?.character && (
            <p className="line-clamp-3 pl-5.5 text-xs leading-relaxed text-muted-foreground">
              {settings.user_persona.character}
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => navigateSettings("user")}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border/50 p-3 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
        >
          <HugeiconsIcon icon={User03Icon} className="size-3.5 shrink-0" />
          <span>Set up your character</span>
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scenario Section
// ---------------------------------------------------------------------------
function ScenarioSection() {
  const { settings } = useChatMain();
  const { navigateSettings } = useSettingsNavigation();

  const scenarioText = settings.scenario?.scenario_text;
  const hasScenario = !!scenarioText;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <SectionLabel>Scenario</SectionLabel>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigateSettings("scenario")}
        >
          <HugeiconsIcon icon={PencilEdit02Icon} className="size-3" />
        </Button>
      </div>

      {hasScenario ? (
        <div className="space-y-1 rounded-lg border border-border/40 bg-muted/30 p-3">
          <div className="flex items-start gap-2">
            <HugeiconsIcon icon={ScrollVerticalIcon} className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
              {scenarioText}
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => navigateSettings("scenario")}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border/50 p-3 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
        >
          <HugeiconsIcon icon={ScrollVerticalIcon} className="size-3.5 shrink-0" />
          <span>Add a scenario</span>
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Voice Section
// ---------------------------------------------------------------------------
function VoiceSection() {
  const { chatId, settings, setSettings } = useChatMain();
  const voiceId = settings.characterVoiceId;
  const voice = voiceId ? getVoiceById(voiceId) : undefined;
  const isOverride = !!voiceId;

  async function handleVoiceChange(voiceId: string) {
    try {
      await updateChatAction(chatId, {
        settings: { characterVoiceId: voiceId },
      });
      setSettings({ ...settings, characterVoiceId: voiceId });
      toast.success("Voice updated");
    } catch {
      toast.error("Failed to update voice");
    }
  }

  async function handleClearOverride() {
    try {
      await updateChatAction(chatId, {
        settings: { characterVoiceId: null as any },
      });
      const { characterVoiceId: _, ...rest } = settings;
      setSettings(rest);
      toast.success("Using persona default voice");
    } catch {
      toast.error("Failed to clear voice override");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <SectionLabel>Voice</SectionLabel>
        {isOverride && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleClearOverride}
            title="Use persona default"
          >
            <HugeiconsIcon icon={PencilEdit02Icon} className="size-3" />
          </Button>
        )}
      </div>

      {voice ? (
        <div className="rounded-xl border border-border/40 bg-muted/30 p-3">
          <div className="flex items-start gap-2">
            <HugeiconsIcon icon={VolumeHighIcon} className="size-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {voice.displayName}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Custom voice override for this chat
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto h-4 px-1.5 py-0 text-[10px]">
              Override
            </Badge>
          </div>
          <div className="mt-3">
            <VoicePicker
              currentVoiceId={voiceId ?? null}
              onVoiceChange={handleVoiceChange}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full justify-between rounded-xl border-border/40 bg-background/40 px-3 text-[12px] font-medium hover:bg-background/70"
                >
                  <span className="flex items-center gap-2">
                    <HugeiconsIcon
                      icon={VolumeHighIcon}
                      className="size-3.5 shrink-0"
                    />
                    Change voice
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Browse
                  </span>
                </Button>
              }
            />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <HugeiconsIcon icon={VolumeHighIcon} className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Using persona default</span>
          </div>
          <VoicePicker
            currentVoiceId={voiceId ?? null}
            onVoiceChange={handleVoiceChange}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-full justify-between rounded-xl border-border/40 bg-card/30 px-3 text-[12px] font-medium hover:bg-card/60"
              >
                <span className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={VolumeHighIcon}
                    className="size-3.5 shrink-0"
                  />
                  Choose voice override
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Open
                </span>
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scene Image Section
// ---------------------------------------------------------------------------
function SceneImageSection() {
  const { chatId, settings, setSettings } = useChatMain();
  const { personas } = useChatPersonas();
  const persona = personas[0];

  const [isGenerating, setIsGenerating] = useState(false);

  const addSceneImageGenerationRun = useChatImageGenerationStore(
    (state) => state.addSceneImageGenerationRun
  );
  const sceneImageGenerationRuns = useChatImageGenerationStore(
    (state) => state.sceneImageGenerationRuns
  );

  const activeRun = useMemo(() => {
    const runs = Object.values(sceneImageGenerationRuns).filter(
      (run) => run.chatId === chatId
    );
    return runs.length > 0 ? runs[0] : null;
  }, [sceneImageGenerationRuns, chatId]);

  const handleSceneImageComplete = (mediaId: string) => {
    setSettings({
      ...settings,
      sceneImageMediaId: mediaId,
    });
  };

  const triggerWithModel = async (modelId: ImageModelId) => {
    if (isGenerating || activeRun) return;

    setIsGenerating(true);
    try {
      const result = await generateChatSceneImage(chatId, modelId);

      if (!result.success) {
        const { code, message } = result.error;

        if (code === "CONCURRENT_LIMIT_EXCEEDED") {
          toast.error("Concurrent generation limit reached", {
            description:
              "You've reached the limit of concurrent scene generations. Please wait for the current one to finish.",
          });
        } else if (code === "RATE_LIMIT_EXCEEDED") {
          toast.error("Rate limit exceeded", {
            description:
              "You've hit your image generation limit for now. Try again in a bit.",
          });
        } else {
          toast.error("Couldn't trigger scene image", {
            description: message,
          });
        }
        return;
      }

      addSceneImageGenerationRun(result.data.runId, {
        runId: result.data.runId,
        publicAccessToken: result.data.publicAccessToken,
        chatId,
        startedAt: Date.now(),
      });

      toast("Scene image generation started", {
        description: `Generating with ${IMAGE_MODELS[modelId].displayName}.`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unexpected error";
      toast.error("Couldn't trigger scene image", {
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectModel = async (modelId: ImageModelId) => {
    await triggerWithModel(modelId);
  };

  const handleSetToProfileImage = async () => {
    if (!persona?.profileImageIdMedia) return;

    try {
      await updateChatAction(chatId, {
        settings: {
          sceneImageMediaId: persona.profileImageIdMedia,
        },
      });

      setSettings({
        ...settings,
        sceneImageMediaId: persona.profileImageIdMedia,
      });

      toast("Scene image updated", {
        description: "Now using your persona's profile image.",
      });
    } catch {
      toast.error("Failed to update scene image", {
        description: "Try again or contact support if this keeps happening.",
      });
    }
  };

  const busy = isGenerating || !!activeRun;

  return (
    <div className="space-y-2">
      {activeRun && (
        <ChatSettingsSceneImageInProgress
          runId={activeRun.runId}
          publicAccessToken={activeRun.publicAccessToken}
          chatId={chatId}
          onComplete={handleSceneImageComplete}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SectionLabel>Scene image</SectionLabel>
          <span className="rounded-full bg-rose-500/10 px-1.5 py-px text-[0.6rem] font-semibold leading-tight text-rose-400">
            Beta
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              <HugeiconsIcon icon={InformationCircleIcon} size={12} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={6} className="max-w-[220px]">
            <p>
              Character mode uses this image to keep your character looking
              consistent across generations in this chat.
            </p>
            <p className="mt-1 text-[0.7rem] opacity-80">
              For best results, re-generate a dedicated reference image instead
              of using the profile picture.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="xs"
              variant="outline"
              className="flex-1 gap-1.5 text-muted-foreground"
              disabled={busy}
            >
              {busy ? (
                <>
                  <CompactSpinner className="size-3" />
                  <span>Generating…</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={ArrowReloadVerticalIcon} className="size-3" />
                  <span>Generate</span>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="text-xs">
              Choose an image model
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.values(IMAGE_MODELS).map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => handleSelectModel(model.id)}
                disabled={busy}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium">
                      {model.displayName}
                    </span>
                    {model.cost >= 2 && (
                      <HugeiconsIcon icon={SparklesIcon}
                        className="text-amber-400"
                        size={14}
                      />
                    )}
                    {isModelNew(model.id) && (
                      <Badge
                        variant="outline"
                        className="h-auto border-green-200 bg-green-50 px-1.5 py-0.5 text-[10px] text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                      >
                        New
                      </Badge>
                    )}
                    {isModelBeta(model.id) && (
                      <Badge
                        variant="outline"
                        className="h-auto border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      >
                        Beta
                      </Badge>
                    )}
                  </div>
                  <span className="text-[0.7rem] text-muted-foreground">
                    Cost: {model.cost} spark{model.cost !== 1 ? "s" : ""}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSetToProfileImage}
              disabled={!persona?.profileImageIdMedia || busy}
            >
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Image02Icon} className="size-3.5" />
                <span className="text-xs font-medium">
                  Use persona profile image
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="xs"
              variant="outline"
              className="text-muted-foreground"
              onClick={handleSetToProfileImage}
              disabled={!persona?.profileImageIdMedia || busy}
            >
              <HugeiconsIcon icon={Image02Icon} className="size-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Use persona profile image
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Saved Branches Section
// ---------------------------------------------------------------------------
function SavedBranchesSection() {
  const { pinnedBranches, unpinMessage, branchId, isPinnedLoading } = useChatBranchesContext();
  const switchBranch = useSwitchBranch();

  return (
    <div className="space-y-2">
      <SectionLabel>Saved branches</SectionLabel>

      {isPinnedLoading ? (
        <p className="text-[11px] text-muted-foreground/60">Loading…</p>
      ) : pinnedBranches.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/60">
          No saved branches yet. Pin a message to save its conversation path.
        </p>
      ) : (
        <div className="space-y-1">
          {pinnedBranches.map((pin) => {
            const isActive = branchId === pin.id;
            return (
              <div
                key={pin.id}
                className={cn(
                  "group flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 transition-colors hover:bg-muted/40",
                  isActive
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/40 bg-transparent"
                )}
                onClick={() => switchBranch(pin.id)}
              >
                <HugeiconsIcon
                  icon={PinIcon}
                  className="mt-0.5 size-3 shrink-0 text-muted-foreground"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-foreground">
                    {pin.pinnedLabel || pin.contentPreview?.slice(0, 40) || "Saved branch"}
                  </p>
                  {pin.contentPreview && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                          {pin.contentPreview}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[240px] text-xs">
                        {pin.contentPreview}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    unpinMessage(pin.id);
                  }}
                  title="Remove saved branch"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar content – composed from sections
// ---------------------------------------------------------------------------
function SidebarContent() {
  return (
    <div className="flex flex-col gap-4">
      <PersonaHeader />

      <Separator className="bg-border/50" />

      <CharacterSection />

      <Separator className="bg-border/50" />

      <ScenarioSection />

      <Separator className="bg-border/50" />

      <SavedBranchesSection />

      <Separator className="bg-border/50" />

      <VoiceSection />

      <Separator className="bg-border/50" />

      <SceneImageSection />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported ChatSidebar – responsive shell
// ---------------------------------------------------------------------------
export function ChatSidebar({ className }: { className?: string }) {
  const { sidebarOpen, setSidebarOpen } = useChatMain();
  const { isMobile, openMobile } = useSidebar();

  // Close chat sidebar when main sidebar opens (main sidebar has priority)
  useEffect(() => {
    if (isMobile && openMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isMobile, openMobile, sidebarOpen, setSidebarOpen]);

  // Don't render if main sidebar is open on mobile
  if (isMobile && openMobile) {
    return null;
  }

  // Mobile: Sheet overlay
  if (isMobile) {
    return (
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="right"
          className="w-[85%] max-w-[320px] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Chat Sidebar</SheetTitle>
          </SheetHeader>
          <div className="flex h-full w-full flex-col overflow-y-auto p-4">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: sticky sidebar
  if (!sidebarOpen) return null;

  return (
    <div
      style={{ width: SIDEBAR_WIDTH } as React.CSSProperties}
      className={cn("sticky top-0 h-screen", className)}
    >
      <div className="flex h-full flex-col overflow-y-auto px-4 py-4">
        <SidebarContent />
      </div>
    </div>
  );
}
