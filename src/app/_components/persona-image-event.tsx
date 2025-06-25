"use client";

import { PersonaEventWithVersion } from "@/types/persona-event.type";
import { Card } from "@heroui/card";
import { Image } from "@heroui/image";
import { Spinner } from "@heroui/spinner";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useSWRConfig } from "swr";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { useState } from "react";
import { Button } from "@heroui/button";

export function PersonaImageEvent({
  personaEvent,
}: {
  personaEvent: PersonaEventWithVersion;
}) {
  if (personaEvent.imageGeneration?.status === "pending")
    return (
      <PendingImageEvent
        runId={personaEvent.imageGeneration.runId}
        // @ts-expect-error - TODO: fix this
        publicAccessToken={personaEvent.imageGeneration.accessToken}
        personaId={personaEvent.personaId}
      />
    );

  return <ImageCard imageId={personaEvent.imageGeneration!.imageId} />;
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
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Card isPressable onPress={onOpen}>
        <Image
          width={124}
          src={`https://mynth-persona-dev.b-cdn.net/personas/${imageId}.webp`}
          alt="Persona Image"
        />
      </Card>
      <Modal size="3xl" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Image</ModalHeader>
              <ModalBody>
                <Image
                  src={`https://mynth-persona-dev.b-cdn.net/personas/${imageId}.webp`}
                  alt="Persona Image"
                />
              </ModalBody>
              <ModalFooter>
                <Button onPress={onClose}>Close</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
