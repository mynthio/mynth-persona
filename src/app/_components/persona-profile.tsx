"use client";

import { setPersonaCurrentVersion } from "@/actions/set-persona-current-version.action";
import { usePersonaVersionId } from "@/hooks/use-persona-version-id.hook";
import { usePersonaStore } from "@/providers/persona-store-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { addToast } from "@heroui/toast";
import { PersonIcon, ArrowUUpLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { useMemo } from "react";
import { useSWRConfig } from "swr";
import PersonaCopyButton from "./persona-copy-button";

export default function PersonaProfile() {
  const persona = usePersonaStore((state) => state.data);
  const isLoadingData = usePersonaStore((state) => state.isLoadingData);
  const { mutate } = useSWRConfig();

  const data = useMemo(() => {
    if (!persona) return null;
    return persona.version.data;
  }, [persona]);

  const changedProperties = useMemo(() => {
    if (!persona) return [];
    return persona.version.changedProperties || [];
  }, [persona]);

  const [personaVersionId] = usePersonaVersionId();

  const isCurrentVersion = useMemo(
    () => persona?.currentVersionId === persona?.version.id,
    [persona]
  );

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground">No persona data</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-light tracking-tight text-foreground">
              {data.name}
            </h1>

            <div className="flex items-center gap-2">
              <PersonaCopyButton data={data} size="sm" variant="outline" />

              {!isCurrentVersion && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={async () => {
                        if (!persona?.id || !personaVersionId) return;

                        try {
                          await setPersonaCurrentVersion(
                            persona.id,
                            personaVersionId
                          );

                          mutate(`/api/personas/${persona.id}`);
                          mutate(`/api/personas/${persona.id}/events`);

                          addToast({
                            title: "Success",
                            description: "Version set as current",
                            color: "success",
                          });
                        } catch (error) {
                          addToast({
                            title: "Error",
                            description:
                              "Failed to set this version as current",
                            color: "danger",
                          });
                        }
                      }}
                    >
                      <ArrowUUpLeftIcon size={16} />
                      Revert
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Set this version as current</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="text-sm">
              <span className="text-foreground font-medium">{data.age}</span>
            </span>
            <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
            <div className="flex items-center gap-2 text-sm">
              <PersonIcon size={16} />
              <span className="text-foreground font-medium">{data.gender}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="space-y-8">
        <ProfileSection
          title="Universe"
          content={data.universe}
          isChanged={changedProperties.includes("universe")}
        />

        <ProfileSection
          title="Appearance"
          content={data.appearance}
          isChanged={changedProperties.includes("appearance")}
        />

        <ProfileSection
          title="Personality"
          content={data.personality}
          isChanged={changedProperties.includes("personality")}
        />

        <ProfileSection
          title="Background"
          content={data.background}
          isChanged={changedProperties.includes("background")}
        />

        <ProfileSection
          title="Occupation"
          content={data.occupation}
          isChanged={changedProperties.includes("occupation")}
        />

        {data.other && (
          <ProfileSection
            title="Other"
            content={data.other}
            isChanged={changedProperties.includes("other")}
          />
        )}
      </div>
    </div>
  );
}

type ProfileSectionProps = {
  title: string;
  content: string;
  isChanged?: boolean;
};

function ProfileSection({ title, content, isChanged }: ProfileSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-light text-foreground">{title}</h3>
        {isChanged && (
          <Badge variant="secondary" className="text-xs">
            Enhanced
          </Badge>
        )}
      </div>
      <p className="text-muted-foreground leading-relaxed font-light">
        {content}
      </p>
    </div>
  );
}
