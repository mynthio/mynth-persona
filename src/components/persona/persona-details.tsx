import { PersonaData } from "@/types/persona-version.type";
import { PersonIcon } from "@phosphor-icons/react/dist/ssr";

type PersonaDetailsProps = {
  personaData: PersonaData;
};

export default function PersonaDetails(props: PersonaDetailsProps) {
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
      <h3>Universe</h3>
      <p>{props.personaData.universe}</p>
      <h3>Appearance</h3>
      <p>{props.personaData.appearance}</p>
      <h3>Personality</h3>
      <p>{props.personaData.personality}</p>
      <h3>Background</h3>
      <p>{props.personaData.background}</p>
      <h3>Occupation</h3>
      <p>{props.personaData.occupation}</p>
      <h3>Other</h3>
      <p>{props.personaData.other}</p>
    </article>
  );
}
