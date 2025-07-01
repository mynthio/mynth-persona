"use client";

import { generatePersonaImage } from "@/actions/generate-persona-image";
import { Button } from "@heroui/button";
import { useQueryState } from "nuqs";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useState } from "react";
import { Image } from "@heroui/image";
import { useSWRConfig } from "swr";

export function PersonaImageGeneration() {
  const { mutate } = useSWRConfig();
  const [personaId] = useQueryState("persona_id");

  const [runId, setRunId] = useState<string | null>(null);
  const [publicAccessToken, setPublicAccessToken] = useState<string | null>(
    null
  );

  return (
    <div>
      <Button
        onPress={() => {
          generatePersonaImage(personaId!).then((result) => {
            setRunId(result.taskId);
            setPublicAccessToken(result.publicAccessToken);
            mutate("/api/me/balance");
          });
        }}
      >
        Generate Image
      </Button>

      {runId && publicAccessToken && (
        <PersonaImage runId={runId} publicAccessToken={publicAccessToken} />
      )}
    </div>
  );
}

function PersonaImage({
  runId,
  publicAccessToken,
}: {
  runId: string;
  publicAccessToken: string;
}) {
  const { mutate } = useSWRConfig();

  const { run, error } = useRealtimeRun(runId, {
    accessToken: publicAccessToken,
    onComplete: () => {
      mutate("/api/me/balance");
    },
    stopOnCompletion: true,
  });

  if (!run?.output?.imageUrl) {
    return <div>Loading...</div>;
  }

  return <Image src={run.output.imageUrl} alt="Persona Image" />;
}
