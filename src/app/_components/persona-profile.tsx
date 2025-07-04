import { usePersonaStore } from "@/providers/persona-store-provider";
import { Tooltip } from "@heroui/tooltip";
import {
  PersonIcon,
  SparkleIcon,
  StarIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useMemo } from "react";

export default function PersonaProfile() {
  const persona = usePersonaStore((state) => state.data);
  const isLoadingData = usePersonaStore((state) => state.isLoadingData);

  const data = useMemo(() => {
    if (!persona) return null;
    return persona.version.data;
  }, [persona]);

  const changedProperties = useMemo(() => {
    if (!persona) return [];
    return persona.version.changedProperties || [];
  }, [persona]);

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-default-500">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-default-500">No persona</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{data.name}</h1>
          <div className="flex items-start gap-4 text-default-600">
            <span>Age: {data.age}</span>
            <div className="flex items-center gap-1">
              <PersonIcon size={16} />
              <span>{data.gender}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
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
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-default-800">
        {title}
        {isChanged && (
          <Tooltip content="Enhanced in this version">
            <SparkleIcon
              weight="duotone"
              size={18}
              className="text-yellow-500"
            />
          </Tooltip>
        )}
      </h3>
      <p className="text-default-700 leading-relaxed">{content}</p>
    </div>
  );
}
