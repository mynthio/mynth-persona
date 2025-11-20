"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
import { ChevronUp, Diamond01, Gift02, Lightning01, Pin01, X } from "@untitledui/icons";

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
  const [open, setOpen] = useState(false);
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
    () => allModels.filter((m) => !pinnedModelIds.includes(m.modelId)),
    [allModels, pinnedModelIds]
  );

  const hasPinnedModels = pinnedModels.length > 0;

  const currentModel = textGenerationModels[currentModelId];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Select AI model for role-play"
          className="rounded-3xl"
        >
          <ChevronUp strokeWidth={1} />
          <span className="truncate">
            {currentModel?.displayName}
            {currentModel?.tier === "eco" && " (Eco)"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0 max-h-[500px]" align="start">
        <Command>
          <CommandInput placeholder="Search models..." />

          <CommandList>
            {hasPinnedModels && (
              <>
                <CommandGroup heading="Pinned">
                  {pinnedModels.map((model) => (
                    <ModelRow
                      key={model.modelId}
                      model={model}
                      selected={model.modelId === currentModelId}
                      isPinned={true}
                      canPin={true}
                      onSelect={(id) => {
                        onModelChange(id);
                        setOpen(false);
                      }}
                      onTogglePin={() => togglePin(model.modelId)}
                    />
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {!hasPinnedModels && (
              <>
                <CommandGroup heading="Pinned">
                  <CommandItem disabled>
                    Pin your favorite models (up to 5)
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {unpinnedModels.length > 0 ? (
              <CommandGroup>
                {unpinnedModels.map((model) => (
                  <ModelRow
                    key={model.modelId}
                    model={model}
                    selected={model.modelId === currentModelId}
                    isPinned={isPinned(model.modelId)}
                    canPin={canPin()}
                    onSelect={(id) => {
                      onModelChange(id);
                      setOpen(false);
                    }}
                    onTogglePin={() => togglePin(model.modelId)}
                  />
                ))}
              </CommandGroup>
            ) : (
              <CommandEmpty>No models found</CommandEmpty>
            )}
          </CommandList>
        </Command>

        {/* <div className="border-t border-surface-200 p-[8px]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onOpenSettings();
              setOpen(false);
            }}
            className="w-full justify-start text-[0.9rem] h-[36px] rounded-[12px]"
          >
            <GearIcon className="w-[16px] h-[16px] mr-[8px]" />
            More model info
          </Button>
        </div> */}
      </PopoverContent>
    </Popover>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div>
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

  // Render tier icon based on model tier
  const renderTierIcon = () => {
    if (model.tier === "premium") {
      return <Diamond01 strokeWidth={1.5} className="text-rose-500" />;
    } else if (model.tier === "eco") {
      return <Gift02 strokeWidth={1.5} className="text-emerald-500" />;
    } else {
      // standard, free, cheap tiers use hidden lightning icon for alignment
      return <Lightning01 className="opacity-0" strokeWidth={1.5} />;
    }
  };

  return (
    <CommandItem
      value={model.modelId}
      onSelect={() => onSelect(model.modelId as TextGenerationModelId)}
    >
      {renderTierIcon()}
      <span className="truncate w-full">
        {model.displayName}
        {model.tier === "eco" && " (Eco)"}
      </span>

      {showPinButton && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          size="icon-sm"
          variant={isPinned ? "outline" : "ghost"}
          className="size-6 rounded-sm [&>svg]:size-2"
          aria-label={isPinned ? "Unpin model" : "Pin model"}
        >
          {isPinned ? <X strokeWidth={1.5} /> : <Pin01 strokeWidth={1.5} />}
        </Button>
      )}
    </CommandItem>
  );
}
