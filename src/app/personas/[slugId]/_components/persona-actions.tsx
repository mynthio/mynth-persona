"use client";

import { Message01Icon, UserAccountIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { CreateChatButton } from "@/components/create-chat-button";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
          <HugeiconsIcon icon={Message01Icon} /> Chat
        </CreateChatButton>

        <Button variant="outline" size="sm" onClick={() => setIsBioOpen(true)}>
          <HugeiconsIcon icon={UserAccountIcon} />
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
