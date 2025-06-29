import { Button } from "@heroui/button";
import { CopyIcon } from "@phosphor-icons/react/dist/ssr";
import { PersonaData } from "@/types/persona.type";
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
  return `You are ${data.name}, a ${data.age}-year-old ${
    data.gender
  } from ${data.universe}.

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
