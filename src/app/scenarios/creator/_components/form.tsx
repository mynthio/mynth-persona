"use client";

import { Field } from "@/components/mynth-ui/base/field";
import { Form } from "@/components/mynth-ui/base/form";
import { Input } from "@/components/mynth-ui/base/input";
import { TextareaAutosize } from "@/components/mynth-ui/base/textarea";
import { Button } from "@/components/mynth-ui/base/button";
import { ButtonGroup } from "@/components/mynth-ui/base/button-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectPositioner,
  SelectTrigger,
  SelectValue,
} from "@/components/mynth-ui/base/select";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { textGenerationModels } from "@/config/shared/models/text-generation-models.config";
import {
  PersonaSelector,
  PersonaSelectorTrigger,
  PersonaSelectorValue,
  Persona,
} from "@/components/persona-selector";
import { getImageUrl } from "@/lib/utils";
import { StarIcon, TrashIcon, UserIcon } from "@phosphor-icons/react/dist/ssr";
import { z } from "zod";
import {
  scenarioFormFieldsSchema,
  startingMessagesSchema,
  type StartingMessage,
} from "@/schemas/shared";
import { createScenarioAction } from "@/actions/scenarios/create-scenario.action";

// Get valid model IDs for validation
const validModelIds = Object.keys(textGenerationModels);

// Validation for suggested models (not in FormData)
const suggestedModelsSchema = z.array(
  z.enum(validModelIds as [string, ...string[]])
);

function ScenarioContentField() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTemplate = (template: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;

    let textToInsert = template;

    // Add leading space if needed
    if (start > 0) {
      const previousChar = currentValue[start - 1];
      // If previous character is not a space or newline, add a leading space
      if (previousChar !== " " && previousChar !== "\n") {
        textToInsert = " " + textToInsert;
      }
    }

    // Add trailing space if needed
    if (end < currentValue.length) {
      const nextChar = currentValue[end];
      // If next character is not a space or newline, add a trailing space
      if (nextChar !== " " && nextChar !== "\n") {
        textToInsert = textToInsert + " ";
      }
    }

    // Insert the template at cursor position
    const newValue =
      currentValue.substring(0, start) +
      textToInsert +
      currentValue.substring(end);

    // Update the textarea value
    textarea.value = newValue;

    // Set cursor position after the inserted text
    const newCursorPosition = start + textToInsert.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  return (
    <Field.Root name="content">
      <Field.Label>Scenario Content</Field.Label>
      <TextareaAutosize
        id="content"
        ref={textareaRef}
        name="content"
        minRows={4}
        maxRows={10}
        placeholder="You find yourself in a mysterious forest..."
      />
      <Field.Error />
      <ButtonGroup className="mt-[12px]">
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => insertTemplate("{{persona.1.name}}")}
        >
          Insert Persona name
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => insertTemplate("{{user.name}}")}
        >
          Insert User name
        </Button>
      </ButtonGroup>
      <Field.Description>
        The main text that sets the scene and provides context for your scenario
      </Field.Description>
    </Field.Root>
  );
}

