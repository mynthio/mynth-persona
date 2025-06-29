"use client";

import { Card } from "@heroui/card";
import { Image } from "@heroui/image";
import { Spinner } from "@heroui/spinner";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useSWRConfig } from "swr";
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
  const { mutate } = useSWRConfig();

  const { run, error } = useRealtimeRun(runId, {
    accessToken: publicAccessToken,
    onComplete: () => {
      console.log("onComplete");
      mutate("/api/me/balance");
    },
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
      src={`https://mynth-persona-dev.b-cdn.net/personas/${imageId}.webp`}
      alt="Persona Image"
      title="Generated Image"
      downloadFileName={`persona-${imageId}.webp`}
      trigger={
        <Card isPressable className="hover:shadow-md transition-shadow">
          <Image
            width={124}
            src={`https://mynth-persona-dev.b-cdn.net/personas/${imageId}.webp`}
            alt="Persona Image"
          />
        </Card>
      }
    />
  );
}
