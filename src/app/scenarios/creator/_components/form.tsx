"use client";

import { useForm } from "@tanstack/react-form";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { textGenerationModels } from "@/config/shared/models/text-generation-models.config";
import {
  PersonaSelector,
  PersonaSelectorTrigger,
  PersonaSelectorValue,
  Persona,
} from "@/components/persona-selector";
import { getImageUrl } from "@/lib/utils";
import { Info, StarIcon, TrashIcon, UserIcon } from "@phosphor-icons/react/dist/ssr";
import { type StartingMessage } from "@/schemas/shared";
import { createScenarioAction } from "@/actions/scenarios/create-scenario.action";

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-[18px]">
        <span className="text-[0.85rem] font-mono shrink-0 truncate text-surface-foreground/50 uppercase">
          {title}
        </span>
        <hr className="border-0 bg-surface-foreground/5 h-[2px] w-full" />
      </div>

      <div className="mt-[24px] flex flex-col gap-[12px]">{children}</div>
    </div>
  );
}

export default function ScenarioCreatorForm() {
  const [selectedPersonas, setSelectedPersonas] = useState<Array<Persona>>([]);
  const [primaryPersonaId, setPrimaryPersonaId] = useState<string | null>(null);
  const [startingMessages, setStartingMessages] = useState<StartingMessage[]>([
    { role: "persona", text: "" },
  ]);
  const [suggestedModels, setSuggestedModels] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string>("");
  const router = useRouter();

  const formSchema = z.object({
    title: z.string(),
    description: z.string(),
    content: z
      .string()
      .min(
        50,
        "Scenario content must be at least 50 characters (approximately 10 words)"
      )
      .max(100000, "Scenario content is too long (maximum 100,000 characters)"),
    suggested_user_name: z.string(),
    user_persona_text: z.union([
      z.literal(""),
      z
        .string()
        .min(
          25,
          "User character must be at least 25 characters (approximately 5 words)"
        )
        .max(50000, "User character is too long (maximum 50,000 characters)"),
    ]),
    style_guidelines: z.union([
      z.literal(""),
      z
        .string()
        .max(
          50000,
          "Style guidelines are too long (maximum 50,000 characters)"
        ),
    ]),
  });

  const scenarioTextareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTemplate = (template: string, currentValue: string) => {
    const textarea = scenarioTextareaRef.current;
    if (!textarea) return currentValue;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    let textToInsert = template;

    if (start > 0) {
      const previousChar = currentValue[start - 1];
      if (previousChar !== " " && previousChar !== "\n") {
        textToInsert = " " + textToInsert;
      }
    }

    if (end < currentValue.length) {
      const nextChar = currentValue[end];
      if (nextChar !== " " && nextChar !== "\n") {
        textToInsert = textToInsert + " ";
      }
    }

    const newValue =
      currentValue.substring(0, start) +
      textToInsert +
      currentValue.substring(end);

    const newCursorPosition = start + textToInsert.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);

    return newValue;
  };

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      content: "",
      suggested_user_name: "",
      user_persona_text: "",
      style_guidelines: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError("");

      try {
        // Filter out empty starting messages
        const nonEmptyMessages = startingMessages.filter(
          (msg) => msg.text.trim() !== ""
        );

        // Transform personas to required format
        const personas = selectedPersonas.map((persona) => ({
          id: persona.id,
          roleType:
            persona.id === primaryPersonaId
              ? ("primary" as const)
              : ("secondary" as const),
        }));

        // Transform starting messages to required format
        const messages = nonEmptyMessages.map((msg) => ({
          role:
            msg.role === "persona" ? ("assistant" as const) : ("user" as const),
          text: msg.text,
        }));

        // Build the payload for the server action
        const payload = {
          title: value.title,
          description: value.description,
          content: value.content,
          suggested_user_name: value.suggested_user_name,
          user_persona_text: value.user_persona_text,
          style_guidelines: value.style_guidelines,
          personas,
          startingMessages: messages,
          suggestedAiModels: suggestedModels,
        };

        // Call server action
        const result = await createScenarioAction(payload);

        if (result.success) {
          router.push(`/scenarios/${result.scenarioId}`);
          return;
        }

        setSubmitError("Unable to create scenario");
      } catch (error) {
        // Handle server-side errors
        if (error instanceof Error) {
          setSubmitError(error.message);
        } else {
          setSubmitError("An unexpected error occurred");
        }
      }
    },
  });

  return (
    <form
      className="space-y-[48px]"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <Alert>
        <Info className="size-4" />
        <AlertTitle>Template Variables</AlertTitle>
        <AlertDescription>
          <p>
            You can use the following template variables in any field of your
            scenario:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">
                {"{"}
                {"{"}persona.1.name{"}"}
                {"}"}
              </code>{" "}
              - References the persona name
            </li>
            <li>
              <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">
                {"{"}
                {"{"}user.name{"}"}
                {"}"}
              </code>{" "}
              - References the user name
            </li>
          </ul>
          <p className="text-xs mt-2">
            Note: We currently support single persona chats, but group chats are
            planned soon. That is why we use{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded font-mono">
              persona.1
            </code>{" "}
            format.
          </p>
        </AlertDescription>
      </Alert>

      <FieldGroup>
        <FormSection title="Scenario">
          <form.Field name="content">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="content">Scenario Content</FieldLabel>
                  <Textarea
                    id="content"
                    ref={scenarioTextareaRef}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="You find yourself in a mysterious forest..."
                    className="min-h-[120px]"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  <ButtonGroup className="mt-[12px]">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() =>
                        field.handleChange(
                          insertTemplate(
                            "{{persona.1.name}}",
                            field.state.value
                          )
                        )
                      }
                    >
                      Insert Persona name
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() =>
                        field.handleChange(
                          insertTemplate("{{user.name}}", field.state.value)
                        )
                      }
                    >
                      Insert User name
                    </Button>
                  </ButtonGroup>
                  <FieldDescription>
                    The main text that sets the scene and provides context for
                    your scenario
                  </FieldDescription>
                </Field>
              );
            }}
          </form.Field>
        </FormSection>

        <FormSection title="Personas">
          <Field>
            <FieldLabel>Personas</FieldLabel>
            <PersonaSelector
              value={selectedPersonas}
              onChange={(personas) => {
                setSelectedPersonas(personas);
                if (
                  primaryPersonaId &&
                  !personas.some((p) => p.id === primaryPersonaId)
                ) {
                  setPrimaryPersonaId(null);
                }
              }}
              multiple
            >
              <div className="space-y-[12px] w-full">
                <div className="flex flex-col gap-[2px]">
                  <PersonaSelectorValue>
                    {(persona, removePersona) => {
                      const isPrimary = persona.id === primaryPersonaId;
                      return (
                        <div
                          key={persona.id}
                          className="w-full flex items-center gap-[9px] bg-white border-2 border-surface-100 rounded-[18px] p-[6px]"
                        >
                          <div className="shrink-0 size-[32px] rounded-[12px] overflow-hidden bg-surface-100 flex items-center justify-center">
                            {persona.profileImageIdMedia ? (
                              <img
                                src={getImageUrl(
                                  persona.profileImageIdMedia,
                                  "thumb"
                                )}
                                alt={
                                  persona.publicName ||
                                  persona.title ||
                                  persona.id
                                }
                                className="object-cover size-full"
                              />
                            ) : (
                              <UserIcon className="text-surface-foreground/50 size-[14px]" />
                            )}
                          </div>
                          <span className="text-sm font-medium truncate w-full">
                            {persona.publicName || persona.title}
                          </span>
                          <ButtonGroup className="shrink-0">
                            <Button
                              size="sm"
                              variant={isPrimary ? "default" : "outline"}
                              onClick={() =>
                                setPrimaryPersonaId(
                                  isPrimary ? null : persona.id
                                )
                              }
                            >
                              <StarIcon
                                weight={isPrimary ? "fill" : "regular"}
                              />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={removePersona}
                            >
                              <TrashIcon />
                            </Button>
                          </ButtonGroup>
                        </div>
                      );
                    }}
                  </PersonaSelectorValue>
                </div>

                <div className="flex items-center justify-center w-full">
                  <PersonaSelectorTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      Select personas
                    </Button>
                  </PersonaSelectorTrigger>
                </div>
              </div>
            </PersonaSelector>
            <FieldDescription>
              Scenarios can be universal, allowing users to choose any persona
              they like. However, if you design a scenario for a specific
              persona, you can use the star to mark it—this lets users know
              which persona it was made for.
            </FieldDescription>
          </Field>
        </FormSection>

        <FormSection title="User">
          <form.Field name="suggested_user_name">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="suggested_user_name">Name</FieldLabel>
                  <Input
                    id="suggested_user_name"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Character name (e.g., 'Alex', 'The Detective')"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  <FieldDescription>
                    The default name for the user in this scenario
                  </FieldDescription>
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="user_persona_text">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="user_persona_text">Character</FieldLabel>
                  <Textarea
                    id="user_persona_text"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="You are a brave adventurer who has traveled far..."
                    className="min-h-[100px]"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  <FieldDescription>
                    Define who the user is in this scenario. Use{" "}
                    {"{{user.name}}"} for the name to make it dynamic—it will be
                    replaced with the user name.
                  </FieldDescription>
                </Field>
              );
            }}
          </form.Field>
        </FormSection>

        <FormSection title="Advanced">
          <Field>
            <FieldLabel>Starting Messages</FieldLabel>
            <FieldDescription className="mb-[12px]">
              Optional. An initial conversation to set the tone. This helps the
              AI understand the format and style of messages, and gives both the
              AI and user a starting point.
            </FieldDescription>

            <div className="space-y-[12px] w-full">
              {startingMessages.map((message, index) => (
                <div key={index} className="space-y-[4px]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {message.role}
                    </span>
                    {startingMessages.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() =>
                          setStartingMessages(
                            startingMessages.filter((_, i) => i !== index)
                          )
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={message.text}
                    onChange={(e) =>
                      setStartingMessages((prev) => {
                        const updated = [...prev];
                        updated[index] = {
                          ...updated[index],
                          text: e.target.value,
                        };
                        return updated;
                      })
                    }
                    placeholder={
                      message.role === "persona"
                        ? "Hello! Welcome to the adventure..."
                        : "I'm ready to begin."
                    }
                    className="min-h-[80px]"
                  />
                </div>
              ))}

              <ButtonGroup>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() =>
                    setStartingMessages((prev) => [
                      ...prev,
                      { role: "persona", text: "" },
                    ])
                  }
                >
                  Add Persona Message
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() =>
                    setStartingMessages((prev) => [
                      ...prev,
                      { role: "user", text: "" },
                    ])
                  }
                >
                  Add User Message
                </Button>
              </ButtonGroup>
            </div>
          </Field>

          <form.Field name="style_guidelines">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="style_guidelines">
                    Style Guidelines
                  </FieldLabel>
                  <Textarea
                    id="style_guidelines"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Write actions between asterisks (e.g., *jump*), write only single action per response, use emojis, etc."
                    className="min-h-[100px]"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  <FieldDescription>
                    Optional. Technical instructions for AI behavior and
                    response style. Use this to specify message formats, writing
                    conventions, or provide style examples. Keep it technical—
                    this should not include scenario content.
                  </FieldDescription>
                </Field>
              );
            }}
          </form.Field>

          <Field>
            <FieldLabel>Suggested AI Models (Optional)</FieldLabel>
            <MultiSelect
              values={suggestedModels}
              onValuesChange={(values) => setSuggestedModels(values)}
            >
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue placeholder="Select models..." />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectGroup>
                  {Object.entries(textGenerationModels)
                    .filter(([, config]) => config.enabled)
                    .map(([id, config]) => (
                      <MultiSelectItem key={id} value={id}>
                        {config.displayName}
                      </MultiSelectItem>
                    ))}
                </MultiSelectGroup>
              </MultiSelectContent>
            </MultiSelect>
            <FieldDescription>
              Select recommended AI models for this scenario. This is
              optional—users can still choose any model they want. It is a
              helpful hint about which models work well for the scenario style
              and vibe.
            </FieldDescription>
          </Field>
        </FormSection>

        <FormSection title="Details">
          <form.Field name="title">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="title">Title</FieldLabel>
                  <Input
                    id="title"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Adventure of..."
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  <FieldDescription>
                    A short, memorable title for your scenario
                  </FieldDescription>
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="description">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    id="description"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="A thrilling adventure where..."
                    className="min-h-[60px]"
                  />
                  <FieldDescription>
                    A catchy summary of your scenario. Keep it brief—1 to 3
                    sentences.
                  </FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </FormSection>

        <div className="pt-[24px] space-y-[12px]">
          {submitError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-[12px] p-[12px]">
              {submitError}
            </div>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={form.state.isSubmitting}
          >
            {form.state.isSubmitting ? "Creating..." : "Create Scenario"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
