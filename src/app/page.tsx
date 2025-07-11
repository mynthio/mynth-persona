import { logger } from "@/lib/logger";
import { PersonaStoreProvider } from "@/providers/persona-store-provider";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Home from "./_components/home";
import { getPersonaWithVersion } from "@/services/persona/get-persona-with-version";
import { Suspense } from "react";

type HomePageProps = {
  searchParams: Promise<{
    persona_id?: string;
    version_id?: string;
  }>;
};

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;

  const personaId = searchParams.persona_id;
  const personaVersionId = searchParams.version_id;

  const { userId } = await auth();

  // Validate persona ID format - should start with 'prs_'
  if (personaId && !personaId.startsWith("prs_")) {
    redirect("/");
  }

  let personaWithVersion;

  if (userId && personaId) {
    try {
      personaWithVersion = await getPersonaWithVersion({
        userId,
        personaId,
        versionId: personaVersionId,
      });
    } catch (error) {
      // If persona is not found or any other error occurs, redirect to home
      logger.debug("Persona not found, redirecting to home:", error);
      redirect("/");
    }
  }

  return (
    <Suspense>
      <PersonaStoreProvider initialData={personaWithVersion}>
        <Home />
      </PersonaStoreProvider>
    </Suspense>
  );
}
