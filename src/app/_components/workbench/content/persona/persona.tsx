"use client";

import { BookOpen01Icon, BubbleChatIcon, EyeIcon, Idea01Icon, Image02Icon, Mic01Icon, PuzzleIcon, SparklesIcon, ToolsIcon, User03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePersonaVersionQuery } from "@/app/_queries/use-persona-version.query";
import { usePersonaQuery } from "@/app/_queries/use-persona.query";

import { getImageUrl } from "@/lib/utils";
import { spaceCase } from "case-anything";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWorkbenchMode } from "@/hooks/use-workbench-mode.hook";
import { useParams } from "next/navigation";
import { CreateChatButton } from "@/components/create-chat-button";
import { MiniWaveLoader } from "@/components/ui/mini-wave-loader";

export default function PersonaContent() {
  return <Persona />;
}

function Persona() {
  const params = useParams<{ personaId: string }>();

  const [, setWorkbenchMode] = useWorkbenchMode();

  const personaId = params.personaId;
  const { data: persona } = usePersonaQuery(personaId);
  const { isLoading, data: personaVersion } =
    usePersonaVersionQuery(personaId);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <MiniWaveLoader aria-label="Loading persona" />
      </div>
    );

  if (!personaVersion)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Persona not found</p>
      </div>
    );

  const { data } = personaVersion;

  return (
    <div className="relative mt-6 max-w-3xl w-full mx-auto pb-32">
      {/* Atmospheric backdrop */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
      <div className="absolute -top-12 right-[-10%] h-[300px] w-[300px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      {/* Hero card */}
      <div className="relative rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
        {/* Subtle gradient top accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />

        <div className="p-6 sm:p-8">
          <div className="flex gap-6 sm:gap-8">
            {/* Profile image */}
            <div className="w-28 h-36 sm:w-32 sm:h-40 shrink-0">
              {persona?.profileImageIdMedia ? (
                <div className="relative rounded-xl overflow-hidden w-full h-full border border-border/30 shadow-[0_12px_30px_-18px_rgba(124,58,237,0.35)]">
                  <img
                    className="w-full h-full object-cover"
                    src={getImageUrl(persona.profileImageIdMedia)}
                    alt="Persona profile"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                </div>
              ) : (
                <div className="w-full h-full rounded-xl overflow-hidden border border-border/40 bg-card/50 backdrop-blur-sm text-muted-foreground flex flex-col items-center justify-center gap-3 p-3">
                  <HugeiconsIcon icon={User03Icon} className="size-8 text-muted-foreground/50" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setWorkbenchMode("gallery");
                    }}
                    aria-label="Generate image"
                    className="h-7 w-full px-2 text-[11px] rounded-lg border-border/50"
                  >
                    <HugeiconsIcon icon={Image02Icon} className="size-3.5" />
                    Generate
                  </Button>
                </div>
              )}
            </div>

            {/* Persona info */}
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-semibold text-2xl sm:text-3xl tracking-tight text-foreground">
                  {data.name}
                </h1>
              </div>

              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {data.age && (
                  <Badge
                    variant="outline"
                    className="border-border/40 bg-card/40 text-muted-foreground text-[11px]"
                  >
                    {data.age}
                  </Badge>
                )}
                {data.gender && (
                  <Badge
                    variant="outline"
                    className="border-border/40 bg-card/40 text-muted-foreground text-[11px] capitalize"
                  >
                    {data.gender}
                  </Badge>
                )}
                {data.occupation && (
                  <Badge
                    variant="outline"
                    className="border-border/40 bg-card/40 text-muted-foreground text-[11px]"
                  >
                    <HugeiconsIcon icon={ToolsIcon} className="size-3" />
                    {data.occupation}
                  </Badge>
                )}
              </div>

              <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {data.summary}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <CreateChatButton
                  personaId={personaId}
                  size="sm"
                  className="rounded-full bg-primary px-5 text-primary-foreground shadow-[0_12px_30px_-12px_rgba(124,58,237,0.6)] ring-1 ring-primary/30 transition-all hover:-translate-y-px hover:brightness-110"
                >
                  <HugeiconsIcon icon={BubbleChatIcon} className="size-4" />
                  Start Chat
                </CreateChatButton>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWorkbenchMode("gallery")}
                  className="rounded-full border-border/50 bg-card/40 hover:bg-card/70"
                >
                  <HugeiconsIcon icon={SparklesIcon} className="size-4" />
                  Gallery
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail sections */}
      <div className="flex flex-col gap-4 mt-6">
        <PersonaDetailSection
          title="Appearance"
          content={data.appearance}
          icon={<HugeiconsIcon icon={EyeIcon} className="size-4" />}
        />
        <PersonaDetailSection
          title="Personality"
          content={data.personality}
          icon={<HugeiconsIcon icon={Idea01Icon} className="size-4" />}
        />
        <PersonaDetailSection
          title="Background"
          content={data.background}
          icon={<HugeiconsIcon icon={BookOpen01Icon} className="size-4" />}
        />
        {data.speakingStyle && (
          <PersonaDetailSection
            title="Speaking Style"
            content={data.speakingStyle}
            icon={<HugeiconsIcon icon={Mic01Icon} className="size-4" />}
          />
        )}
        {data.occupation && (
          <PersonaDetailSection
            title="Occupation"
            content={data.occupation}
            icon={<HugeiconsIcon icon={ToolsIcon} className="size-4" />}
          />
        )}
        {Object.entries(data.extensions ?? {}).map(([key, value]) => (
          <PersonaDetailSection
            key={key}
            title={spaceCase(key, { keepSpecialCharacters: false })}
            content={typeof value === "string" ? value : ""}
            icon={<HugeiconsIcon icon={PuzzleIcon} className="size-4" />}
          />
        ))}
      </div>
    </div>
  );
}

type PersonaDetailSectionProps = {
  title: string;
  content: string;
  icon?: React.ReactNode;
};

function PersonaDetailSection(props: PersonaDetailSectionProps) {
  return (
    <div className="group relative rounded-xl border border-border/30 bg-card/20 backdrop-blur-sm transition-colors hover:border-border/50 hover:bg-card/40">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center justify-center size-7 rounded-lg bg-primary/10 text-primary">
            {props.icon}
          </div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground/80">
            {props.title}
          </h3>
        </div>
        <Separator className="mb-3 bg-border/30" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          {props.content}
        </p>
      </div>
    </div>
  );
}
