"use client";

import { cn, getImageUrl } from "@/lib/utils";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { useChatMain } from "../_contexts/chat-main.context";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FieldError,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { User03 } from "@untitledui/icons";
import { useSettingsNavigation } from "../_hooks/use-settings-navigation.hook";

const SIDEBAR_WIDTH = "18rem";

function PersonaImage() {
  const { personas } = useChatPersonas();
  const { settings } = useChatMain();

  const persona = personas[0];
  const imageId = settings.sceneImageMediaId ?? persona.profileImageIdMedia;

  if (!imageId) return null;

  return (
    <div>
      <img
        src={getImageUrl(imageId)}
        alt={persona.name}
        className="aspect-square size-full object-cover object-top rounded-xl"
      />
    </div>
  );
}

function Content() {
  const { settings } = useChatMain();
  const { navigateSettings } = useSettingsNavigation();

  return (
    <div className="bg-sidebar rounded-lg px-4 py-2 border-2 border-sidebar-border">
      <Accordion type="single" collapsible>
        <AccordionItem value="character">
          <AccordionTrigger>My character</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {settings.user_persona?.name ? (
                <>
                  <p>
                    <strong>Name:</strong> {settings.user_persona?.name ?? ""}
                  </p>
                  <p>
                    <strong>Description:</strong>{" "}
                    {settings.user_persona?.character ?? ""}
                  </p>
                </>
              ) : (
                <p>No character set</p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigateSettings("user")}
            >
              Edit
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="scenario">
          <AccordionTrigger>Scenario</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <p>
                <strong>Scenario:</strong>{" "}
                {settings.scenario?.scenario_text
                  ? `${settings.scenario?.scenario_text?.slice(0, 222)}${
                      settings.scenario?.scenario_text?.length > 222
                        ? "..."
                        : ""
                    }`
                  : "No scenario set"}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigateSettings("scenario")}
              >
                Edit
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="Settings">
          <AccordionTrigger>Settings</AccordionTrigger>
          <AccordionContent>
            <p>Scene Reference Image</p>
            <Button>Re-generate</Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function ChatSidebar({ className }: { className?: string }) {
  const { sidebarOpen } = useChatMain();
  if (!sidebarOpen) return null;

  return (
    <div
      style={{ width: SIDEBAR_WIDTH } as React.CSSProperties}
      className={cn("sticky top-0 h-full p-4", className)}
    >
      <div className="flex flex-col gap-4">
        <PersonaImage />
        <Content />
      </div>
    </div>
  );
}
