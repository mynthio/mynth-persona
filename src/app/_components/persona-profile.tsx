import { usePersonaStore } from "@/providers/persona-store-provider";
import { PersonIcon } from "@phosphor-icons/react/dist/ssr";
import { useMemo } from "react";

export default function PersonaProfile() {
  const persona = usePersonaStore((state) => state.data);
  const isLoadingData = usePersonaStore((state) => state.isLoadingData);

  const data = useMemo(() => {
    console.log("persona", persona);
    if (!persona) return null;
    return persona.version.data;
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
        <ProfileSection title="Universe" content={data.universe} />

        <ProfileSection title="Appearance" content={data.appearance} />

        <ProfileSection title="Personality" content={data.personality} />

        <ProfileSection title="Background" content={data.background} />

        <ProfileSection title="Occupation" content={data.occupation} />

        {data.other && <ProfileSection title="Other" content={data.other} />}
      </div>
    </div>
  );
}

type ProfileSectionProps = {
  title: string;
  content: string;
};

function ProfileSection({ title, content }: ProfileSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-default-800">{title}</h3>
      <p className="text-default-700 leading-relaxed">{content}</p>
    </div>
  );
}
