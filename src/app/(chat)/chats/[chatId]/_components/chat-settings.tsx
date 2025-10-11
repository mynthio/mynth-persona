"use client";

import { Dialog } from "@base-ui-components/react/dialog";
import { useSettingsNavigation } from "../_hooks/use-settings-navigation.hook";
import { Field, Form } from "@/components/mynth-ui/base/form";
import { TextareaAutosize } from "@/components/mynth-ui/base/textarea";
import { useSidebar } from "@/components/ui/sidebar";

import {
  ArrowLeftIcon,
  CheckIcon,
  FeatherIcon,
  FireIcon,
  GearSixIcon,
  RobotIcon,
  UserSquareIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Input } from "@/components/mynth-ui/base/input";
import { Button } from "@/components/mynth-ui/base/button";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { ButtonGroup } from "@/components/mynth-ui/base/button-group";
import { updateChatAction } from "@/actions/update-chat.action";
import { useChatMain } from "../_contexts/chat-main.context";
import { CreateChatButton } from "@/components/create-chat-button";
import { DeleteChat } from "./delete-chat";
import { NSFWGuidelines } from "@/schemas/backend/chats/chat.schema";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectPositioner,
  SelectContent,
  SelectItem,
} from "@/components/mynth-ui/base/select";
import { ScrollArea } from "@/components/mynth-ui/base/scroll-area";
import { useDebounce } from "@uidotdev/usehooks";
import { chatConfig } from "@/config/shared/chat/chat-models.config";
import {
  TextGenerationModelConfig,
  TextGenerationModelId,
  textGenerationModels,
} from "@/config/shared/models/text-generation-models.config";
import { useToast } from "@/components/ui/toast";
import { filter, map, pipe, toArray } from "@fxts/core";
import { Label } from "@/components/mynth-ui/base/label";

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
    <Dialog.Root
      defaultOpen={props.defaultOpen}
      open={areSettingsOpen}
      onOpenChange={closeSettings}
      modal={false}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-overlay bg-background/20 backdrop-blur-[1px] transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[starting-style]:backdrop-blur-none dark:opacity-70" />
        <Dialog.Popup
          className="fixed z-dialog left-1/2 -mt-8 w-[800px] max-w-[calc(100vw-3rem)] h-[520px] max-h-[calc(100vh-3rem)]
            -translate-x-1/2 -translate-y-1/2 
            outline-[3px] outline-background/5
            top-[calc(50%+1.25rem*var(--nested-dialogs))] scale-[calc(1-0.03*var(--nested-dialogs))] data-[nested-dialog-open]:grayscale-100 data-[nested-dialog-open]:after:absolute data-[nested-dialog-open]:after:inset-0 data-[nested-dialog-open]:after:rounded-[inherit] data-[nested-dialog-open]:after:bg-background/10 data-[nested-dialog-open]:after:backdrop-blur-[1px] 
            rounded-[32px] bg-surface p-[12px] px-[24px] text-surface-foreground transition-all duration-250 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0
            flex flex-col 
            "
        >
          <div className="flex shrink-0 justify-between px-[12px] mb-[12px] mt-[6px]">
            <Dialog.Title className="font-onest text-[1.2rem] font-[600] py-[12px]">
              Settings
            </Dialog.Title>
            <Dialog.Close className="size-[36px] flex items-center justify-center transition-colors duration-150 hover:bg-surface-100 rounded-[12px]">
              <XIcon />
            </Dialog.Close>
          </div>

          <div className="flex gap-[18px] h-full overflow-hidden">
            <ChatSettingsMenu />
            <ScrollArea className="h-full w-full">
              <ChatSettingsContent />
              <div className="h-[24px]"></div>
            </ScrollArea>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type ChatSettingsMobileProps = {
  defaultOpen: boolean;
};

