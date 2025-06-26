"use client";

import type { PersonaData, PersonaVersion } from "@/types/persona-version.type";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { CopyIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { useQueryState } from "nuqs";
import { Spinner } from "@heroui/spinner";
import PersonaDetails from "@/components/persona/persona-details";
import { ScrollShadow } from "@heroui/scroll-shadow";
import {
  PersonaWithCurrentVersion,
  PersonaWithVersion,
} from "@/types/persona.type";
import useSWR from "swr";
import { Chip } from "@heroui/chip";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@heroui/dropdown";

type PersonaPanelProps = {
  isGenerating: boolean;
  personaData: PersonaData | null;
  personaVersionId?: string | null;
};

// Helper functions for formatting persona data
const formatPersonaAsText = (personaData: PersonaData): string => {
  const sections = [
    `Name: ${personaData.name}`,
    `Age: ${personaData.age}`,
    `Gender: ${personaData.gender}`,
    `Universe: ${personaData.universe}`,
    `Appearance: ${personaData.appearance}`,
    `Personality: ${personaData.personality}`,
    `Background: ${personaData.background}`,
    `Occupation: ${personaData.occupation}`,
  ];

  if (personaData.other) {
    sections.push(`Other: ${personaData.other}`);
  }

  return sections.join("\n\n");
};

const formatPersonaAsJSON = (personaData: PersonaData): string => {
  return JSON.stringify(personaData, null, 2);
};

const formatPersonaAsSystemPrompt = (personaData: PersonaData): string => {
  return `You are ${personaData.name}, a ${personaData.age}-year-old ${
    personaData.gender
  } from ${personaData.universe}.

Appearance: ${personaData.appearance}

Personality: ${personaData.personality}

Background: ${personaData.background}

Occupation: ${personaData.occupation}${
    personaData.other
      ? `

Additional Information: ${personaData.other}`
      : ""
  }

Stay in character at all times. Respond as ${
    personaData.name
  } would, drawing from your background, personality, and experiences. Maintain consistency with your established traits and the world you come from.`;
};

export default function PersonaPanel(props: PersonaPanelProps) {
  const [personaVersionId, setPersonaVersionId] =
    useQueryState("persona_version_id");

  const [personaId] = useQueryState("persona_id");

  const [isPersonaPanelOpen, setIsPersonaPanelOpen] = useQueryState("panel");

  const { data: personaVersion, isLoading: isPersonaVersionLoading } =
    useSWR<PersonaVersion>(
      !props.isGenerating && personaId && personaVersionId
        ? `/api/personas/${personaId}/versions/${personaVersionId}`
        : null
    );

  // Get the current persona data (either from props or from the loaded version)
  const currentPersonaData =
    props.isGenerating || !personaVersion?.personaData
      ? props.personaData
      : personaVersion.personaData;

  // Copy handlers
  const handleCopy = async (format: "text" | "json" | "system-prompt") => {
    if (!currentPersonaData) return;

    let textToCopy: string;

    switch (format) {
      case "text":
        textToCopy = formatPersonaAsText(currentPersonaData);
        break;
      case "json":
        textToCopy = formatPersonaAsJSON(currentPersonaData);
        break;
      case "system-prompt":
        textToCopy = formatPersonaAsSystemPrompt(currentPersonaData);
        break;
      default:
        return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      // You might want to add a toast notification here
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  return (
    <Card className="min-h-0 h-full">
      <CardHeader className="flex justify-between items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-1 max-w-full w-auto min-w-0">
            {props.isGenerating ? (
              <Spinner size="sm" color="default" />
            ) : (
              <Chip size="sm" color="secondary" variant="flat">
                Version {personaVersion?.versionNumber}
              </Chip>
            )}
            <p className="text-sm font-medium text-default-500 truncate max-w-full w-auto min-w-0">
              {props.isGenerating ? null : personaVersion?.title}
            </p>
          </div>
          {!props.isGenerating && isPersonaVersionLoading && (
            <Spinner size="sm" color="default" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Dropdown>
            <DropdownTrigger>
              <Button
                size="sm"
                variant="solid"
                startContent={<CopyIcon />}
                isDisabled={!currentPersonaData}
              >
                Copy
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              onAction={(key) =>
                handleCopy(key as "text" | "json" | "system-prompt")
              }
            >
              <DropdownItem key="text">Copy as text</DropdownItem>
              <DropdownItem key="json">Copy as JSON</DropdownItem>
              <DropdownItem key="system-prompt">
                Copy as system prompt for roleplay
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Button
            isIconOnly
            variant="light"
            onPress={() => setIsPersonaPanelOpen(null)}
          >
            <XIcon />
          </Button>
        </div>
      </CardHeader>

      {(props.personaData || personaVersion?.personaData) && (
        <CardBody className="min-h-0 h-auto">
          <ScrollShadow size={80} offset={10}>
            <PersonaDetails
              personaData={
                props.isGenerating || !personaVersion?.personaData
                  ? props.personaData!
                  : personaVersion.personaData!
              }
              changedProperties={personaVersion?.changedProperties || []}
            />
          </ScrollShadow>
        </CardBody>
      )}
    </Card>
  );
}
