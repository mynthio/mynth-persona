"use client";

import { usePersonaStore } from "@/providers/persona-store-provider";
import PersonaEvents from "./persona-events";
import useSWR from "swr";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { useEffect } from "react";
import { PersonaWithVersion } from "@/types/persona.type";

export default function Home() {
  const [personaId] = usePersonaId();
  const { data, setData, isLoadingData, setIsLoadingData } = usePersonaStore(
    (state) => state
  );

  const { isLoading, data: personaData } = useSWR<PersonaWithVersion>(
    personaId ? `/api/personas/${personaId}` : null,
    {
      revalidateOnMount: false,
    }
  );

  useEffect(() => {
    if (isLoading) {
      setIsLoadingData(true);
    }
  }, [isLoading]);

  useEffect(() => {
    if (personaData) {
      setData(personaData);
    }
  }, [personaData]);

  return (
    <>
      <pre>
        {JSON.stringify(
          {
            isLoadingData,
            data,
          },
          null,
          1
        )}
      </pre>
      <PersonaEvents />
    </>
  );
}
