"use client";

import { Image } from "@heroui/image";
import { Spinner } from "@heroui/spinner";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

import { GetPersonaEventsByIdResponse } from "../api/personas/[personaId]/events/route";
import ImagePreviewDialog from "@/components/persona/image-preview-dialog";

export function PersonaImageEvent({
  personaEvent,
}: {
  personaEvent: GetPersonaEventsByIdResponse[number];
}) {
  if (personaEvent.imageGenerations[0]?.status === "pending")
    return (
      <PendingImageEvent
        runId={personaEvent.imageGenerations[0].runId!}
        // @ts-expect-error - TODO: fix this
        publicAccessToken={personaEvent.imageGenerations[0].accessToken!}
        personaId={personaEvent.personaId}
      />
    );

  return <ImageCard imageId={personaEvent.imageGenerations[0].imageId!} />;
}

function PendingImageEvent({
  runId,
  publicAccessToken,
  personaId,
}: {
  runId: string;
  publicAccessToken: string;
  personaId: string;
}) {
  const { run, error } = useRealtimeRun(runId, {
    accessToken: publicAccessToken,
    stopOnCompletion: true,
  });

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  if (!run?.output?.imageUrl) {
    return <Spinner />;
  }

  return <ImageCard imageId={run.output.imageId} />;
}

function ImageCard({ imageId }: { imageId: string }) {
  return (
    <ImagePreviewDialog
      src={`${process.env.NEXT_PUBLIC_CDN_BASE_URL}/personas/${imageId}.webp`}
      alt="Persona Image"
      title="Generated Image"
      downloadFileName={`persona-${imageId}.webp`}
      trigger={
        <Image
          loading="lazy"
          width={124}
          src={`${process.env.NEXT_PUBLIC_CDN_BASE_URL}/personas/${imageId}_thumb.webp`}
          alt="Persona Image"
        />
      }
    />
  );
}
