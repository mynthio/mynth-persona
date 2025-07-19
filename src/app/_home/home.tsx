import { db } from "@/db/drizzle";
import { personas } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import CreatePersona from "./create-persona";
import PersonaProfile from "./persona-profile";
import { PersonaData } from "@/types/persona.type";
import { getImageUrl } from "@/lib/utils";

type HomeProps = {
  personaId?: string;
};

export default async function Home({ personaId }: HomeProps) {
  const { userId } = await auth();
  if (!userId) redirect("/legacy");

  if (!personaId) {
    return <CreatePersona />;
  }

  const persona = await db.query.personas
    .findFirst({
      where: and(eq(personas.id, personaId), eq(personas.userId, userId)),
      with: {
        currentVersion: true,
      },
    })
    .then((persona) => {
      if (!persona || !persona.currentVersion) redirect("/");
      const { currentVersion, ...rest } = persona;
      return {
        ...rest,
        data: currentVersion.data as PersonaData,
      };
    });

  return <PersonaProfile data={persona.data} profileImageUrl={persona.profileImageId ? getImageUrl(persona.profileImageId) : undefined} />;
}
