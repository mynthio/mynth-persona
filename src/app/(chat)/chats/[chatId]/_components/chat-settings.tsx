"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSettingsNavigation } from "../_hooks/use-settings-navigation.hook";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useSidebar } from "@/components/ui/sidebar";

import {
  FireIcon,
  PushPinIcon,
  PushPinSimpleSlashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { ButtonGroup } from "@/components/ui/button-group";
import { updateChatAction } from "@/actions/update-chat.action";
import { useChatMain } from "../_contexts/chat-main.context";
import { CreateChatButton } from "@/components/create-chat-button";
import { DeleteChat } from "./delete-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "@uidotdev/usehooks";
import { chatConfig } from "@/config/shared/chat/chat-models.config";
import {
  TextGenerationModelConfig,
  TextGenerationModelId,
  textGenerationModels,
} from "@/config/shared/models/text-generation-models.config";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { usePinnedModels } from "../_hooks/use-pinned-models.hook";
import { Gift02 } from "@untitledui/icons";

type ChatSettingsProps = {
  defaultOpen: boolean;
};

export function ChatSettings(props: ChatSettingsProps) {
  const { isMobile } = useSidebar();

  return isMobile ? (
    <ChatSettingsMobile defaultOpen={props.defaultOpen} />
  ) : (
    <ChatSettingsDesktop defaultOpen={props.defaultOpen} />
  );
}

type ChatSettingsDesktopProps = {
  defaultOpen: boolean;
};

function ChatSettingsDesktop(props: ChatSettingsDesktopProps) {
  const { areSettingsOpen, closeSettings } = useSettingsNavigation();

  return (
    <Dialog
      defaultOpen={props.defaultOpen}
      open={areSettingsOpen}
      onOpenChange={closeSettings}
    >
      <DialogContent className="max-w-[800px] h-[520px] max-h-[calc(100vh-3rem)]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="flex gap-[18px] h-full overflow-hidden">
          <ScrollArea className="h-full w-full">
            <ChatSettingsContent />
            <div className="h-[24px]"></div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type ChatSettingsMobileProps = {
  defaultOpen: boolean;
};

function ChatSettingsMobile(props: ChatSettingsMobileProps) {
  const { areSettingsOpen, closeSettings } = useSettingsNavigation();

  return (
    <Sheet
      defaultOpen={props.defaultOpen}
      open={areSettingsOpen}
      onOpenChange={closeSettings}
    >
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader>
          <SheetTitle className="sr-only">Chat Settings</SheetTitle>
        </SheetHeader>
        <div className="relative w-full h-full min-h-0">
          <ScrollArea className="h-full w-full">
            <div className="px-[24px] pt-[24px]">
              <ChatSettingsContent />
            </div>
            <div className="h-[200px]" />
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ChatSettingsContent() {
  const { current } = useSettingsNavigation();

  const contentComponent = useMemo(() => {
    switch (current) {
      case "model":
        return <ChatSettingsModel />;
      case "user":
        return <ChatSettingsUser />;
      case "scenario":
        return <ChatSettingsScenario />;
      default:
        return <ChatSettingsHome />;
    }
  }, [current]);

  return (
    <div className="relative flex-1 w-full p-[6px] pr-[12px]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="w-full h-full"
        >
          {contentComponent}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ChatSettingsHome() {
  const { personas } = useChatPersonas();
  const persona = personas[0];
  const { chatId, settings, setSettings, mode } = useChatMain();

  return (
    <div className="flex flex-col gap-[32px]">
      <div className="flex items-center justify-between gap-[32px]">
        <div className="flex flex-col gap-[2px]">
          <p className="text-[0.9rem] text-surface-foreground">Chat Mode</p>
          <p className="text-[0.75rem] text-surface-foreground/80">
            You can set mode only at the beginning of the chat.
          </p>
        </div>
        <Button size="sm" className="shrink-0" disabled>
          {mode === "roleplay" ? "Roleplay" : "Story"}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-[32px]">
        <div className="flex flex-col gap-[2px]">
          <p className="text-[0.9rem] text-surface-foreground">New Chat</p>
          <p className="text-[0.75rem] text-surface-foreground/80">
            Start new chat with {persona.name}?
          </p>
        </div>

        <CreateChatButton personaId={persona.id}>Create</CreateChatButton>
      </div>

      <div className="flex items-center gap-[12px] my-[12px]">
        <p className="font-mono uppercase text-[0.75rem] shrink-0 text-surface-foreground/50">
          Danger Zone
        </p>
        <hr className="w-full h-[1px] bg-surface-foreground/50" />
      </div>

      <div className="flex items-center justify-between gap-[32px]">
        <div className="flex flex-col gap-[2px]">
          <p className="text-[0.9rem] text-surface-foreground">
            Delete Chat? This action cannot be undone.
          </p>
          <p className="text-[0.75rem] text-surface-foreground/80">
            This action can&apos;t be undone. All messages will be removed.
            <br />
            You will confirm it in next step.
          </p>
        </div>
        <DeleteChat />
      </div>
    </div>
  );
}

function ChatSettingsUser() {
  const { chatId, settings, setSettings, mode } = useChatMain();
  const { personas } = useChatPersonas();
  const persona = personas[0];

  const isStoryMode = mode === "story";

  const formSchema = z.object({
    name: z.string(),
    character: z.string(),
  });

  const form = useForm({
    defaultValues: {
      name: settings.user_persona?.name ?? "",
      character: settings.user_persona?.character ?? "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (isStoryMode) return;

      await updateChatAction(chatId, {
        settings: {
          user_persona: {
            enabled: true,
            name: value.name,
            character: value.character,
          },
        },
      }).then(() => {
        setSettings({
          ...settings,
          user_persona: {
            enabled: true,
            name: value.name,
            character: value.character,
          },
        });
      });
    },
  });

  return (
    <form
      className="space-y-[24px]"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      {isStoryMode && (
        <div className="rounded-[12px] bg-surface-100 p-[12px] text-[0.85rem] text-surface-foreground">
          Story mode doesn&apos;t support My persona. Use your prompt to guide
          the model&apos;s behavior.
        </div>
      )}
      <form.Field name="name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="John"
                autoComplete="off"
                data-form-type="other"
                disabled={isStoryMode}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
              <FieldDescription>Your character&apos;s name.</FieldDescription>
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="character">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="character">Character Description</FieldLabel>
              <Textarea
                id="character"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Describe your character..."
                autoComplete="off"
                data-form-type="other"
                disabled={isStoryMode}
                className="min-h-[80px]"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
              <FieldDescription>
                A description of your character. Personality, relations and
                informations {persona.name} should know about you.
              </FieldDescription>
            </Field>
          );
        }}
      </form.Field>

      <ButtonGroup className="justify-end">
        <Button type="submit" disabled={form.state.isSubmitting || isStoryMode}>
          Save
        </Button>
      </ButtonGroup>
    </form>
  );
}

function ChatSettingsScenario() {
  const { chatId, settings, setSettings, mode } = useChatMain();

  const isStoryMode = mode === "story";

  const formSchema = z.object({
    scenario: z.string(),
  });

  const form = useForm({
    defaultValues: {
      scenario: settings.scenario?.scenario_text ?? "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (isStoryMode) return;

      await updateChatAction(chatId, {
        settings: {
          scenario: {
            scenario_text: value.scenario,
          },
        },
      }).then(() => {
        setSettings({
          ...settings,
          scenario: {
            ...settings.scenario,
            scenario_text: value.scenario,
          },
        });
      });
    },
  });

  return (
    <form
      className="space-y-[24px]"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      {isStoryMode && (
        <div className="rounded-[12px] bg-surface-100 p-[12px] text-[0.85rem] text-surface-foreground">
          Story mode doesn&apos;t support Scenario. Use your prompt to guide the
          model&apos;s behavior and context.
        </div>
      )}
      <form.Field name="scenario">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="scenario">Scenario</FieldLabel>
              <Textarea
                id="scenario"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Custom scenario for chat"
                autoComplete="off"
                data-form-type="other"
                disabled={isStoryMode}
                className="min-h-[80px]"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
              <FieldDescription>
                Scenario will be included inside chat instructions. It will
                always be used to set the context of the session.
              </FieldDescription>
            </Field>
          );
        }}
      </form.Field>

      <ButtonGroup className="justify-end">
        <Button type="submit" disabled={form.state.isSubmitting || isStoryMode}>
          Save
        </Button>
      </ButtonGroup>
    </form>
  );
}

function ChatSettingsModel() {
  const { chatId, modelId, setModelId, mode } = useChatMain();
  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounce(query, 300);
  const [isLoading, setIsLoading] = useState(false);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [showVeniceOnly, setShowVeniceOnly] = useState(false);
  const { isPinned, canPin, togglePin } = usePinnedModels();

  const models = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    return chatConfig.models
      .map(({ modelId }) => textGenerationModels[modelId])
      .filter((model): model is TextGenerationModelConfig =>
        Boolean(model && model.enabled)
      )
      .filter((model) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          model.displayName.toLowerCase().includes(normalizedQuery) ||
          model.modelId.toLowerCase().includes(normalizedQuery) ||
          model.perks.join(" ").toLowerCase().includes(normalizedQuery);

        if (!matchesQuery) {
          return false;
        }

        if (showFreeOnly && model.tier === "premium") {
          return false;
        }

        if (
          showVeniceOnly &&
          !(
            model.provider.displayName?.toLowerCase().includes("venice") ||
            model.provider.url?.toLowerCase().includes("venice")
          )
        ) {
          return false;
        }

        return true;
      });
  }, [debouncedQuery, mode, showFreeOnly, showVeniceOnly]);

  const handleModelChange = async (selectedModelId: TextGenerationModelId) => {
    if (isLoading || modelId === selectedModelId) return;
    setIsLoading(true);

    const oldModelId = modelId;
    setModelId(selectedModelId);

    await updateChatAction(chatId, {
      settings: {
        model: selectedModelId,
      },
    })
      .catch(() => {
        setModelId(oldModelId);
        toast.error("Failed switch to model", {
          description: "Try again or contact support",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="flex flex-col gap-[8px] min-h-[600px]">
      <div className="flex flex-col gap-[8px]">
        <Input
          id="query"
          placeholder="Search models..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="space-y-[12px]">
        {models.map((model) => (
          <ModelCard
            isSelected={model.modelId === modelId}
            onSelect={() =>
              handleModelChange(model.modelId as TextGenerationModelId)
            }
            key={model.modelId}
            model={textGenerationModels[model.modelId]}
            isPinned={isPinned(model.modelId)}
            canPin={canPin()}
            onTogglePin={() => togglePin(model.modelId)}
          />
        ))}
      </div>
    </div>
  );
}

function ModelCard(props: {
  isSelected: boolean;
  onSelect: () => void;
  model: TextGenerationModelConfig;
  isPinned: boolean;
  canPin: boolean;
  onTogglePin: () => void;
}) {
  const { isSelected, onSelect, model, isPinned, canPin, onTogglePin } = props;
  const canTogglePin = isPinned || canPin;

  return (
    <div
      className={cn(
        "group bg-white rounded-[24px] px-[16px] py-[12px] cursor-pointer",
        {
          "border-[3px] border-surface-200": isSelected,
        }
      )}
      onClick={onSelect}
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h5 className="font-onest text-[1.1rem] truncate">
              {model.displayName}
            </h5>
            <p className="text-surface-foreground/60 text-[.8rem] leading-tight italic mt-[-3px]">
              {model.modelId}
            </p>
          </div>

          <div className="flex items-center gap-[8px] shrink-0">
            {model.tier === "premium" && (
              <Badge variant="destructive">
                Premium <FireIcon weight="bold" />
              </Badge>
            )}
            {model.tier === "eco" && (
              <Badge
                variant="default"
                className="bg-emerald-500 text-white hover:bg-emerald-600"
              >
                Eco <Gift02 strokeWidth={2} className="w-4 h-4" />
              </Badge>
            )}

            {canTogglePin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                }}
                className={cn(
                  "flex items-center justify-center w-[32px] h-[32px] rounded-[10px] transition-all duration-150",
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
                    className="w-[16px] h-[16px] text-blue-600"
                  />
                ) : (
                  <PushPinSimpleSlashIcon
                    weight="regular"
                    className="w-[16px] h-[16px] text-surface-foreground/40"
                  />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="text-surface-foreground/60 text-[.85rem] leading-tight mt-[12px]">
        {model.description}
      </p>
      {/* <div className="flex flex-wrap gap-[2px] w-full mt-[6px]">
        {model.perks.map((perk) => (
          <span
            key={perk}
            className="bg-surface rounded-[12px] px-[9px] py-[2px] text-[.8rem] text-surface-foreground/80"
          >
            {perk}
          </span>
        ))}
      </div> */}
    </div>
  );
}
