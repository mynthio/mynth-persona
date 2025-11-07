"use client";

import { Dialog } from "@base-ui-components/react/dialog";
import {
  ArrowClockwiseIcon,
  CircleNotchIcon,
  ImageSquareIcon,
  InfoIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useMemo, useState } from "react";
import { Button } from "@/components/mynth-ui/base/button";
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

      // Add run to the store
      addSceneImageGenerationRun(result.runId, {
        runId: result.runId,
        publicAccessToken: result.publicAccessToken,
        chatId,
        startedAt: Date.now(),
      });

      add({
        title: "Scene image job started",
        description: `Generating with ${IMAGE_MODELS[modelId].displayName}.`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unexpected error";

      // Provide specific error message for concurrent job limit
      if (errorMessage === "CONCURRENT_LIMIT_EXCEEDED") {
        add({
          title: "Concurrent generation limit reached",
          description:
            "You've reached the limit of concurrent generations. Upgrade your plan for more.",
          type: "error",
        });
      } else if (errorMessage === "RATE_LIMIT_EXCEEDED") {
        add({
          title: "Rate limit exceeded",
          description:
            "You've reached your image generation limit. Please try again later.",
          type: "error",
        });
      } else {
        add({
          title: "Couldn't trigger scene image",
          description: errorMessage,
          type: "error",
        });
      }
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
            <Dialog.Root modal={false}>
              <Dialog.Trigger>
                <img
                  src={sceneImageUrl}
                  alt="Scene"
                  className="size-[42px] rounded-[16px] object-cover object-top"
                />
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-overlay bg-background/20 backdrop-blur-[1px] transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[starting-style]:backdrop-blur-none dark:opacity-70" />
                <Dialog.Popup
                  className="fixed z-dialog left-1/2 max-w-[800px] h-[80vh]
            -translate-x-1/2 -translate-y-1/2

            top-[calc(50%+1.25rem*var(--nested-dialogs))] scale-[calc(1-0.03*var(--nested-dialogs))] data-[nested-dialog-open]:grayscale-100 data-[nested-dialog-open]:after:absolute data-[nested-dialog-open]:after:inset-0 data-[nested-dialog-open]:after:rounded-[inherit] data-[nested-dialog-open]:after:bg-background/10 data-[nested-dialog-open]:after:backdrop-blur-[1px]
            rounded-[32px] transition-all duration-250 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0
            flex flex-col
            "
                >
                  <div className="w-full h-full flex flex-col items-center justify-center gap-[12px]">
                    <img
                      src={sceneImageUrl}
                      alt="Scene"
                      className="w-full h-full shrink object-contain rounded-[22px]"
                    />
                    <Dialog.Close
                      render={<Button className="shrink-0" color="primary" />}
                    >
                      Close
                    </Dialog.Close>
                  </div>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
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

function ImageGalleryItem({ imageId }: { imageId: string }) {
  const imageUrl = getMediaImageUrl(imageId, "full");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog.Root modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger>
        <img
          src={imageUrl}
          alt="Chat image"
          className="w-full aspect-square rounded-[12px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
        />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-overlay bg-background/20 backdrop-blur-[1px] transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[starting-style]:backdrop-blur-none dark:opacity-70" />
        <Dialog.Popup
          className="fixed z-dialog left-1/2 max-w-[800px] h-[80vh]
            -translate-x-1/2 -translate-y-1/2
            top-[calc(50%+1.25rem*var(--nested-dialogs))] scale-[calc(1-0.03*var(--nested-dialogs))] data-[nested-dialog-open]:grayscale-100 data-[nested-dialog-open]:after:absolute data-[nested-dialog-open]:after:inset-0 data-[nested-dialog-open]:after:rounded-[inherit] data-[nested-dialog-open]:after:bg-background/10 data-[nested-dialog-open]:after:backdrop-blur-[1px]
            rounded-[32px] transition-all duration-250 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0
            flex flex-col p-[24px]
            "
        >
          <div className="w-full h-full flex flex-col items-center justify-center gap-[12px]">
            <img
              src={imageUrl}
              alt="Chat image"
              className="w-full h-full shrink object-contain rounded-[22px]"
            />
            <Dialog.Close
              render={<Button className="shrink-0" color="primary" />}
            >
              Close
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
