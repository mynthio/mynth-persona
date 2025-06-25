import { PersonaData } from "@/types/persona-version.type";
import { Badge } from "@heroui/badge";
import { Chip } from "@heroui/chip";
import { PersonIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";

type PersonaDetailsProps = {
  personaData: PersonaData;
  changedProperties?: string[];
};

export default function PersonaDetails(props: PersonaDetailsProps) {
  const { changedProperties } = props;

  return (
    <article className="prose">
      <h1>{props.personaData.name}</h1>
      <div className="flex items-center gap-2">
        <div>
          <p>{props.personaData.age}</p>
        </div>
        <div className="flex items-center gap-2">
          <PersonIcon />
          <p>{props.personaData.gender}</p>
        </div>
      </div>
      <h3>Universe {changedProperties?.includes("universe") && "changed"}</h3>
      <p>{props.personaData.universe}</p>
      <h3 className="flex items-start gap-2">
        Appearance{" "}
        {changedProperties?.includes("appearance") && (
          <Chip size="sm" color="warning" variant="flat">
            Updated
          </Chip>
        )}
      </h3>
      <p>{props.personaData.appearance}</p>
      <h3>
        Personality {changedProperties?.includes("personality") && "changed"}
      </h3>
      <p>{props.personaData.personality}</p>
      <h3>
        Background {changedProperties?.includes("background") && "changed"}
      </h3>
      <p>{props.personaData.background}</p>
      <h3>
        Occupation {changedProperties?.includes("occupation") && "changed"}
      </h3>
      <p>{props.personaData.occupation}</p>
      <h3>Other {changedProperties?.includes("other") && "changed"}</h3>
      <p>{props.personaData.other}</p>
    </article>
  );
}
