import { usePersonaStore } from "@/providers/persona-store-provider";
import { Card } from "@heroui/card";
import { useMemo } from "react";

export default function PersonaProfile() {
  const persona = usePersonaStore((state) => state.data);

  const personaData = useMemo(() => {
    if (!persona) return null;
    return persona.version.personaData;
  }, [persona]);

  return (
    <>
      <Card>
        <article>
          <h1>{personaData?.name}</h1>
        </article>
      </Card>
    </>
  );
}
