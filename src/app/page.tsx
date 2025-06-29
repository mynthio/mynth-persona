import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { logger } from "@/lib/logger";
import { PersonaStoreProvider } from "@/providers/persona-store-provider";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
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

  const personaWithVersion =
    userId && personaId
      ? await getPersonaWithVersion({
          userId,
          personaId,
          versionId: personaVersionId,
        })
      : undefined;

  logger.debug(personaWithVersion);

  return (
    <Suspense>
      <PersonaStoreProvider initialData={personaWithVersion}>
        <Home />
      </PersonaStoreProvider>
    </Suspense>
  );
}
