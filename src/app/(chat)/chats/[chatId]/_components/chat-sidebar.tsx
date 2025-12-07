"use client";

import { useEffect, useMemo, useState } from "react";
import { cn, getImageUrl } from "@/lib/utils";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { useChatMain } from "../_contexts/chat-main.context";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  ArrowClockwiseIcon,
  InfoIcon,
  SparkleIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteChatAction } from "@/actions/delete-chat.action";
import { useSWRConfig } from "swr";
import { useRouter } from "next/navigation";

const SIDEBAR_WIDTH = "18rem";

function PersonaImage() {
  const { personas } = useChatPersonas();
  const { settings } = useChatMain();

  const persona = personas[0];
  const imageId = settings.sceneImageMediaId ?? persona.profileImageIdMedia;

  if (!imageId) return null;

  return (
    <div>
      <img
        src={getImageUrl(imageId)}
        alt={persona.name}
        className="aspect-square size-full rounded-xl object-cover object-top"
      />
    </div>
  );
}

function Content() {
  const { chatId, settings, setSettings } = useChatMain();
  const { personas } = useChatPersonas();
  const persona = personas[0];
  const { navigateSettings } = useSettingsNavigation();
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const sceneImageMediaId = settings.sceneImageMediaId;
  const currentSceneImageId =
    sceneImageMediaId ?? persona?.profileImageIdMedia ?? null;
  const hasCustomSceneImage = !!sceneImageMediaId;

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

  const handleDeleteChat = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteChatAction(chatId);
      await mutate("/api/chats");
      router.push("/chats");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unexpected error";
      toast.error("Failed to delete chat", {
        description: errorMessage,
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border-2 border-sidebar-border bg-sidebar px-4 py-2">
      {activeRun && (
        <ChatSettingsSceneImageInProgress
          runId={activeRun.runId}
          publicAccessToken={activeRun.publicAccessToken}
          chatId={chatId}
          onComplete={handleSceneImageComplete}
        />
      )}

      <Accordion type="single" collapsible>
        <AccordionItem value="character">
          <AccordionTrigger>My character</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {settings.user_persona?.name ? (
                <>
                  <p>
                    <strong>Name:</strong> {settings.user_persona?.name ?? ""}
                  </p>
                  <p>
                    <strong>Description:</strong>{" "}
                    {settings.user_persona?.character ?? ""}
                  </p>
                </>
              ) : (
                <p>No character set</p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-4 w-full"
              onClick={() => navigateSettings("user")}
            >
              Edit
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="scenario">
          <AccordionTrigger>Scenario</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <p>
                <strong>Scenario:</strong>{" "}
                {settings.scenario?.scenario_text
                  ? `${settings.scenario?.scenario_text?.slice(0, 222)}${
                      settings.scenario?.scenario_text?.length > 222
                        ? "..."
                        : ""
                    }`
                  : "No scenario set"}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full"
                onClick={() => navigateSettings("scenario")}
              >
                Edit
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="settings">
          <AccordionTrigger>Settings</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <p className="text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Scene reference image
                  </p>
                  <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[0.65rem] font-semibold text-rose-400">
                    Beta
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex size-6 items-center justify-center rounded-full border border-border/70 bg-background/70 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <InfoIcon size={13} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={6}>
                    <div className="max-w-[220px] space-y-1">
                      <p>
                        Character mode uses this image to keep your character
                        looking consistent across generations in this chat.
                      </p>
                      <p className="text-[0.7rem] opacity-80">
                        For best results, re-generate a dedicated reference
                        image instead of using the profile picture.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {currentSceneImageId && (
              <div className="overflow-hidden rounded-lg border border-border/40 bg-muted/30">
                <img
                  src={getImageUrl(currentSceneImageId)}
                  alt="Scene reference preview"
                  className="aspect-3/4 w-full object-cover object-top"
                />
              </div>
            )}

            <div className="space-y-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex w-full items-center justify-between gap-2 border-border/60 bg-background/60 text-xs font-medium text-foreground hover:bg-background"
                    disabled={isGenerating || !!activeRun}
                  >
                    <span className="flex items-center gap-2">
                      <ArrowClockwiseIcon
                        className={cn(
                          "h-4 w-4 text-muted-foreground",
                          (isGenerating || activeRun) && "animate-spin"
                        )}
                      />
                      {activeRun
                        ? "Generating scene image…"
                        : "Re-generate scene image"}
                    </span>
                    {(isGenerating || activeRun) && (
                      <CompactSpinner className="ml-1" />
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
                      disabled={isGenerating || !!activeRun}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium">
                            {model.displayName}
                          </span>
                          {model.cost >= 2 && (
                            <SparkleIcon
                              weight="fill"
                              className="text-amber-400"
                              size={14}
                            />
                          )}
                          {isModelNew(model.id) && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0.5 h-auto border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                            >
                              New
                            </Badge>
                          )}
                          {isModelBeta(model.id) && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0.5 h-auto border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
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
                    disabled={
                      !persona?.profileImageIdMedia ||
                      isGenerating ||
                      !!activeRun
                    }
                  >
                    <span className="text-xs font-medium">
                      Use persona profile image
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="pt-4 border-t border-border/40">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    disabled={isDeleting}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete chat
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete chat?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You can&apos;t undo this action. All messages will be
                      removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteChat}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

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

  // Mobile: Use Sheet component for full-screen overlay
  if (isMobile) {
    return (
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="right"
          className="bg-sidebar text-sidebar-foreground w-[85%] max-w-[320px] p-0 [&>button]:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Chat Sidebar</SheetTitle>
          </SheetHeader>
          <div className="flex h-full w-full flex-col overflow-auto p-4">
            <div className="flex flex-col gap-4">
              <PersonaImage />
              <Content />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Keep existing sticky sidebar behavior
  if (!sidebarOpen) return null;

  return (
    <div
      style={{ width: SIDEBAR_WIDTH } as React.CSSProperties}
      className={cn("sticky top-0 h-full p-4", className)}
    >
      <div className="flex flex-col gap-4">
        <PersonaImage />
        <Content />
      </div>
    </div>
  );
}
