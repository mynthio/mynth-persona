"use client";

import { useState } from "react";
import { CreateChatButton } from "@/components/create-chat-button";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  ChatsTeardropIcon,
  IdentificationCardIcon,
} from "@phosphor-icons/react/dist/ssr";
import { BioDialog } from "./bio-dialog";
import { PersonaData } from "@/schemas";

type PersonaActionsProps = {
  personaId: string;
  displayName: string;
  data: PersonaData;
};

export function PersonaActions({
  personaId,
  displayName,
  data,
}: PersonaActionsProps) {
  const [isBioOpen, setIsBioOpen] = useState(false);

  return (
    <>
      <ButtonGroup>
        <CreateChatButton personaId={personaId} size="sm">
          <ChatsTeardropIcon /> Chat
        </CreateChatButton>

        <Button variant="outline" size="sm" onClick={() => setIsBioOpen(true)}>
          <IdentificationCardIcon />
          Bio
        </Button>
      </ButtonGroup>

      <BioDialog
        open={isBioOpen}
        onOpenChange={setIsBioOpen}
        data={data}
        displayName={displayName}
      />
    </>
  );
}
