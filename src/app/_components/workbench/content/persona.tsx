"use client";

import { usePersonaVersionQuery } from "@/app/_queries/use-persona-version.query";
import { usePersonaQuery } from "@/app/_queries/use-persona.query";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { getImageUrl } from "@/lib/utils";
import usePersonaGenerationStore from "@/stores/persona-generation.store";
import { spaceCase } from "case-anything";
import { MiniWaveLoader } from "@/components/ui/mini-wave-loader";
import { Button } from "@/components/ui/button";
import { useWorkbenchMode } from "@/hooks/use-workbench-mode.hook";

export default function PersonaContent() {
  return <Persona />;
}

function Persona() {
  const [personaId] = usePersonaId();
  const [, setWorkbenchMode] = useWorkbenchMode();

  const { data: persona } = usePersonaQuery(personaId);
  const { isLoading, data: personaVersion } = usePersonaVersionQuery(personaId);

  if (isLoading) return <div>Loading...</div>;

  if (!personaVersion) return <div>Persona not found</div>;

  const { data } = personaVersion;

  return (
    <div className="mt-12 max-w-2xl mx-auto">
      <div className="flex gap-8">
        <div className="w-24 h-32 shrink-0">
          {persona?.profileImageId ? (
            <div className="rounded-md overflow-hidden w-full h-full">
              <img
                className="w-full h-full object-cover"
                src={getImageUrl(persona.profileImageId)}
                alt="Persona profile"
              />
            </div>
          ) : (
            <div className="w-full h-full rounded-md overflow-hidden border border-border bg-gradient-to-br from-muted/50 to-background/60 text-muted-foreground flex flex-col items-center justify-between gap-2 p-2">
              <span className="text-[10px]">No image</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWorkbenchMode("imagine");
                }}
                aria-label="Generate image"
                className="h-7 w-full px-2 text-[11px]"
              >
                Create
              </Button>
            </div>
          )}
        </div>

        <div className="mt-2">
          <h1 className="font-semibold text-2xl">{data.name}</h1>
          <div className="mt-1 text-xs text-zinc-600 flex items-center gap-2">
            <span>{data.age}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-400" />
            <span className="capitalize">{data.gender}</span>
          </div>
          <p className="mt-1 text-sm text-zinc-600">{data.summary}</p>
        </div>
      </div>

      <div className="flex flex-col gap-8 mt-8">
        <PersonaDetailSection title="Appearance" content={data.appearance} />
        <PersonaDetailSection title="Personality" content={data.personality} />
        <PersonaDetailSection title="Background" content={data.background} />
        {data.occupation && (
          <PersonaDetailSection title="Occupation" content={data.occupation} />
        )}
        {Object.entries(data.extensions ?? {}).map(([key, value]) => (
          <PersonaDetailSection
            key={key}
            title={spaceCase(key, { keepSpecialCharacters: false })}
            content={typeof value === "string" ? value : ""}
          />
        ))}
      </div>
    </div>
  );
}

type PersonaDetailSectionProps = {
  title: string;
  content: string;
};

function PersonaDetailSection(props: PersonaDetailSectionProps) {
  return (
    <div>
      <h3 className="text-2xl capitalize font-medium">{props.title}</h3>
      <div className="mt-2">{props.content}</div>
    </div>
  );
}
