import { PersonaData } from "@/types/persona.type";
import { Badge } from "@heroui/badge";
import { Chip } from "@heroui/chip";
import { PersonIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";
import { Spacer } from "@heroui/spacer";
type PersonaDetailsProps = {
  data: PersonaData;
  changedProperties?: string[];
};

export default function PersonaDetails(props: PersonaDetailsProps) {
  const { changedProperties } = props;

  return (
    <article className="w-full max-w-4xl mx-auto px-1 md:px-4">
      <h1 className="text-2xl lg:text-4xl font-bold mt-4">
        {props.data.name}
      </h1>

      <div className="flex items-start gap-6 text-default-700 mt-1 font-light">
        <span>{props.data.age}</span>

        <div className="flex items-center gap-1">
          <PersonIcon />
          <span>{props.data.gender}</span>
        </div>
      </div>

      <Spacer y={6} />

      <div className="space-y-6">
        <Section
          title="Universe"
          content={props.data.universe}
          isChanged={changedProperties?.includes("universe")}
        />

        <Section
          title="Appearance"
          content={props.data.appearance}
          isChanged={changedProperties?.includes("appearance")}
        />

        <Section
          title="Personality"
          content={props.data.personality}
          isChanged={changedProperties?.includes("personality")}
        />

        <Section
          title="Background"
          content={props.data.background}
          isChanged={changedProperties?.includes("background")}
        />

        <Section
          title="Occupation"
          content={props.data.occupation}
          isChanged={changedProperties?.includes("occupation")}
        />

        {props.data.other && (
          <>
            <Section
              title="Other"
              content={props.data.other}
              isChanged={changedProperties?.includes("other")}
            />
          </>
        )}
      </div>
    </article>
  );
}

type SectionProps = {
  title: string;
  isChanged?: boolean;
  content: string;
};

function Section(props: SectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="flex items-start gap-2 text-xl font-medium">
        {props.title} {props.isChanged && "changed"}
      </h3>

      <p className="text-default-900 leading-relaxed">{props.content}</p>
    </div>
  );
}
