import { Button } from "@heroui/button";
import { CopyIcon } from "@phosphor-icons/react/dist/ssr";
import { PersonaData } from "@/types/persona-version.type";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";

type PersonaCopyButtonProps = {
  data: PersonaData | null;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "light" | "flat" | "bordered" | "ghost";
  isDisabled?: boolean;
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

export default function PersonaCopyButton({
  data,
  size = "md",
  variant = "solid",
  isDisabled = false,
}: PersonaCopyButtonProps) {
  // Copy handlers
  const handleCopy = async (format: "text" | "json" | "system-prompt") => {
    if (!data) return;

    let textToCopy: string;

    switch (format) {
      case "text":
        textToCopy = formatPersonaAsText(data);
        break;
      case "json":
        textToCopy = formatPersonaAsJSON(data);
        break;
      case "system-prompt":
        textToCopy = formatPersonaAsSystemPrompt(data);
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
    <Dropdown>
      <DropdownTrigger>
        <Button
          size={size}
          variant={variant}
          startContent={<CopyIcon />}
          isDisabled={isDisabled || !data}
        >
          Copy
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        onAction={(key) => handleCopy(key as "text" | "json" | "system-prompt")}
      >
        <DropdownItem key="text">Copy as text</DropdownItem>
        <DropdownItem key="json">Copy as JSON</DropdownItem>
        <DropdownItem key="system-prompt">
          Copy as system prompt for roleplay
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
