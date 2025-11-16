"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowClockwiseIcon,
  CircleNotchIcon,
  ImageSquareIcon,
  InfoIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { useChatMain } from "../_contexts/chat-main.context";
import { useToast } from "@/components/ui/toast";
import { getMediaImageUrl } from "@/lib/utils";
import { generateChatSceneImage } from "@/actions/generate-chat-scene-image";
import {
  IMAGE_MODELS,
  ImageModelId,
} from "@/config/shared/image-models";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuPositioner,
  MenuTrigger,
} from "@/components/mynth-ui/base/menu";
import { useChatImageGenerationStore } from "@/stores/chat-image-generation.store";
import { ChatSettingsSceneImageInProgress } from "./chat-settings-scene-image-in-progress";
import { SWRConfig } from "swr";
import { updateChatAction } from "@/actions/update-chat.action";
import useSWR from "swr";
import { PublicPersonaImage } from "@/schemas/shared/persona-image.schema";
import { fetcher } from "@/lib/fetcher";

export function ChatSettingsImages() {
  const { chatId, settings, setSettings } = useChatMain();
  const { personas } = useChatPersonas();
  const persona = personas[0];
  const { add } = useToast();
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

  const sceneImageMediaId = settings.sceneImageMediaId;
  const sceneImageUrl = sceneImageMediaId
    ? getMediaImageUrl(sceneImageMediaId, "full")
    : null;

  // Fetch images for this chat
  const {
    data: images,
    mutate: refreshImages,
    isLoading: isLoadingImages,
  } = useSWR<PublicPersonaImage[]>(
    `/api/images?chatId=${chatId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

  const handleSceneImageComplete = (mediaId: string) => {
    setSettings({
      ...settings,
      sceneImageMediaId: mediaId,
    });
    // Refresh images gallery
    refreshImages();
  };

  const triggerWithModel = async (modelId: ImageModelId) => {
    if (isGenerating || activeRun) return;

    setIsGenerating(true);
    try {
      const result = await generateChatSceneImage(chatId, modelId);

      if (!result.success) {
        // Handle error from server action
        const { code, message } = result.error;

        if (code === "CONCURRENT_LIMIT_EXCEEDED") {
          add({
            title: "Concurrent generation limit reached",
            description:
              "You've reached the limit of concurrent generations. Upgrade your plan for more.",
            type: "error",
          });
        } else if (code === "RATE_LIMIT_EXCEEDED") {
          add({
            title: "Rate limit exceeded",
            description:
              "You've reached your image generation limit. Please try again later.",
            type: "error",
          });
        } else {
          add({
            title: "Couldn't trigger scene image",
            description: message,
            type: "error",
          });
        }
        return;
      }

      // Add run to the store
      addSceneImageGenerationRun(result.data.runId, {
        runId: result.data.runId,
        publicAccessToken: result.data.publicAccessToken,
        chatId,
        startedAt: Date.now(),
      });

      add({
        title: "Scene image job started",
        description: `Generating with ${IMAGE_MODELS[modelId].displayName}.`,
      });
    } catch (error) {
      // Handle unexpected errors (network issues, etc.)
      const errorMessage =
        error instanceof Error ? error.message : "Unexpected error";
      add({
        title: "Couldn't trigger scene image",
        description: errorMessage,
        type: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectModel = async (modelId: ImageModelId) => {
    await triggerWithModel(modelId);
  };

  const handleSetToProfileImage = async () => {
    if (!persona.profileImageIdMedia) return;

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

      add({
        title: "Scene image updated",
        description: "Set to persona's profile image.",
      });
    } catch (error) {
      add({
        title: "Failed to update scene image",
        description: "Try again or contact support",
        type: "error",
      });
    }
  };

  return (
    <div className="flex flex-col gap-[24px]">
      <SWRConfig
        value={{
          // @ts-expect-error - trigger realtime hook requires null fetcher scope
          fetcher: null,
        }}
      >
        {activeRun && (
          <ChatSettingsSceneImageInProgress
            runId={activeRun.runId}
            publicAccessToken={activeRun.publicAccessToken}
            chatId={chatId}
            onComplete={handleSceneImageComplete}
          />
        )}
      </SWRConfig>

      <div className="flex items-start justify-between gap-[18px]">
        <div className="flex flex-col gap-[2px]">
          <p className="text-[0.9rem] text-surface-foreground flex items-center gap-[4px]">
            Scene reference image
            <span className="uppercase bg-rose-300 text-rose-700 font-onest text-[0.7rem] px-[6px] py-[2px] rounded-[6px] w-auto">
              Beta
            </span>
          </p>
          <p className="text-[0.75rem] text-surface-foreground/80">
            Preview the current scene art or spin up a fresh one.
          </p>
        </div>

        <div className="flex items-center gap-[12px]">
          {activeRun ? (
            <div className="size-[42px] rounded-[16px] bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center">
              <CircleNotchIcon className="animate-spin" />
            </div>
          ) : sceneImageUrl ? (
            <SceneImageDialog imageUrl={sceneImageUrl} />
          ) : null}

          <Menu>
            <MenuTrigger
              nativeButton
              render={
                <Button
                  size="icon"
                  variant="outline"
                  className="shrink-0"
                  disabled={isGenerating || !!activeRun}
                />
              }
            >
              <ArrowClockwiseIcon />
            </MenuTrigger>
            <MenuPositioner>
              <MenuPopup>
                {Object.values(IMAGE_MODELS).map((model) => (
                  <MenuItem
                    key={model.id}
                    onClick={() => handleSelectModel(model.id)}
                  >
                    <span className="flex items-center gap-[6px]">
                      {model.displayName}
                      {model.cost >= 2 && (
                        <SparkleIcon
                          weight="fill"
                          className="text-amber-500"
                          size={14}
                        />
                      )}
                    </span>
                  </MenuItem>
                ))}
                <div className="h-[1px] bg-surface-200 mx-[8px] my-[4px]" />
                <MenuItem
                  onClick={handleSetToProfileImage}
                  disabled={!persona.profileImageIdMedia}
                >
                  Set to profile image
                </MenuItem>
              </MenuPopup>
            </MenuPositioner>
          </Menu>
        </div>
      </div>

      <div className="flex px-[12px] gap-[8px] py-[8px] rounded-[12px] bg-surface-100 outline-[2px] outline-surface-200">
        <div className="shrink-0 mt-[2px] text-surface-foreground/60">
          <InfoIcon />
        </div>
        <div className="text-[0.85rem] text-surface-foreground/80 space-y-[8px]">
          <p>
            Character mode uses a reference image to maintain consistent
            character appearance across image generations in this chat. By
            default, the Persona profile picture is used as the reference image.
          </p>
          <p>
            For best results, we recommend generating a dedicated character
            image. This creates a full-body reference image optimized for
            character consistency. Some Persona profile pictures may not work
            well with the character image logic. If you experience poor results,
            try re-generating the reference image.
          </p>
          <p>
            <strong>Note:</strong> This feature is in early beta. Only Gemini
            Flash Image model supports character mode. Other models can be used
            to generate reference images or in creative mode.
          </p>
        </div>
      </div>

      {/* Images Gallery */}
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-[2px]">
            <p className="text-[0.9rem] text-surface-foreground flex items-center gap-[4px]">
              <ImageSquareIcon />
              Chat Images Gallery
            </p>
            <p className="text-[0.75rem] text-surface-foreground/80">
              All images generated in this chat
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refreshImages()}
            disabled={isLoadingImages}
          >
            <ArrowClockwiseIcon className={isLoadingImages ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {isLoadingImages ? (
          <div className="flex items-center justify-center py-[32px]">
            <CircleNotchIcon className="animate-spin text-surface-foreground/50" size={32} />
          </div>
        ) : images && images.length > 0 ? (
          <div className="grid grid-cols-3 gap-[12px]">
            {images.map((image) => (
              <ImageGalleryItem key={image.id} imageId={image.id} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-[32px] text-surface-foreground/50">
            <ImageSquareIcon size={48} />
            <p className="text-[0.9rem] mt-[12px]">No images yet</p>
            <p className="text-[0.75rem]">Images will appear here as they're generated</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SceneImageDialog({ imageUrl }: { imageUrl: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <button onClick={() => setIsOpen(true)}>
        <img
          src={imageUrl}
          alt="Scene"
          className="size-[42px] rounded-[16px] object-cover object-top"
        />
      </button>
      <DialogContent className="max-w-[800px] h-[80vh]">
        <DialogTitle className="sr-only">Scene Image</DialogTitle>
        <div className="w-full h-full flex flex-col items-center justify-center gap-[12px]">
          <img
            src={imageUrl}
            alt="Scene"
            className="w-full h-full shrink object-contain rounded-[22px]"
          />
          <Button className="shrink-0" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImageGalleryItem({ imageId }: { imageId: string }) {
  const imageUrl = getMediaImageUrl(imageId, "full");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <button onClick={() => setIsOpen(true)}>
        <img
          src={imageUrl}
          alt="Chat image"
          className="w-full aspect-square rounded-[12px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
        />
      </button>
      <DialogContent className="max-w-[800px] h-[80vh]">
        <DialogTitle className="sr-only">Chat Image</DialogTitle>
        <div className="w-full h-full flex flex-col items-center justify-center gap-[12px]">
          <img
            src={imageUrl}
            alt="Chat image"
            className="w-full h-full shrink object-contain rounded-[22px]"
          />
          <Button className="shrink-0" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
