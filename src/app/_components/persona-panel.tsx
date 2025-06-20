"use client";

import type { PersonaData } from "@/types/persona-version.type";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { XIcon } from "@phosphor-icons/react/dist/ssr";
import { useQueryState } from "nuqs";
import { Spinner } from "@heroui/spinner";
import PersonaDetails from "@/components/persona/persona-details";

type PersonaPanelProps = {
  isGenerating: boolean;
  personaData: PersonaData | null;
};

export default function PersonaPanel(props: PersonaPanelProps) {
  const [personaVersionId, setPersonaVersionId] =
    useQueryState("personaVersionId");

  return (
    <Card className="min-h-0 h-full">
      <CardHeader className="flex justify-between items-center">
        <div>{props.isGenerating && <Spinner size="sm" color="default" />}</div>

        <div>
          <Button
            isIconOnly
            variant="light"
            onPress={() => setPersonaVersionId(null)}
          >
            <XIcon />
          </Button>
        </div>
      </CardHeader>
      {props.personaData && (
        <CardBody className="min-h-0 h-auto max-h-full">
          <PersonaDetails personaData={props.personaData} />
        </CardBody>
      )}
    </Card>
  );
}
