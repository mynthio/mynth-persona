"use client";

import type { PersonaData, PersonaVersion } from "@/types/persona.type";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { CopyIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { useQueryState } from "nuqs";
import { Spinner } from "@heroui/spinner";
import PersonaDetails from "@/components/persona/persona-details";
import { ScrollShadow } from "@heroui/scroll-shadow";
import useSWR from "swr";
import { Chip } from "@heroui/chip";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { useAuth } from "@clerk/nextjs";

type PersonaPanelProps = {
  isGenerating: boolean;
  data: PersonaData | null;
  personaVersionId?: string | null;
};

// Helper functions for formatting persona data
const formatPersonaAsText = (data: PersonaData): string => {
  const sections = [
    `Name: ${data.name}`,
    `Age: ${data.age}`,
    `Gender: ${data.gender}`,
    `Universe: ${data.universe}`,
    `Appearance: ${data.appearance}`,
    `Personality: ${data.personality}`,
    `Background: ${data.background}`,
    `Occupation: ${data.occupation}`,
  ];

  if (data.other) {
    sections.push(`Other: ${data.other}`);
  }

  return sections.join("\n\n");
};

const formatPersonaAsJSON = (data: PersonaData): string => {
  return JSON.stringify(data, null, 2);
};

const formatPersonaAsSystemPrompt = (data: PersonaData): string => {
  return `You are ${data.name}, a ${data.age}-year-old ${data.gender} from ${
    data.universe
  }.

Appearance: ${data.appearance}

Personality: ${data.personality}

Background: ${data.background}

Occupation: ${data.occupation}${
    data.other
      ? `

Additional Information: ${data.other}`
      : ""
  }

Stay in character at all times. Respond as ${
    data.name
  } would, drawing from your background, personality, and experiences. Maintain consistency with your established traits and the world you come from.`;
};

export default function PersonaPanel(props: PersonaPanelProps) {
  const [personaVersionId, setPersonaVersionId] =
    useQueryState("persona_version_id");

  const [personaId] = useQueryState("persona_id");

  const { isSignedIn } = useAuth();
  const [isPersonaPanelOpen, setIsPersonaPanelOpen] = useQueryState("panel");

  const { data: personaVersion, isLoading: isPersonaVersionLoading } =
    useSWR<PersonaVersion>(
      !props.isGenerating && personaId && personaVersionId && isSignedIn
        ? `/api/personas/${personaId}/versions/${personaVersionId}`
        : null
    );

  // Get the current persona data (either from props or from the loaded version)
  const currentData =
    props.isGenerating || !personaVersion?.data
      ? props.data
      : personaVersion.data;

  // Copy handlers
  const handleCopy = async (format: "text" | "json" | "system-prompt") => {
    if (!currentData) return;

    let textToCopy: string;

    switch (format) {
      case "text":
        textToCopy = formatPersonaAsText(currentData);
        break;
      case "json":
        textToCopy = formatPersonaAsJSON(currentData);
        break;
      case "system-prompt":
        textToCopy = formatPersonaAsSystemPrompt(currentData);
        break;
      default:
        return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      // You might want to add a toast notification here
    } catch (error) {
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
                isDisabled={!currentData}
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

      {(props.data || personaVersion?.data) && (
        <CardBody className="min-h-0 h-auto">
          <ScrollShadow size={80} offset={10}>
            <PersonaDetails
              data={
                props.isGenerating || !personaVersion?.data
                  ? props.data!
                  : personaVersion.data!
              }
              changedProperties={personaVersion?.changedProperties || []}
            />
          </ScrollShadow>
        </CardBody>
      )}
    </Card>
  );
}
