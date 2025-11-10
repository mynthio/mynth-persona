"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "@uidotdev/usehooks";
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

  const allModels = useMemo(() => {
    const searchText = debouncedQuery.trim().toLowerCase();
    return chatConfig.models
      .filter((modelCfg) => {
        if (!searchText) return true;
        const model = textGenerationModels[modelCfg.modelId];
        return (
          model.displayName.toLowerCase().includes(searchText) ||
          model.modelId.toLowerCase().includes(searchText)
        );
      })
      .map((m) => ({
        ...m,
        ...textGenerationModels[m.modelId],
      }));
  }, [debouncedQuery]);

  const pinnedModels = useMemo(() => {
    const byId = new Map(allModels.map((m) => [m.modelId, m]));
    return pinnedModelIds
      .map((id) => byId.get(id))
      .filter(Boolean) as typeof allModels;
  }, [allModels, pinnedModelIds]);

  const unpinnedModels = useMemo(
    () =>
      allModels
        .filter((m) => !pinnedModelIds.includes(m.modelId))
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [allModels, pinnedModelIds]
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
          {/* <SearchInput value={query} onChange={setQuery} /> */}

          <div className="flex-1 overflow-y-auto px-[4px] pb-[4px]">
            {hasPinnedModels && (
              <>
                <SectionHeader title="Pinned" />
                {pinnedModels.map((model) => (
                  <ModelRow
                    key={model.modelId}
                    model={model}
                    selected={model.modelId === currentModelId}
                    isPinned={true}
                    canPin={true}
                    onSelect={(id) => onModelChange(id)}
                    onTogglePin={() => togglePin(model.modelId)}
                  />
                ))}
                <MenuSeparator />
              </>
            )}

            {!hasPinnedModels && (
              <>
                <EmptyHint text="Pin your favorite models (up to 5)" />
                <MenuSeparator />
              </>
            )}

            {unpinnedModels.length > 0 ? (
              unpinnedModels.map((model) => (
                <ModelRow
                  key={model.modelId}
                  model={model}
                  selected={model.modelId === currentModelId}
                  isPinned={isPinned(model.modelId)}
                  canPin={canPin()}
                  onSelect={(id) => onModelChange(id)}
                  onTogglePin={() => togglePin(model.modelId)}
                />
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

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="p-[12px] pb-[8px]">
      <Input
        name="model-search"
        placeholder="Search models..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white rounded-[15px] border-0 h-[38px]"
      />
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-[12px] py-[6px]">
      <span className="text-[0.75rem] font-medium text-surface-foreground/50 uppercase tracking-wide">
        {title}
      </span>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="px-[12px] py-[6px] mb-[4px]">
      <span className="text-[0.75rem] text-surface-foreground/40 italic">
        {text}
      </span>
    </div>
  );
}

function PremiumBadge() {
  return <FireIcon className="text-rose-500 shrink-0" weight="bold" />;
}

function ModelRow({
  model,
  selected,
  isPinned,
  canPin,
  onSelect,
  onTogglePin,
}: {
  model: any;
  selected: boolean;
  isPinned: boolean;
  canPin: boolean;
  onSelect: (id: TextGenerationModelId) => void;
  onTogglePin: () => void;
}) {
  const showPinButton = isPinned || canPin;
  return (
    <MenuItem
      className={cn(
        "group w-full flex flex-row items-center gap-[8px] px-[12px]",
        {
          "bg-surface/80": selected,
        }
      )}
      onClick={() => onSelect(model.modelId as TextGenerationModelId)}
    >
      <div className="flex w-full gap-[4px] truncate">
        <span className="font-onest text-[0.95rem] truncate">
          {model.displayName}
        </span>

        {model.isPremium && <PremiumBadge />}
      </div>

      {showPinButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className={cn(
            "flex items-center justify-center w-[24px] h-[24px] rounded-[8px] transition-all duration-150 shrink-0",
            "hover:bg-surface-200/50 active:scale-95",
            "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
            {
              "opacity-100": isPinned,
            }
          )}
          aria-label={isPinned ? "Unpin model" : "Pin model"}
        >
          {isPinned ? (
            <PushPinIcon
              weight="fill"
              className="w-[14px] h-[14px] text-violet-600"
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
  );
}
