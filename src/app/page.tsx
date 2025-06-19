"use client";

import { generatePersonaAnonymousAction } from "@/actions/generate-persona-anonymous.action";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { ShootingStarIcon } from "@phosphor-icons/react/ssr";
import { readStreamableValue } from "ai/rsc";
import { useState } from "react";

export default function Home() {
  const [generation, setGeneration] = useState<string>("");

  return (
    <main className="w-full h-full">
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full max-w-3xl">
          <Textarea
            minRows={1}
            size="lg"
            placeholder="Write about your persona"
            endContent={
              <Button
                isIconOnly
                onPress={async () => {
                  const { object } = await generatePersonaAnonymousAction(
                    "Anime school teacher with long blonde hairs"
                  );

                  for await (const partialObject of readStreamableValue(
                    object
                  )) {
                    if (partialObject) {
                      console.log(partialObject);
                      setGeneration(JSON.stringify(partialObject, null, 2));
                    }
                  }
                }}
              >
                <ShootingStarIcon />
              </Button>
            }
          />
          <pre>{generation}</pre>
        </div>
      </div>
    </main>
  );
}