function PersonaSelectorField({
  selectedPersonas,
  setSelectedPersonas,
  primaryPersonaId,
  setPrimaryPersonaId,
}: {
  selectedPersonas: Persona[];
  setSelectedPersonas: (personas: Persona[]) => void;
  primaryPersonaId: string | null;
  setPrimaryPersonaId: (id: string | null) => void;
}) {
  const handlePersonasChange = (personas: Persona[]) => {
    setSelectedPersonas(personas);
    // Clear primary if the primary persona was removed
    if (primaryPersonaId && !personas.some((p) => p.id === primaryPersonaId)) {
      setPrimaryPersonaId(null);
    }
  };

  const togglePrimaryPersona = (personaId: string) => {
    setPrimaryPersonaId(primaryPersonaId === personaId ? null : personaId);
  };

  return (
    <Field.Root>
      <Field.Label>Personas</Field.Label>
      <PersonaSelector
        value={selectedPersonas}
        onChange={handlePersonasChange}
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
                    className="w-full flex items-center gap-[9px] bg-white border-[2px] border-surface-100 rounded-[18px] p-[6px]"
                  >
                    <div className="shrink-0 size-[32px] rounded-[12px] overflow-hidden bg-surface-100 flex items-center justify-center">
                      {persona.profileImageId ? (
                        <img
                          src={getImageUrl(persona.profileImageId, "thumb")}
                          alt={
                            persona.publicName || persona.title || persona.id
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
                        onClick={() => togglePrimaryPersona(persona.id)}
                      >
                        <StarIcon weight={isPrimary ? "fill" : "regular"} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        color="red"
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
      <Field.Description>
        Scenarios can be universal, allowing users to choose any persona they
        like. However, if you design a scenario for a specific persona, you can
        use the star to mark it—this lets users know which persona it was made
        for.
      </Field.Description>
    </Field.Root>
  );
}

function TitleField() {
  return (
    <Field.Root name="title">
      <Field.Label>Title</Field.Label>
      <Input name="title" placeholder="Adventure of..." />
      <Field.Error />
      <Field.Description>
        A short, memorable title for your scenario
      </Field.Description>
    </Field.Root>
  );
}

function DescriptionField() {
  return (
    <Field.Root name="description">
      <Field.Label>Description</Field.Label>
      <TextareaAutosize
        minRows={1}
        maxRows={2}
        name="description"
        placeholder="A thrilling adventure where..."
      />
      <Field.Description>
        A catchy summary of your scenario. Keep it brief—1 to 3 sentences.
      </Field.Description>
      <Field.Error />
    </Field.Root>
  );
}

function UserPersonaField() {
  return (
    <>
      <Field.Root name="suggested_user_name">
        <Field.Label>Name</Field.Label>
        <Input
          name="suggested_user_name"
          placeholder="Character name (e.g., 'Alex', 'The Detective')"
        />
        <Field.Error />
        <Field.Description>
          The default name for the user in this scenario
        </Field.Description>
      </Field.Root>
      <Field.Root name="user_persona_text">
        <Field.Label>Character</Field.Label>
        <TextareaAutosize
          name="user_persona_text"
          minRows={3}
          maxRows={6}
          placeholder="You are a brave adventurer who has traveled far..."
        />
        <Field.Error />
        <Field.Description>
          Define who the user is in this scenario. Use {"{{user.name}}"} for the
          name to make it dynamic—it will be replaced with the user's name.
        </Field.Description>
      </Field.Root>
    </>
  );
}

function StartingMessagesField({
  startingMessages,
  setStartingMessages,
  error,
}: {
  startingMessages: StartingMessage[];
  setStartingMessages: (messages: StartingMessage[]) => void;
  error?: string;
}) {
  const addMessage = (role: "user" | "persona") => {
    setStartingMessages([...startingMessages, { role, text: "" }]);
  };

  const updateMessage = (index: number, content: string) => {
    const updated = [...startingMessages];
    updated[index].text = content;
    setStartingMessages(updated);
  };

  const removeMessage = (index: number) => {
    setStartingMessages(startingMessages.filter((_, i) => i !== index));
  };

  return (
    <Field.Root name="startingMessages">
      <Field.Label>Starting Messages</Field.Label>
      <Field.Description className="mb-[12px]">
        Optional. An initial conversation to set the tone. This helps the AI
        understand the format and style of messages, and gives both the AI and
        user a starting point.
      </Field.Description>

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
                  color="red"
                  type="button"
                  onClick={() => removeMessage(index)}
                >
                  Remove
                </Button>
              )}
            </div>
            <TextareaAutosize
              minRows={2}
              maxRows={4}
              value={message.text}
              onChange={(e) => updateMessage(index, e.target.value)}
              placeholder={
                message.role === "persona"
                  ? "Hello! Welcome to the adventure..."
                  : "I'm ready to begin."
              }
            />
          </div>
        ))}

        <ButtonGroup>
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => addMessage("persona")}
          >
            Add Persona Message
          </Button>
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => addMessage("user")}
          >
            Add User Message
          </Button>
        </ButtonGroup>
      </div>

      {error && <Field.Error>{error}</Field.Error>}
    </Field.Root>
  );
}

