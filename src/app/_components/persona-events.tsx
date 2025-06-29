"use client";

import { usePersonaId } from "@/hooks/use-persona-id.hook";
import useSWR from "swr";
import { GetPersonaEventsByIdResponse } from "../api/personas/[personaId]/events/route";
import { Skeleton } from "@heroui/skeleton";
import { Spinner } from "@heroui/spinner";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { usePersonaVersionId } from "@/hooks/use-persona-version-id.hook";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { useIsPersonaPanelOpened } from "@/hooks/use-is-persona-panel-opened.hook";

export default function PersonaEvents() {
  const [personaId] = usePersonaId();

  const { data, isLoading, error } = useSWR<GetPersonaEventsByIdResponse>(
    personaId ? `/api/personas/${personaId}/events` : null
  );

  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-col gap-8 mx-auto w-full max-w-4xl">
      {data?.map((event) => (
        <PersonaEvent key={event.id} event={event} />
      ))}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center items-center h-32">
      <Spinner />
    </div>
  );
}

function PersonaEvent({
  event,
}: {
  event: GetPersonaEventsByIdResponse[number];
}) {
  switch (event.eventType) {
    case "persona_create":
      return <PersonaCreatorEvent event={event} />;
    case "image_generate":
      return <PersonaImageEvent event={event} />;
  }

  return null;
}

function PersonaCreatorEvent({
  event,
}: {
  event: GetPersonaEventsByIdResponse[number];
}) {
  return (
    <div className="space-y-6">
      <UserMessage message={event.userMessage ?? ""} />
      <div className="space-y-2">
        {event.version && <PersonaEventVersion version={event.version} />}
        <AssistantNote note={event.aiNote ?? ""} />
      </div>
    </div>
  );
}

function PersonaImageEvent({
  event,
}: {
  event: GetPersonaEventsByIdResponse[number];
}) {
  return (
    <div>
      <UserMessage message={event.userMessage ?? ""} />
    </div>
  );
}

function UserMessage({ message }: { message: string }) {
  return (
    <Card className="max-w-11/12 w-fit bg-primary text-primary-foreground p-4 text-right text-balance ml-auto">
      {message}
    </Card>
  );
}

function AssistantNote({ note }: { note: string }) {
  return (
    <Card
      shadow="none"
      className="max-w-11/12 w-fit bg-transparent p-4 text-left text-balance"
    >
      {note}
    </Card>
  );
}

function PersonaEventVersion({
  version,
}: {
  version: NonNullable<GetPersonaEventsByIdResponse[number]["version"]>;
}) {
  const [_, setVersionId] = usePersonaVersionId();
  const [isOpen, setIsOpen] = useIsPersonaPanelOpened();

  const handlePress = () => {
    setVersionId(version.id);
    setIsOpen(true);
  };

  return (
    <Card className="p-4" isPressable onPress={handlePress}>
      <div className="flex items-center gap-4">
        <Chip>Version {version.versionNumber}</Chip>
        <span className="font-medium">{version.title}</span>
        <ArrowRightIcon />
      </div>
    </Card>
  );
}
