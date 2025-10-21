"use client";

import { Field } from "@/components/mynth-ui/base/field";
import { Form } from "@/components/mynth-ui/base/form";
import { Input } from "@/components/mynth-ui/base/input";
import { TextareaAutosize } from "@/components/mynth-ui/base/textarea";
import ScenarioEditor from "./_components/scenario-editor";
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
import {
  textGenerationModels,
  type TextGenerationModelId,
} from "@/config/shared/models/text-generation-models.config";
import PersonaSelector from "@/components/persona-selector";

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
        ref={textareaRef}
        name="scenario_text"
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

export default function ScenarioCreatorPage() {
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
    <div className="w-full h-full">
      <div className="max-w-3xl mx-auto space-y-[48px] pt-[48px] pb-[48px]">
        <h1 className="text-center font-onest text-[2.7rem]">
          Scenario Creator
        </h1>

        <div className="max-w-xl mx-auto">
          <Form className="space-y-[24px]">
            <ScenarioContentField />

            <Field.Root>
              <PersonaSelector />
            </Field.Root>

            <Field.Root>
              <Field.Label>Title</Field.Label>
              <Input name="title" placeholder="Adventure of..." />
              <Field.Description>Title of scenario</Field.Description>
            </Field.Root>

            <Field.Root>
              <Field.Label>Description</Field.Label>
              <TextareaAutosize
                minRows={1}
                maxRows={2}
                name="description"
                placeholder="A thrilling adventure where..."
              />
              <Field.Description>
                Description of scenario, should be catchy and describe scenario
                summary. 1-3 sentences.
              </Field.Description>
            </Field.Root>

            <Field.Root>
              <Field.Label>User Persona</Field.Label>
              <Field.Description className="mb-[12px]">
                Define who the user is in this scenario
              </Field.Description>

              <div className="space-y-[12px]">
                <Input
                  name="suggested_user_name"
                  placeholder="Character name (e.g., 'Alex', 'The Detective')"
                />

                <TextareaAutosize
                  name="user_persona_text"
                  minRows={3}
                  maxRows={6}
                  placeholder="You are a brave adventurer who has traveled far..."
                />
              </div>
            </Field.Root>

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

            <Field.Root>
              <Field.Label>Style Guidelines</Field.Label>
              <TextareaAutosize
                name="style_guidelines"
                minRows={3}
                maxRows={6}
                placeholder="Write in a descriptive, immersive style with vivid details..."
              />
              <Field.Description>
                Instructions for how the AI should write and respond in this
                scenario
              </Field.Description>
            </Field.Root>

            <Field.Root>
              <Field.Label>Suggested AI Models (Optional)</Field.Label>
              <ModelSelector />
              <Field.Description>
                Select recommended AI models for this scenario
              </Field.Description>
            </Field.Root>

            <div className="pt-[24px]">
              <Button type="submit" className="w-full">
                Create Scenario
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

function ModelSelector() {
  // Get enabled models
  const availableModels = Object.entries(textGenerationModels)
    .filter(([_, config]) => config.enabled)
    .map(([id, config]) => ({
      id,
      displayName: config.displayName,
    }));

  return (
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
  );
}
