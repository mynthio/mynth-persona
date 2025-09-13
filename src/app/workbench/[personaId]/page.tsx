import { SWRConfig } from "swr";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { getPersonaWithVersion } from "@/services/persona/get-persona-with-version";
import {
  transformToPublicPersona,
  transformToPublicPersonaVersion,
} from "@/schemas/transformers";
import WorkbenchPageClient from "./_client";

export default async function WorkbenchPersonaPage({
  params,
  searchParams,
}: {
  params: Promise<{ personaId: string }>;
  searchParams: Promise<{ versionId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    // No anonymous access
    redirect("/");
  }

  const { personaId } = await params;
  const { versionId } = await searchParams;

  if (!personaId) {
    notFound();
  }

  // Fetch initial data on the server to hydrate SWR and avoid extra round trips
  let publicPersona: any | null = null;
  let publicPersonaVersion: any | null = null;

  try {
    const personaWithVersion = await getPersonaWithVersion({
      userId,
      personaId,
      versionId,
    });

    publicPersona = transformToPublicPersona(personaWithVersion as any);
    publicPersonaVersion = transformToPublicPersonaVersion(
      (personaWithVersion as any).version
    );
  } catch (_e) {
    // Surface as 404 if persona is not accessible to this user
    notFound();
  }

  const swrFallback: Record<string, unknown> = {};
  if (publicPersona) {
    swrFallback[`/api/personas/${personaId}`] = publicPersona;
  }
  if (publicPersonaVersion) {
    const vKey = `/api/personas/${personaId}/versions/${
      versionId || "current"
    }`;
    swrFallback[vKey] = publicPersonaVersion;
  }

  return (
    <SWRConfig value={{ fallback: swrFallback }}>
      <WorkbenchPageClient />
    </SWRConfig>
  );
}
