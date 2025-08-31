"use client";

import * as React from "react";
import { Form } from "@base-ui-components/react/form";
import { Field } from "@base-ui-components/react/field";
import { Switch } from "@base-ui-components/react/switch";
// removed Base UI Select import
import type { PublicChatDetail } from "@/schemas/shared";
import { Button } from "@/components/ui/button";
import { CircleNotchIcon, CoinsIcon } from "@phosphor-icons/react/dist/ssr";
import { updateChatAction } from "@/actions/update-chat.action";
import { useChatMutation } from "@/app/_queries/use-chat.query";
import { chatConfig } from "@/config/shared/chat/chat-models.config";
import type { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";
import { Badge } from "@/components/ui/badge";
// shadcn (Radix) Select components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChatSettingsFormProps {
  chat: PublicChatDetail;
}

// Resolve default model from shared configuration
const DEFAULT_MODEL_ID: TextGenerationModelId | undefined =
  chatConfig.models[0]?.modelId;

// Build model options from shared configuration (include cost for custom rendering)
const MODEL_OPTIONS = chatConfig.models.map((m) => ({
  value: m.modelId,
  label: m.displayName,
  cost: m.cost,
}));

export default function ChatSettingsForm({ chat }: ChatSettingsFormProps) {
  const [saving, setSaving] = React.useState(false);
  // Manage only the minimal UI state needed for enabling/disabling persona fields
  const [personaEnabled, setPersonaEnabled] = React.useState(
    !!chat.settings?.user_persona?.enabled
  );
  const mutateChat = useChatMutation(chat.id);

  // Local state for selected model to work with shadcn (Radix) Select
  const initialModel: string =
    (chat.settings?.model as TextGenerationModelId | undefined) ??
    DEFAULT_MODEL_ID ??
    "";
  const [model, setModel] = React.useState<string>(initialModel);

  const isFreeModelSelected = React.useMemo(() => {
    const selected = MODEL_OPTIONS.find((o) => o.value === model);
    return !!selected && selected.cost === 0;
  }, [model]);

  // Reset the form when the chat changes
  React.useEffect(() => {
    setPersonaEnabled(!!chat.settings?.user_persona?.enabled);
    // reset selected model for new chat
    const nextModel: string =
      (chat.settings?.model as TextGenerationModelId | undefined) ??
      DEFAULT_MODEL_ID ??
      "";
    setModel(nextModel);
  }, [chat.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      const form = e.currentTarget;
      const data = new FormData(form);

      const titleRaw = (data.get("title") as string) ?? "";
      const normalizedTitle = titleRaw.trim();

      const modelRaw = (data.get("model") as string) ?? "";
      // With no explicit "Default" option, ensure we always submit a model id; fall back to first configured model
      const normalizedModel: TextGenerationModelId | undefined =
        (modelRaw as TextGenerationModelId) || DEFAULT_MODEL_ID;

      const personaName = (data.get("persona.name") as string) ?? "";
      const personaCharacter = (data.get("persona.character") as string) ?? "";

      // Handle user_persona updates properly
      let userPersonaUpdate;

      if (personaEnabled) {
        // When enabling, use the form data
        userPersonaUpdate = {
          enabled: true,
          name: personaName,
          character: personaCharacter,
        };
      } else {
        // When disabling, preserve existing data if it exists
        const existingPersona = chat.settings?.user_persona;
        if (existingPersona?.name && existingPersona?.character) {
          // Preserve existing persona data, just disable it
          userPersonaUpdate = {
            enabled: false,
            name: existingPersona.name,
            character: existingPersona.character,
          };
        } else {
          // No existing persona data, don't include user_persona in the update
          userPersonaUpdate = null;
        }
      }

      const settingsUpdate: Record<string, any> = {
        model: normalizedModel,
      };

      // Only include user_persona if we have a valid update
      if (userPersonaUpdate !== null) {
        settingsUpdate.user_persona = userPersonaUpdate;
      }

      const payload = {
        title: normalizedTitle ? normalizedTitle : null,
        settings: settingsUpdate,
      } as const;

      // Optimistic UI update for the chat detail cache
      mutateChat(
        (prev) =>
          prev
            ? {
                ...prev,
                title: payload.title ?? prev.title,
                settings: {
                  ...(prev.settings || {}),
                  model: payload.settings.model,
                  ...(payload.settings.user_persona !== undefined
                    ? { user_persona: payload.settings.user_persona }
                    : {}),
                },
              }
            : (prev as any),
        { revalidate: false }
      );

      await updateChatAction(chat.id, payload as any);
    } catch (err) {
      console.error("Failed to update chat settings", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form key={chat.id} className="space-y-4 relative" onSubmit={handleSubmit}>
      {saving && (
        <div className="absolute inset-0 z-10 rounded-md bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-zinc-700">
            <CircleNotchIcon className="animate-spin" />
            <span>Saving changes…</span>
          </div>
        </div>
      )}
      {/* Chat title */}

      <Field.Root name="title" className="space-y-1">
        <Field.Label className="text-xs font-medium text-zinc-700">
          Title
        </Field.Label>
        <Field.Control
          defaultValue={chat.title ?? ""}
          render={(props) => (
            <input
              {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
              disabled={saving}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              placeholder="Enter a title (optional)"
            />
          )}
        />
        <Field.Description className="text-[11px] text-zinc-500">
          Give your chat a recognizable title.
        </Field.Description>
        <Field.Error className="text-[11px] text-red-600" />
      </Field.Root>

      {/* Mode (read-only) */}
      <div className="space-y-1">
        <div className="text-xs font-medium text-zinc-700">Mode</div>
        <input
          value={chat.mode}
          disabled
          className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
        />
        <p className="text-[11px] text-zinc-500">
          Chat mode cannot be changed.
        </p>
      </div>

      {/* Model - now using shadcn (Radix) Select */}
      <Field.Root name="model" className="space-y-1">
        <Field.Label className="text-xs font-medium text-zinc-700">
          Model
        </Field.Label>
        <div
          className={`w-full ${saving ? "opacity-60 pointer-events-none" : ""}`}
        >
          {/* Hidden input to ensure form submission includes the selected model */}
          <input type="hidden" name="model" value={model} />

          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-full justify-between bg-white">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent className="min-w-[240px] max-h-60">
              {MODEL_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  textValue={option.label}
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="truncate">{option.label}</span>
                    <span className="shrink-0">
                      {option.cost === 0 ? (
                        <Badge variant="secondary">free</Badge>
                      ) : (
                        <Badge variant="secondary">
                          <CoinsIcon /> {option.cost}
                        </Badge>
                      )}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isFreeModelSelected && (
          <p className="text-[11px] text-amber-600 mt-1">
            Free models may be unstable or unavailable at times.
          </p>
        )}
        <Field.Description className="text-[11px] text-zinc-500">
          Choose a model to use for this chat.
        </Field.Description>
        <Field.Error className="text-[11px] text-red-600" />
      </Field.Root>

      {/* User Persona toggle - Replaced with BaseUI Switch */}
      <Field.Root name="persona.enabled" className="space-y-1">
        <Field.Label className="text-xs font-medium text-zinc-700 flex items-center justify-between">
          <span>Use User Persona</span>
          <div className="flex items-center space-x-3">
            <Switch.Root
              name="persona.enabled"
              checked={personaEnabled}
              onCheckedChange={(checked) => setPersonaEnabled(checked)}
              disabled={saving}
              className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-200 data-[checked]:bg-zinc-900 data-[unchecked]:bg-zinc-200"
            >
              <Switch.Thumb className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out data-[checked]:translate-x-4 data-[unchecked]:translate-x-0" />
            </Switch.Root>
          </div>
        </Field.Label>
        <Field.Description className="text-[11px] text-zinc-500">
          Enable to personalize the assistant with your own persona.
        </Field.Description>
      </Field.Root>

      {/* Conditional rendering: Only show persona fields when enabled */}
      {personaEnabled && (
        <>
          {/* Persona Name */}
          <Field.Root
            name="persona.name"
            className="space-y-1"
            validate={(value, formValues) => {
              if (!value || String(value).trim().length === 0) {
                return "Persona name is required when persona is enabled";
              }
              if (value && String(value).length > 64) {
                return "Persona name must be at most 64 characters";
              }
              return null;
            }}
          >
            <Field.Label className="text-xs font-medium text-zinc-700">
              Persona Name
            </Field.Label>
            <Field.Control
              defaultValue={chat.settings?.user_persona?.name ?? ""}
              render={(props) => (
                <input
                  {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
                  disabled={saving}
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                  placeholder="e.g. Alex"
                />
              )}
            />
            <Field.Error className="text-[11px] text-red-600" />
          </Field.Root>

          {/* Persona Character / Details */}
          <Field.Root
            name="persona.character"
            className="space-y-1"
            validate={(value, formValues) => {
              if (!value || String(value).trim().length === 0) {
                return "Persona details are required when persona is enabled";
              }
              if (value && String(value).length > 255) {
                return "Persona details must be at most 255 characters";
              }
              return null;
            }}
          >
            <Field.Label className="text-xs font-medium text-zinc-700">
              Persona Details
            </Field.Label>
            <Field.Control
              defaultValue={chat.settings?.user_persona?.character ?? ""}
              render={(props) => (
                <textarea
                  {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                  rows={4}
                  disabled={saving}
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                  placeholder="Describe the persona's tone, background, and behavior"
                />
              )}
            />
            <Field.Error className="text-[11px] text-red-600" />
          </Field.Root>
        </>
      )}

      {/* Removed Additional Instructions field */}

      <div className="pt-2 flex gap-2 justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <CircleNotchIcon className="animate-spin" /> Saving…
            </span>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </Form>
  );
}
