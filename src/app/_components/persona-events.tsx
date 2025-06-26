"use client";

import { usePersonaId } from "@/hooks/use-persona-id.hook";
import useSWR from "swr";
import { GetPersonaEventsByIdResponse } from "../api/personas/[personaId]/events/route";
import { Skeleton } from "@heroui/skeleton";
import { Spinner } from "@heroui/spinner";

export default function PersonaEvents() {
  const [personaId] = usePersonaId();

  const { data, isLoading, error } = useSWR<GetPersonaEventsByIdResponse>(
    personaId ? `/api/personas/${personaId}/events` : null
  );

  if (isLoading) return <Loading />;

  return <pre>{JSON.stringify(data, null, 1)}</pre>;
}

function Loading() {
  return (
    <div className="flex justify-center items-center h-32">
      <Spinner />
    </div>
  );
}
