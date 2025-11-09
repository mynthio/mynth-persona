"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { filter, map, pipe, toArray } from "@fxts/core";
import {
  Menu,
  MenuTrigger,
  MenuPositioner,
  MenuPopup,
  MenuItem,
  MenuSeparator,
} from "@/components/mynth-ui/base/menu";
import { Input } from "@/components/mynth-ui/base/input";
import { Label } from "@/components/mynth-ui/base/label";
import { Button } from "@/components/mynth-ui/base/button";
import { chatConfig } from "@/config/shared/chat/chat-models.config";
import { textGenerationModels } from "@/config/shared/models/text-generation-models.config";
import type { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";
import {
  FireIcon,
  PushPinIcon,
  PushPinSimpleSlashIcon,
  GearIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { usePinnedModels } from "../_hooks/use-pinned-models.hook";

interface ChatModelPickerMenuProps {
  currentModelId: TextGenerationModelId;
  onModelChange: (modelId: TextGenerationModelId) => void;
  onOpenSettings: () => void;
}

export function ChatModelPickerMenu({
  currentModelId,
  onModelChange,
  onOpenSettings,
}: ChatModelPickerMenuProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const { pinnedModelIds, isPinned, canPin, togglePin } = usePinnedModels();

  const allModels = useMemo(
    () =>
      pipe(
        chatConfig.models,
        filter((m) => {
          const model = textGenerationModels[m.modelId];
          const searchText = debouncedQuery.toLowerCase();

          if (!searchText) return true;

          return (
            model.displayName.toLowerCase().includes(searchText) ||
            model.modelId.toLowerCase().includes(searchText)
          );
        }),
        map((m) => ({
          ...m,
          ...textGenerationModels[m.modelId],
        })),
        toArray,
      ),
    [debouncedQuery],
  );

  const pinnedModels = useMemo(
    () => allModels.filter((m) => pinnedModelIds.includes(m.modelId)),
    [allModels, pinnedModelIds],
  );

  const unpinnedModels = useMemo(
    () =>
      allModels
        .filter((m) => !pinnedModelIds.includes(m.modelId))
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [allModels, pinnedModelIds],
  );

  const hasPinnedModels = pinnedModels.length > 0;

  const currentModel = textGenerationModels[currentModelId];

  return (
    <Menu>
      <MenuTrigger
        nativeButton
        render={
          <Button
            size="sm"
            className="leading-none max-w-[180px] truncate"
            aria-label="Select AI model for role-play"
          />
        }
      >
        <span className="truncate">{currentModel?.displayName}</span>
      </MenuTrigger>
      <MenuPositioner>
        <MenuPopup
          className={cn(
            "w-[340px] max-h-[500px] flex flex-col p-0 overflow-hidden rounded-[24px]"
          )}
        >
          <div className="p-[12px] pb-[8px]">
            <Input
              name="model-search"
              placeholder="Search models..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white rounded-[15px] border-0 h-[38px]"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-[4px] pb-[4px]">
            {hasPinnedModels && (
              <>
                <div className="px-[12px] py-[6px]">
                  <span className="text-[0.75rem] font-medium text-surface-foreground/50 uppercase tracking-wide">
                    Pinned
                  </span>
                </div>
                {pinnedModels.map((model) => (
                  <MenuItem
                    key={model.modelId}
                    className={cn(
                      "group flex items-center justify-between h-auto py-[10px] rounded-[12px]",
                      {
                        "bg-surface/80": model.modelId === currentModelId,
                      }
                    )}
                    onClick={() => onModelChange(model.modelId as TextGenerationModelId)}
                  >
                    <div className="flex items-center gap-[8px] flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-[6px]">
                          <span className="font-onest text-[0.95rem] truncate">
                            {model.displayName}
                          </span>
                          {model.isPremium && (
                            <Label color="red" size="sm">
                              <FireIcon weight="bold" className="w-[12px] h-[12px]" />
                            </Label>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(model.modelId);
                      }}
                      className={cn(
                        "flex items-center justify-center w-[24px] h-[24px] rounded-[8px] transition-all duration-150",
                        "hover:bg-surface-200/50 active:scale-95",
                        "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
                        {
                          "opacity-100": isPinned(model.modelId),
                        }
                      )}
                      aria-label="Unpin model"
                    >
                      <PushPinIcon
                        weight="fill"
                        className="w-[14px] h-[14px] text-blue-600"
                      />
                    </button>
                  </MenuItem>
                ))}
                <MenuSeparator />
              </>
            )}

            {!hasPinnedModels && (
              <>
                <div className="px-[12px] py-[6px] mb-[4px]">
                  <span className="text-[0.75rem] text-surface-foreground/40 italic">
                    Pin your favorite models (up to 5)
                  </span>
                </div>
                <MenuSeparator />
              </>
            )}

            {unpinnedModels.length > 0 ? (
              unpinnedModels.map((model) => (
                <MenuItem
                  key={model.modelId}
                  className={cn(
                    "group flex items-center justify-between h-auto py-[10px] rounded-[12px]",
                    {
                      "bg-surface/80": model.modelId === currentModelId,
                    }
                  )}
                  onClick={() => onModelChange(model.modelId as TextGenerationModelId)}
                >
                  <div className="flex items-center gap-[8px] flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-[6px]">
                        <span className="font-onest text-[0.95rem] truncate">
                          {model.displayName}
                        </span>
                        {model.isPremium && (
                          <Label color="red" size="sm">
                            <FireIcon weight="bold" className="w-[12px] h-[12px]" />
                          </Label>
                        )}
                      </div>
                    </div>
                  </div>
                  {(isPinned(model.modelId) || canPin()) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(model.modelId);
                      }}
                      className={cn(
                        "flex items-center justify-center w-[24px] h-[24px] rounded-[8px] transition-all duration-150",
                        "hover:bg-surface-200/50 active:scale-95",
                        "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
                        {
                          "opacity-100": isPinned(model.modelId),
                        }
                      )}
                      aria-label={isPinned(model.modelId) ? "Unpin model" : "Pin model"}
                    >
                      {isPinned(model.modelId) ? (
                        <PushPinIcon
                          weight="fill"
                          className="w-[14px] h-[14px] text-blue-600"
                        />
                      ) : (
                        <PushPinSimpleSlashIcon
                          weight="regular"
                          className="w-[14px] h-[14px] text-surface-foreground/40"
                        />
                      )}
                    </button>
                  )}
                </MenuItem>
              ))
            ) : (
              <div className="px-[12px] py-[24px] text-center">
                <p className="text-[0.9rem] text-surface-foreground/50">
                  No models found
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-surface-200 p-[8px]">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenSettings}
              className="w-full justify-start text-[0.9rem] h-[36px] rounded-[12px]"
            >
              <GearIcon className="w-[16px] h-[16px] mr-[8px]" />
              More model info
            </Button>
          </div>
        </MenuPopup>
      </MenuPositioner>
    </Menu>
  );
}