function ChatSettingsMobile(props: ChatSettingsMobileProps) {
  const { areSettingsOpen, closeSettings, current, navigateSettings } =
    useSettingsNavigation();

  return (
    <Dialog.Root
      defaultOpen={props.defaultOpen}
      open={areSettingsOpen}
      onOpenChange={closeSettings}
      modal={false}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-overlay bg-background/20 backdrop-blur-[1px] transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[starting-style]:backdrop-blur-none dark:opacity-70" />
        <Dialog.Popup
          className="fixed z-dialog left-0 right-0 bottom-0 w-full max-w-[100vw] h-auto min-h-auto max-h-[70vh]
            rounded-t-[24px] bg-surface text-surface-foreground transition-all duration-250 overflow-hidden
            scale-[calc(1-0.03*var(--nested-dialogs))] data-[nested-dialog-open]:after:absolute data-[nested-dialog-open]:after:inset-0 data-[nested-dialog-open]:after:rounded-[inherit] data-[nested-dialog-open]:after:bg-background/10 data-[nested-dialog-open]:after:backdrop-blur-[1px] 
            data-[ending-style]:translate-y-[8%] data-[ending-style]:opacity-0 data-[starting-style]:translate-y-[8%] data-[starting-style]:opacity-0"
        >
          <Dialog.Title className="sr-only">Chat Settings</Dialog.Title>

          {current === "_" ? (
            <div className="mt-[4px] min-h-[240px] px-[8px]">
              <ChatSettingsMenu />
            </div>
          ) : (
            <div className="relative w-full h-[70vh] min-h-0">
              <div className="absolute top-[16px] left-[12px] z-10">
                <Button
                  onClick={() => navigateSettings("_")}
                  className="bg-surface-100/50 backdrop-blur-[8px]"
                >
                  <ArrowLeftIcon />
                  Settings Menu
                </Button>
              </div>
              <ScrollArea className="h-full w-full">
                <div className="h-[80px]" />
                <div className="px-[24px]">
                  <ChatSettingsContent />
                </div>
                <div className="h-[200px]" />
              </ScrollArea>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
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

function ChatSettingsMenu() {
  const { areSettingsOpen, closeSettings, navigateSettings, current } =
    useSettingsNavigation();

  return (
    <div className="flex flex-col justify-start gap-[1px] shrink-0 grow-0 md:w-[220px] px-[24px] md:px-[0px] py-[24px] md:py-0">
      <MenuButton
        onClick={() => navigateSettings("settings")}
        isActive={current === "settings"}
      >
        <GearSixIcon />
        Chat
      </MenuButton>
      <MenuButton
        onClick={() => navigateSettings("model")}
        isActive={current === "model"}
      >
        <RobotIcon />
        Model
      </MenuButton>
      <MenuButton
        onClick={() => navigateSettings("user")}
        isActive={current === "user"}
      >
        <UserSquareIcon />
        My persona
      </MenuButton>
      <MenuButton
        onClick={() => navigateSettings("scenario")}
        isActive={current === "scenario"}
      >
        <FeatherIcon />
        Scenario
      </MenuButton>

      <MenuButton className="text-red-500 md:hidden" onClick={closeSettings}>
        <XIcon /> Close
      </MenuButton>
    </div>
  );
}

function MenuButton(props: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex justify-start items-center gap-[6px] h-[60px] md:h-[46px] w-full px-[12px] text-surface-foreground hover:bg-surface-100 rounded-[18px] md:rounded-[16px] transition-all duration-100",
        props.isActive && "bg-surface-100/50",
        props.className
      )}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

function ChatSettingsHome() {
  const { personas } = useChatPersonas();
  const persona = personas[0];
  const { chatId, settings, setSettings, mode } = useChatMain();

  const [savingNsFw, setSavingNsFw] = useState(false);

  // Dynamic items for NSFW guidelines
  const NSFW_DEFAULT_VALUE = "nsfw_default";
  const NSFW_ITEMS = useMemo(
    () => [
      { label: "Disabled", value: NSFW_DEFAULT_VALUE },
      { label: "SFW (PG‑13)", value: "nsfw_prohibited" },
      { label: "Allow Suggestive", value: "nsfw_allowed_suggestive" },
      { label: "Allow Explicit", value: "nsfw_explicit_natural" },
      { label: "Force Explicit", value: "nsfw_explicit_driven" },
    ],
    []
  );

  const handleNsFwChange = async (value: NSFWGuidelines | null) => {
    if (savingNsFw) return;
    setSavingNsFw(true);
    try {
      await updateChatAction(chatId, {
        settings: { nsfw_guidelines: value },
      });
      setSettings({ ...(settings ?? {}), nsfw_guidelines: value });
    } finally {
      setSavingNsFw(false);
    }
  };

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
          <p className="text-[0.9rem] text-surface-foreground">
            NSFW Guidelines
          </p>
          <p className="text-[0.75rem] text-surface-foreground/80">
            Use it to guide model on NSFW content.
            <br />
            Keep in mind that some models have builtin censorship and this
            setting may not work corectly.
          </p>
        </div>
        <Select
          disabled={savingNsFw}
          items={NSFW_ITEMS}
          value={settings.nsfw_guidelines ?? NSFW_DEFAULT_VALUE}
          onValueChange={(val) =>
            handleNsFwChange(
              val === NSFW_DEFAULT_VALUE ? null : (val as NSFWGuidelines)
            )
          }
        >
          <SelectTrigger
            size="sm"
            aria-disabled={savingNsFw}
            className="shrink-0"
            render={<Button />}
            nativeButton
          >
            <SelectValue />
          </SelectTrigger>
          <SelectPositioner>
            <SelectContent>
              {NSFW_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectPositioner>
        </Select>
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
            This action can't be undone. All messages will be removed.
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
  const [isUpdating, setIsUpdating] = useState(false);

  const isStoryMode = mode === "story";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isUpdating || isStoryMode) return;
    setIsUpdating(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const character = formData.get("character") as string;

    await updateChatAction(chatId, {
      settings: {
        user_persona: {
          enabled: true,
          name,
          character,
        },
      },
    })
      .then(() => {
        setSettings({
          ...settings,
          user_persona: {
            enabled: true,
            name,
            character,
          },
        });
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  return (
    <Form
      onSubmit={handleSubmit}
      className="space-y-[24px]"
      aria-disabled={isUpdating || isStoryMode}
    >
      {isStoryMode && (
        <div className="rounded-[12px] bg-surface-100 p-[12px] text-[0.85rem] text-surface-foreground">
          Story mode doesn’t support My persona. Use your prompt to guide the
          model’s behavior.
        </div>
      )}
      <Field.Root>
        <Field.Label>Name</Field.Label>
        <Input
          name="name"
          defaultValue={settings.user_persona?.name ?? ""}
          placeholder="John"
          autoComplete="off"
          data-form-type="other"
          disabled={isStoryMode}
        />
        <Field.Description>Your character's name.</Field.Description>
      </Field.Root>

      <Field.Root>
        <Field.Label>Character Description</Field.Label>
        <TextareaAutosize
          name="character"
          minRows={3}
          placeholder="Describe your character..."
          defaultValue={settings.user_persona?.character ?? ""}
          autoComplete="off"
          data-form-type="other"
          disabled={isStoryMode}
        />
        <Field.Description>
          A description of your character. Personality, relations and
          informations {persona.name} should know about you.
        </Field.Description>
      </Field.Root>

      <ButtonGroup className="justify-end">
        <Button
          color="primary"
          type="submit"
          disabled={isUpdating || isStoryMode}
        >
          Save
        </Button>
      </ButtonGroup>
    </Form>
  );
}

function ChatSettingsScenario() {
  const { chatId, settings, setSettings, mode } = useChatMain();
  const [isUpdating, setIsUpdating] = useState(false);

  const isStoryMode = mode === "story";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isUpdating || isStoryMode) return;
    setIsUpdating(true);

    const formData = new FormData(e.currentTarget);
    const scenario = (formData.get("scenario") as string) ?? "";

    await updateChatAction(chatId, {
      settings: {
        scenario: {
          scenario,
        },
      },
    })
      .then(() => {
        setSettings({
          ...settings,
          scenario: {
            scenario,
          },
        });
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  return (
    <Form
      onSubmit={handleSubmit}
      className="space-y-[24px]"
      aria-disabled={isUpdating || isStoryMode}
    >
      {isStoryMode && (
        <div className="rounded-[12px] bg-surface-100 p-[12px] text-[0.85rem] text-surface-foreground">
          Story mode doesn’t support Scenario. Use your prompt to guide the
          model’s behavior and context.
        </div>
      )}
      <Field.Root>
        <Field.Label>Scenario</Field.Label>
        <TextareaAutosize
          name="scenario"
          minRows={3}
          placeholder="Custom scenario for chat"
          defaultValue={settings.scenario?.scenario ?? ""}
          autoComplete="off"
          data-form-type="other"
          disabled={isStoryMode}
        />
        <Field.Description>
          Scenario will be included inside chat instructions. It will always be
          used to set the context of the session.
        </Field.Description>
      </Field.Root>

      <ButtonGroup className="justify-end">
        <Button
          color="primary"
          type="submit"
          disabled={isUpdating || isStoryMode}
        >
          Save
        </Button>
      </ButtonGroup>
    </Form>
  );
}

function ChatSettingsModel() {
  const { chatId, modelId, setModelId, mode } = useChatMain();
  const { add } = useToast();
  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounce(query, 300);
  const [isLoading, setIsLoading] = useState(false);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [showVeniceOnly, setShowVeniceOnly] = useState(false);

  const models = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    return pipe(
      chatConfig.models,
      map(({ modelId }) => textGenerationModels[modelId]),
      filter((model): model is TextGenerationModelConfig =>
        Boolean(model && model.enabled)
      ),
      filter((model) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          model.displayName.toLowerCase().includes(normalizedQuery) ||
          model.modelId.toLowerCase().includes(normalizedQuery) ||
          model.perks.join(" ").toLowerCase().includes(normalizedQuery);

        if (!matchesQuery) {
          return false;
        }

        if (showFreeOnly && model.cost[mode] !== 0) {
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
      }),
      toArray
    );
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
        add({
          title: "Failed switch to model",
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
          name="query"
          placeholder="Search models..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-white rounded-[18px] border-0"
        />

        <ButtonGroup>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={showFreeOnly}
            onClick={() => setShowFreeOnly((prev) => !prev)}
          >
            {showFreeOnly ? <CheckIcon /> : null}Free models
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={showVeniceOnly}
            onClick={() => setShowVeniceOnly((prev) => !prev)}
          >
            {showVeniceOnly ? <CheckIcon /> : null}Venice models
          </Button>
        </ButtonGroup>
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
}) {
  const { isSelected, onSelect, model } = props;

  return (
    <div
      className={cn(
        "bg-white rounded-[24px] px-[16px] py-[12px] cursor-pointer",
        {
          "border-[3px] border-surface-200": isSelected,
        }
      )}
      onClick={onSelect}
    >
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h5 className="font-onest text-[1.1rem] truncate">
              {model.displayName}
            </h5>
            <p className="text-surface-foreground/60 text-[.8rem] leading-tight italic mt-[-3px]">
              {model.modelId}
            </p>
          </div>

          <Label color={model.cost.roleplay === 0 ? "green" : "red"} size="sm">
            {model.cost.roleplay === 0 ? (
              "free"
            ) : (
              <>
                {model.cost.roleplay} <FireIcon weight="bold" />
              </>
            )}
          </Label>
        </div>
      </div>
      <p className="text-surface-foreground/60 text-[.85rem] leading-tight mt-[12px]">
        {model.description}
      </p>
      <div className="flex flex-wrap gap-[2px] w-full mt-[6px]">
        {model.perks.map((perk) => (
          <span
            key={perk}
            className="bg-surface rounded-[12px] px-[9px] py-[2px] text-[.8rem] text-surface-foreground/80"
          >
            {perk}
          </span>
        ))}
      </div>
    </div>
  );
}
