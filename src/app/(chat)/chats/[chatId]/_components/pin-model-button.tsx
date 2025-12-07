"use client";

import { usePinnedModels } from "../_hooks/use-pinned-models.hook";
import { Button } from "@/components/ui/button";
import { Pin01, X } from "@untitledui/icons";
import { PushPinIcon, PushPinSimpleSlashIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface PinModelButtonProps {
  modelId: string;
  variant?: "default" | "card";
  className?: string;
}

export function PinModelButton({
  modelId,
  variant = "default",
  className,
}: PinModelButtonProps) {
  const { isPinned, canPin, togglePin } = usePinnedModels();
  const pinned = isPinned(modelId);
  const canPinModel = canPin();

  const showButton = pinned || canPinModel;

  if (!showButton) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin(modelId);
  };

  if (variant === "card") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center w-[32px] h-[32px] rounded-[10px] transition-all duration-150",
          "hover:bg-surface-200/50 active:scale-95",
          "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
          {
            "opacity-100": pinned,
          },
          className
        )}
        aria-label={pinned ? "Unpin model" : "Pin model"}
      >
        {pinned ? (
          <PushPinIcon
            weight="fill"
            className="w-[16px] h-[16px] text-blue-600"
          />
        ) : (
          <PushPinSimpleSlashIcon
            weight="regular"
            className="w-[16px] h-[16px] text-surface-foreground/40"
          />
        )}
      </button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      size="icon-sm"
      variant={pinned ? "outline" : "ghost"}
      className={cn("size-6 rounded-sm [&>svg]:size-2", className)}
      aria-label={pinned ? "Unpin model" : "Pin model"}
    >
      {pinned ? <X strokeWidth={1.5} /> : <Pin01 strokeWidth={1.5} />}
    </Button>
  );
}

