"use client";

import { usePersonaId } from "@/hooks/use-persona-id.hook";
import useSWR, { SWRConfig, useSWRConfig } from "swr";
import { GetPersonaEventsByIdResponse } from "../api/personas/[personaId]/events/route";
import { Spinner } from "@heroui/spinner";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { usePersonaVersionId } from "@/hooks/use-persona-version-id.hook";
import { ArrowRightIcon, DownloadIcon } from "@phosphor-icons/react/dist/ssr";
import { useIsPersonaPanelOpened } from "@/hooks/use-is-persona-panel-opened.hook";
import { useMemo } from "react";
import { usePersonaStore } from "@/providers/persona-store-provider";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useAuth } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function PersonaEvents() {
  const [personaId] = usePersonaId();
  const { isSignedIn } = useAuth();

  const { data, isLoading, error } = useSWR<GetPersonaEventsByIdResponse>(
    isSignedIn && personaId ? `/api/personas/${personaId}/events` : null
  );

  if (isLoading) return <Loading />;

  return (
    <div className="flex h-full flex-col min-h-auto max-h-full gap-8 mx-auto w-full max-w-4xl">
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
  switch (event.type) {
    case "persona_create":
      return <PersonaCreatorEvent event={event} />;
    case "persona_edit":
      return <PersonaCreatorEvent event={event} />;
    case "image_generate":
      return <PersonaImageEvent event={event} />;
    case "persona_revert":
      return <PersonaCreatorEvent event={event} />;
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
  const imageGeneration = useMemo(
    () => event.imageGenerations[0] ?? null,
    [event.imageGenerations]
  );

  return (
    <div>
      <UserMessage message={event.userMessage ?? ""} />

      {imageGeneration && imageGeneration.status === "completed" && (
        <PersonaImageItem imageId={imageGeneration.imageId!} />
      )}
      {imageGeneration &&
        (imageGeneration.status === "pending" ||
          imageGeneration.status === "processing") && (
          <SWRConfig
            value={{
              // @ts-expect-error - TODO: fix this
              fetcher: null,
            }}
          >
            <PersonaImageInProgress imageGeneration={imageGeneration} />
          </SWRConfig>
        )}
    </div>
  );
}

function PersonaImageInProgress({ imageGeneration }: { imageGeneration: any }) {
  const personaStore = usePersonaStore((state) => state);
  const { mutate } = useSWRConfig();
  const [personaId] = usePersonaId();

  const run = useMemo(
    () => personaStore.imageGenerationRuns[imageGeneration.id],
    [personaStore.imageGenerationRuns, imageGeneration.id]
  );

  const { run: realtimeRun } = useRealtimeRun(run ? run.runId : undefined, {
    accessToken: run ? run.publicAccessToken : undefined,
    stopOnCompletion: true,
  });

  if (!run)
    return (
      <div>
        Something went wrong, please refresh the page after some time and check
        if the image is generated.
      </div>
    );

  if (realtimeRun?.status !== "COMPLETED") {
    return <Spinner />;
  }

  return (
    <div>
      {realtimeRun?.output?.imageUrl ? (
        <PersonaImageItem imageId={realtimeRun.output.imageId} />
      ) : (
        <p>
          Something went wrong, please refresh the page after some time and
          check if the image is generated.
        </p>
      )}
    </div>
  );
}

function PersonaImageItem({ imageId }: { imageId: string }) {
  const personaData = usePersonaStore((state) => state.data);

  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer">
        <img
          className="rounded-2xl"
          width={120}
          height={120}
          src={`${process.env.NEXT_PUBLIC_CDN_BASE_URL}/personas/${imageId}_thumb.webp`}
          alt="Persona Image"
        />
      </DialogTrigger>

      <DialogContent className="p-0 border-0 grid grid-cols-2 overflow-hidden rounded-2xl h-full max-h-3/4 min-md:max-w-5xl max-w-6xl w-full">
        <div className="h-full w-full relative">
          <img
            className="w-full h-full object-cover"
            src={`${process.env.NEXT_PUBLIC_CDN_BASE_URL}/personas/${imageId}.webp`}
            alt="Persona Image"
          />

          <Button
            variant="secondary"
            className="absolute bottom-4 left-4"
            onClick={() => {
              const link = document.createElement("a");
              link.href = `${process.env.NEXT_PUBLIC_CDN_BASE_URL}/personas/${imageId}.webp`;
              link.download = `${personaData?.version.data.name}.webp`;
              link.click();
            }}
          >
            <DownloadIcon weight="duotone" /> Download
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          <DialogHeader className="py-6 px-3">
            <DialogTitle className="text-2xl">
              {personaData?.version.data.name}
            </DialogTitle>
          </DialogHeader>
          <div></div>
        </div>
      </DialogContent>
    </Dialog>
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
  const personaStore = usePersonaStore((state) => state);
  const [_, setVersionId] = usePersonaVersionId();
  const [isOpen, setIsOpen] = useIsPersonaPanelOpened();

  const isCurrentVersion = useMemo(
    () => personaStore.data?.currentVersionId === version.id,
    [personaStore.data?.currentVersionId, version.id]
  );

  const handlePress = () => {
    setVersionId(version.id);
    setIsOpen(true);
  };

  return (
    <Card className="p-4" isPressable onPress={handlePress}>
      <div className="flex items-center gap-4">
        <Chip color={isCurrentVersion ? "primary" : "default"}>
          Version {version.versionNumber} {isCurrentVersion && "(Current)"}
        </Chip>
        <span className="font-medium">{version.title}</span>
        <ArrowRightIcon />
      </div>
    </Card>
  );
}