function StyleGuidelinesField() {
  return (
    <Field.Root name="style_guidelines">
      <Field.Label>Style Guidelines</Field.Label>
      <TextareaAutosize
        name="style_guidelines"
        minRows={3}
        maxRows={6}
        placeholder="Write actions between asterisks (e.g., *jump*), write only single action per response, use emojis, etc."
      />
      <Field.Error />
      <Field.Description>
        Optional. Technical instructions for AI behavior and response style. Use
        this to specify message formats, writing conventions, or provide style
        examples. Keep it technical—this shouldn't include scenario content.
      </Field.Description>
    </Field.Root>
  );
}

function ModelSelectorField({
  suggestedModels,
  setSuggestedModels,
  error,
}: {
  suggestedModels: string[];
  setSuggestedModels: (models: string[]) => void;
  error?: string;
}) {
  // Get enabled models
  const availableModels = Object.entries(textGenerationModels)
    .filter(([, config]) => config.enabled)
    .map(([id, config]) => ({
      id,
      displayName: config.displayName,
    }));

  return (
    <Field.Root name="suggestedModels">
      <Field.Label>Suggested AI Models (Optional)</Field.Label>
      <Select
        multiple
        value={suggestedModels}
        onValueChange={(value) => setSuggestedModels(value as string[])}
      >
        <SelectTrigger>
          <SelectValue>
            {(value) => {
              if (value.length === 0) {
                return "Select models...";
              }

              const firstModel = textGenerationModels[value[0]];
              const additionalModels =
                value.length > 1 ? ` (+${value.length - 1} more)` : "";
              return firstModel.displayName + additionalModels;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectPositioner>
          <SelectContent>
            {availableModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectPositioner>
      </Select>
      {error && <Field.Error>{error}</Field.Error>}
      <Field.Description>
        Select recommended AI models for this scenario. This is optional—users
        can still choose any model they want. It's a helpful hint about which
        models work well for the scenario's style and vibe.
      </Field.Description>
    </Field.Root>
  );
}

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({}); // Clear previous errors
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);

      // Extract basic fields
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const content = formData.get("content") as string;
      const suggestedUserName = formData.get("suggested_user_name") as string;
      const userPersonaText = formData.get("user_persona_text") as string;
      const styleGuidelines = formData.get("style_guidelines") as string;

      // Validate form fields
      const formValidation = scenarioFormFieldsSchema.safeParse({
        content,
        title,
        description,
        suggested_user_name: suggestedUserName,
        user_persona_text: userPersonaText,
        style_guidelines: styleGuidelines,
      });

      // Filter out empty starting messages for validation
      const nonEmptyMessages = startingMessages.filter(
        (msg) => msg.text.trim() !== ""
      );

      // Validate starting messages (only if there are any non-empty messages)
      const messagesValidation =
        nonEmptyMessages.length > 0
          ? startingMessagesSchema.safeParse(nonEmptyMessages)
          : { success: true };

      // Validate suggested models
      const modelsValidation = suggestedModelsSchema.safeParse(suggestedModels);

      // Collect all errors (convert arrays to single strings)
      const validationErrors: Record<string, string> = {};

      if (!formValidation.success) {
        const fieldErrors = z.flattenError(formValidation.error).fieldErrors;
        Object.entries(fieldErrors).forEach(([field, errors]) => {
          if (errors && errors.length > 0) {
            validationErrors[field] = errors[0]; // Take first error message
          }
        });
      }

      if (!messagesValidation.success && "error" in messagesValidation) {
        const messageErrors = z.flattenError(messagesValidation.error);
        if (messageErrors.formErrors.length > 0) {
          validationErrors.startingMessages = messageErrors.formErrors[0];
        } else if (messageErrors.fieldErrors) {
          // Collect individual field errors from messages
          const allMessageErrors: string[] = [];
          Object.values(messageErrors.fieldErrors).forEach((errors) => {
            if (errors) {
              allMessageErrors.push(...errors);
            }
          });
          if (allMessageErrors.length > 0) {
            validationErrors.startingMessages = allMessageErrors[0];
          }
        }
      }

      if (!modelsValidation.success) {
        validationErrors.suggestedModels = "Invalid model selection";
      }

      // If there are validation errors, set them and return
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsSubmitting(false);
        return;
      }

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
        title,
        description,
        content,
        suggested_user_name: suggestedUserName,
        user_persona_text: userPersonaText,
        style_guidelines: styleGuidelines,
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

      setErrors({ submit: "Unable to create scenario" });
      setIsSubmitting(false);
    } catch (error) {
      // Handle server-side errors
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "An unexpected error occurred" });
      }
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      className="space-y-[48px]"
      onSubmit={handleSubmit}
      errors={errors}
      onClearErrors={(clearedErrors) =>
        setErrors(clearedErrors as Record<string, string>)
      }
    >
      <div className="bg-blue-50 border border-blue-200 rounded-[12px] p-[16px]">
        <h3 className="text-[0.95rem] font-semibold text-blue-900 mb-[8px]">
          Template Variables
        </h3>
        <p className="text-[0.85rem] text-blue-800 mb-[8px]">
          You can use the following template variables in any field of your
          scenario:
        </p>
        <ul className="text-[0.85rem] text-blue-800 space-y-[4px] list-disc list-inside">
          <li>
            <code className="bg-blue-100 px-[6px] py-[2px] rounded font-mono text-[0.80rem]">
              {"{"}
              {"{"}persona.1.name{"}"}
              {"}"}
            </code>{" "}
            - References the persona's name
          </li>
          <li>
            <code className="bg-blue-100 px-[6px] py-[2px] rounded font-mono text-[0.80rem]">
              {"{"}
              {"{"}user.name{"}"}
              {"}"}
            </code>{" "}
            - References the user's name
          </li>
        </ul>
        <p className="text-[0.80rem] text-blue-700 mt-[8px]">
          Note: We currently support single persona chats, but group chats are
          planned soon. That's why we use{" "}
          <code className="bg-blue-100 px-[6px] py-[2px] rounded font-mono">
            persona.1
          </code>{" "}
          format.
        </p>
      </div>

      <FormSection title="Scenario">
        <ScenarioContentField />
      </FormSection>
      <FormSection title="Personas">
        <PersonaSelectorField
          selectedPersonas={selectedPersonas}
          setSelectedPersonas={setSelectedPersonas}
          primaryPersonaId={primaryPersonaId}
          setPrimaryPersonaId={setPrimaryPersonaId}
        />
      </FormSection>
      <FormSection title="User">
        <UserPersonaField />
      </FormSection>

      <FormSection title="Advanced">
        <StartingMessagesField
          startingMessages={startingMessages}
          setStartingMessages={setStartingMessages}
          error={errors.startingMessages}
        />
        <StyleGuidelinesField />
        <ModelSelectorField
          suggestedModels={suggestedModels}
          setSuggestedModels={setSuggestedModels}
          error={errors.suggestedModels}
        />
      </FormSection>

      <FormSection title="Details">
        <TitleField />
        <DescriptionField />
      </FormSection>

      <div className="pt-[24px] space-y-[12px]">
        {errors.submit && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-[12px] p-[12px]">
            {errors.submit}
          </div>
        )}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Scenario"}
        </Button>
      </div>
    </Form>
  );
}
