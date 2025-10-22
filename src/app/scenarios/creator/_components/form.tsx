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
import { textGenerationModels } from "@/config/shared/models/text-generation-models.config";
import {
  PersonaSelector,
  PersonaSelectorTrigger,
  PersonaSelectorValue,
  PersonaChip,
  Persona,
} from "@/components/persona-selector";

interface StartingMessage {
  role: "user" | "persona";
  content: string;
}

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
    <Field.Root>
      <Field.Label>Scenario Content</Field.Label>
      <TextareaAutosize
        id="content"
        ref={textareaRef}
        name="content"
        minRows={4}
        maxRows={10}
        placeholder="You find yourself in a mysterious forest..."
      />
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
        The main scenario text that sets the scene and context
      </Field.Description>
    </Field.Root>
  );
}

function PersonaSelectorField() {
  const [selectedPersonas, setSelectedPersonas] = useState<Array<Persona>>([]);

  return (
    <Field.Root>
      <PersonaSelector
        value={selectedPersonas}
        onChange={setSelectedPersonas}
        multiple
      >
        <div className="space-y-[12px] w-full">
          <PersonaSelectorValue>
            {({ selectedPersonas, removePersona }) => (
              <>
                {selectedPersonas.length > 0 && (
                  <div className="flex flex-wrap gap-[8px]">
                    {selectedPersonas.map((persona) => (
                      <PersonaChip
                        key={persona.id}
                        persona={persona}
                        onRemove={() => removePersona(persona.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </PersonaSelectorValue>

          <div className="flex items-center justify-center w-full">
            <PersonaSelectorTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                Select personas
              </Button>
            </PersonaSelectorTrigger>
          </div>
        </div>
      </PersonaSelector>
    </Field.Root>
  );
}

function TitleField() {
  return (
    <Field.Root>
      <Field.Label>Title</Field.Label>
      <Input name="title" placeholder="Adventure of..." />
      <Field.Description>Title of scenario</Field.Description>
    </Field.Root>
  );
}

function DescriptionField() {
  return (
    <Field.Root>
      <Field.Label>Description</Field.Label>
      <TextareaAutosize
        minRows={1}
        maxRows={2}
        name="description"
        placeholder="A thrilling adventure where..."
      />
      <Field.Description>
        Description of scenario, should be catchy and describe scenario summary.
        1-3 sentences.
      </Field.Description>
    </Field.Root>
  );
}

function UserPersonaField() {
  return (
    <>
      <Field.Root>
        <Field.Label>Name</Field.Label>
        <Input
          name="suggested_user_name"
          placeholder="Character name (e.g., 'Alex', 'The Detective')"
        />
        <Field.Description>Default user name</Field.Description>
      </Field.Root>
      <Field.Root>
        <Field.Label>Character</Field.Label>
        <TextareaAutosize
          name="user_persona_text"
          minRows={3}
          maxRows={6}
          placeholder="You are a brave adventurer who has traveled far..."
        />
        <Field.Description>
          Define who the user is in this scenario. Use {"{{user.name}}"} for
          name, to make it dynamic. It will be replaced with user name.
        </Field.Description>
      </Field.Root>
    </>
  );
}

function StartingMessagesField() {
  const [startingMessages, setStartingMessages] = useState<StartingMessage[]>([
    { role: "persona", content: "" },
  ]);

  const addMessage = (role: "user" | "persona") => {
    setStartingMessages([...startingMessages, { role, content: "" }]);
  };

  const updateMessage = (index: number, content: string) => {
    const updated = [...startingMessages];
    updated[index].content = content;
    setStartingMessages(updated);
  };

  const removeMessage = (index: number) => {
    setStartingMessages(startingMessages.filter((_, i) => i !== index));
  };

  return (
    <Field.Root>
      <Field.Label>Starting Messages</Field.Label>
      <Field.Description className="mb-[12px]">
        Initial conversation to set the tone
      </Field.Description>

      <div className="space-y-[12px]">
        {startingMessages.map((message, index) => (
          <div key={index} className="space-y-[8px]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">
                {message.role}
              </span>
              {startingMessages.length > 1 && (
                <Button
                  size="sm"
                  variant="outline"
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
              value={message.content}
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
    </Field.Root>
  );
}

function StyleGuidelinesField() {
  return (
    <Field.Root>
      <Field.Label>Style Guidelines</Field.Label>
      <TextareaAutosize
        name="style_guidelines"
        minRows={3}
        maxRows={6}
        placeholder="Write in a descriptive, immersive style with vivid details..."
      />
      <Field.Description>
        Instructions for how the AI should write and respond in this scenario
      </Field.Description>
    </Field.Root>
  );
}

function ModelSelectorField() {
  // Get enabled models
  const availableModels = Object.entries(textGenerationModels)
    .filter(([, config]) => config.enabled)
    .map(([id, config]) => ({
      id,
      displayName: config.displayName,
    }));

  return (
    <Field.Root>
      <Field.Label>Suggested AI Models (Optional)</Field.Label>
      <Select multiple defaultValue={[]}>
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
      <Field.Description>
        Select recommended AI models for this scenario
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
  return (
    <Form className="space-y-[48px]">
      <FormSection title="Scenario">
        <ScenarioContentField />
      </FormSection>
      <FormSection title="Personas">
        <PersonaSelectorField />
      </FormSection>
      <FormSection title="User">
        <UserPersonaField />
      </FormSection>

      <FormSection title="Advanced">
        <StartingMessagesField />
        <StyleGuidelinesField />
        <ModelSelectorField />
      </FormSection>

      <FormSection title="Publishing">
        <TitleField />
        <DescriptionField />
      </FormSection>

      <div className="pt-[24px]">
        <Button type="submit" className="w-full">
          Create Scenario
        </Button>
      </div>
    </Form>
  );
}
