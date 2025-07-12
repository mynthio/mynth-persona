import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CopyIcon } from "@phosphor-icons/react/dist/ssr";
import { PersonaData } from "@/types/persona.type";
import { addToast } from "@heroui/toast";

type PersonaCopyButtonProps = {
  data: PersonaData | null;
  size?: "default" | "sm" | "lg" | "icon";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
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

export default function PersonaCopyButton({
  data,
  size = "default",
  variant = "outline",
  className,
}: PersonaCopyButtonProps) {
  // Copy handlers
  const handleCopy = async (format: "text" | "json" | "system-prompt") => {
    if (!data) return;

    let textToCopy: string;
    let formatName: string;

    switch (format) {
      case "text":
        textToCopy = formatPersonaAsText(data);
        formatName = "text";
        break;
      case "json":
        textToCopy = formatPersonaAsJSON(data);
        formatName = "JSON";
        break;
      case "system-prompt":
        textToCopy = formatPersonaAsSystemPrompt(data);
        formatName = "system prompt";
        break;
      default:
        return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      addToast({
        title: "Copied!",
        description: `Persona copied as ${formatName}`,
        color: "success",
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      addToast({
        title: "Copied!",
        description: `Persona copied as ${formatName}`,
        color: "success",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size={size}
          variant={variant}
          disabled={!data}
          className={className}
        >
          <CopyIcon size={16} />
          Copy
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleCopy("text")}>
          <CopyIcon size={16} />
          Copy as text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCopy("json")}>
          <CopyIcon size={16} />
          Copy as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCopy("system-prompt")}>
          <CopyIcon size={16} />
          Copy as system prompt
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
