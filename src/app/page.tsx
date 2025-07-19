import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Home from "./_components/home";

import { getPersonaWithVersion } from "@/services/persona/get-persona-with-version";
import AnonymousHome from "./_components/anonymous-home";
import {
  transformToPublicPersona,
  transformToPublicPersonaVersion,
} from "@/schemas";

type HomePageProps = {
  searchParams: Promise<{
    persona_id?: string;
    version_id?: string;
  }>;
};

export default async function HomePage(props: HomePageProps) {
  const { userId } = await auth();

  if (!userId) {
    return <AnonymousHome />;
  }

  const searchParams = await props.searchParams;

  const personaId = searchParams.persona_id;
  const personaVersionId = searchParams.version_id;

  // Validate persona ID format - should start with 'prs_'
  if (personaId && !personaId.startsWith("prs_")) {
    redirect("/");
  }

  const personaWithVersion = personaId
    ? await getPersonaWithVersion({
        userId,
        personaId,
        versionId: personaVersionId,
      })
    : undefined;

  return (
    <Home
      persona={
        personaWithVersion
          ? transformToPublicPersona(personaWithVersion)
          : undefined
      }
      personaVersion={
        personaWithVersion
          ? transformToPublicPersonaVersion(personaWithVersion.version)
          : undefined
      }
    />
  );
}
