"use client";

import type { PersonaData, PersonaVersion } from "@/types/persona-version.type";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { XIcon } from "@phosphor-icons/react/dist/ssr";
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

type PersonaPanelProps = {
  isGenerating: boolean;
  personaData: PersonaData | null;
  personaVersionId?: string | null;
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

  return (
    <Card className="min-h-0 h-full">
      <CardHeader className="flex justify-between items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-1 max-w-full w-auto min-w-0">
            {props.isGenerating ? (
              <Chip size="sm" color="warning" variant="flat">
                Enhancing...
              </Chip>
            ) : (
              <Chip size="sm" color="secondary" variant="flat">
                Version {personaVersion?.versionNumber}
              </Chip>
            )}
            <p className="text-sm font-medium text-default-500 truncate max-w-full w-auto min-w-0">
              {props.isGenerating
                ? "Streaming changes..."
                : personaVersion?.title}
            </p>
          </div>
          {!props.isGenerating && isPersonaVersionLoading && (
            <Spinner size="sm" color="default" />
          )}
        </div>

        <div>
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
              changedProperties={personaVersion?.changedProperties}
            />
          </ScrollShadow>
        </CardBody>
      )}
    </Card>
  );
}
