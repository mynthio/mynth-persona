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
import { usePinnedModels } from "../_hooks/use-pinned-models.hook";
import { ChevronUp, Diamond01, Gift02, Lightning01 } from "@untitledui/icons";
import { PinModelButton } from "./pin-model-button";

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
          className="h-8 px-2.5 gap-1.5 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 dark:hover:bg-white/[0.06] transition-colors"
        >
          <ChevronUp strokeWidth={1.5} className="size-3.5 opacity-50" />
          <span className="truncate text-xs font-medium">
            {currentModel?.displayName}
            {currentModel?.tier === "eco" && " (Eco)"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0 max-h-[420px] rounded-xl border-border/50 dark:border-white/10 dark:bg-[#0c0c0f] overflow-hidden" align="start" sideOffset={8}>
        <Command className="bg-transparent">
          <div className="border-b border-border/50 dark:border-white/[0.08]">
            <CommandInput placeholder="Search models..." className="h-10 text-sm" />
          </div>

          <CommandList className="max-h-[340px] p-1.5">
            {hasPinnedModels && (
              <>
                <CommandGroup heading="Pinned" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/50 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                  {pinnedModels.map((model) => (
                    <ModelRow
                      key={model.modelId}
                      model={model}
                      selected={model.modelId === currentModelId}
                      onSelect={(id) => {
                        onModelChange(id);
                        setOpen(false);
                      }}
                    />
                  ))}
                </CommandGroup>
                <CommandSeparator className="my-1.5 bg-border/50 dark:bg-white/[0.06]" />
              </>
            )}

            {!hasPinnedModels && (
              <>
                <CommandGroup heading="Pinned" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/50 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                  <CommandItem disabled className="text-xs text-muted-foreground/50 italic">
                    Pin your favorite models (up to 5)
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator className="my-1.5 bg-border/50 dark:bg-white/[0.06]" />
              </>
            )}

            {unpinnedModels.length > 0 ? (
              <CommandGroup heading="All Models" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/50 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                {unpinnedModels.map((model) => (
                  <ModelRow
                    key={model.modelId}
                    model={model}
                    selected={model.modelId === currentModelId}
                    onSelect={(id) => {
                      onModelChange(id);
                      setOpen(false);
                    }}
                  />
                ))}
              </CommandGroup>
            ) : (
              <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">No models found</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ModelRow({
  model,
  onSelect,
}: {
  model: any;
  selected: boolean;
  onSelect: (id: TextGenerationModelId) => void;
}) {
  const renderTierIcon = () => {
    if (model.tier === "premium") {
      return <Diamond01 strokeWidth={1.5} className="size-3.5 text-rose-500" />;
    } else if (model.tier === "eco") {
      return <Gift02 strokeWidth={1.5} className="size-3.5 text-emerald-500" />;
    } else {
      return <Lightning01 className="size-3.5 opacity-0" strokeWidth={1.5} />;
    }
  };

  return (
    <CommandItem
      value={model.modelId}
      onSelect={() => onSelect(model.modelId as TextGenerationModelId)}
      className="rounded-lg px-2 py-2 text-sm gap-2.5 cursor-pointer data-[selected=true]:bg-muted/60 dark:data-[selected=true]:bg-white/[0.06]"
    >
      {renderTierIcon()}
      <span className="truncate flex-1 text-[13px]">
        {model.displayName}
        {model.tier === "eco" && (
          <span className="text-emerald-500/70 ml-1 text-xs">(Eco)</span>
        )}
      </span>

      <PinModelButton modelId={model.modelId} />
    </CommandItem>
  );
}
