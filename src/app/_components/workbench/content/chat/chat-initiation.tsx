import { CoinsIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { chatConfig } from "@/config/shared/chat/chat-models.config";

const MODEL_OPTIONS = chatConfig.models.map((m) => ({
  value: m.modelId,
  label: m.displayName,
  cost: m.cost,
}));

type Mode = "roleplay" | "story";

interface ChatInitiationProps {
  selectedMode: Mode;
  onSelectMode: (mode: Mode) => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

const modeCopy: Record<Mode, { title: string; desc: string; img: string }> = {
  roleplay: {
    title: "Role‑Play Mode",
    desc: "Immerse yourself in character‑driven conversations where you and the AI embody specific roles and personas",
    img: "/roleplay-mode.png",
  },
  story: {
    title: "Story Mode",
    desc: "Collaborate on creative storytelling where you and the AI build narratives together through dynamic dialogue",
    img: "/story-mode.png",
  },
};

function ModeCard({
  mode,
  active,
  onClick,
}: {
  mode: Mode;
  active: boolean;
  onClick: () => void;
}) {
  const copy = modeCopy[mode];
  const selectedRing = active
    ? mode === "roleplay"
      ? "ring-violet-400 border-violet-300"
      : "ring-emerald-400 border-emerald-300"
    : "ring-transparent border-zinc-200";
  const titleColor =
    mode === "roleplay" ? "text-violet-900" : "text-emerald-900";
  const descColor =
    mode === "roleplay" ? "text-violet-700" : "text-emerald-700";
  const indicatorSelected =
    mode === "roleplay"
      ? "bg-violet-500 border-violet-500"
      : "bg-emerald-500 border-emerald-500";

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`relative group w-full text-left rounded-2xl border ${selectedRing} bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/10`}
    >
      <div className="p-5 md:p-6">
        {/* Selection indicator */}
        <div
          className={`absolute top-3 right-3 size-5 rounded-full border-2 transition-colors ${
            active ? indicatorSelected : "border-zinc-300 bg-white"
          }`}
        >
          {active && <div className="absolute inset-1 bg-white rounded-full" />}
        </div>

        {/* Image */}
        <div className="mb-3 flex items-center justify-center">
          <img
            src={copy.img}
            alt={copy.title}
            className="size-44 object-contain"
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3
            className={`text-lg md:text-xl font-semibold leading-tight ${titleColor}`}
          >
            {copy.title}
          </h3>
          <p className={`text-sm leading-relaxed ${descColor}`}>{copy.desc}</p>
        </div>
      </div>
    </button>
  );
}

export function ChatInitiation({
  selectedMode,
  onSelectMode,
  selectedModel,
  onSelectModel,
}: ChatInitiationProps) {
  const selectedModelOption = MODEL_OPTIONS.find(
    (o) => o.value === selectedModel
  );

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6 mt-12">
      <div className="mx-auto w-full max-w-3xl text-center space-y-10">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Start Your Conversation
          </h1>
          <p className="text-base md:text-lg text-zinc-600">
            Engage with AI Personas in immersive conversations that adapt to
            your preferred style
          </p>
        </div>

        {/* Modes */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <ModeCard
            mode="roleplay"
            active={selectedMode === "roleplay"}
            onClick={() => onSelectMode("roleplay")}
          />
          <ModeCard
            mode="story"
            active={selectedMode === "story"}
            onClick={() => onSelectMode("story")}
          />
        </div>

        {/* Model Selector */}
        <div className="space-y-2 text-left mx-auto w-full max-w-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-700">Model</span>
            {selectedModelOption && (
              <span className="text-[11px] text-zinc-500 inline-flex items-center gap-1">
                <CoinsIcon className="size-3.5" />
                {selectedModelOption.cost === 0
                  ? "free"
                  : selectedModelOption.cost}
              </span>
            )}
          </div>
          <Select value={selectedModel} onValueChange={onSelectModel}>
            <SelectTrigger className="w-full justify-between bg-white h-10 px-3 text-sm">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent className="min-w-[260px] max-h-60">
              {MODEL_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  textValue={option.label}
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="truncate">{option.label}</span>
                    <span className="shrink-0 inline-flex items-center gap-1 text-xs">
                      {option.cost === 0 ? (
                        <Badge variant="secondary">free</Badge>
                      ) : (
                        <Badge variant="secondary">
                          <CoinsIcon className="size-3.5" /> {option.cost}
                        </Badge>
                      )}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-zinc-500">
            Choose a model to use for this chat.
          </p>
        </div>

        {/* Hint */}
        <p className="pt-2 text-sm text-zinc-500">
          Pick a mode above, then start typing to begin your chat
        </p>
      </div>
    </div>
  );
}
