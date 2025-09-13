"use client";
import { PublicPersona, PublicPersonaVersion } from "@/schemas";
import { SWRConfig } from "swr";
import WorkbenchLayout from "./workbench/workbench-layout";
import WorkbenchContent from "./workbench/workbench-content";
import WorkbenchSidebar from "./workbench/workbench-sidebar";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import PersonaCreator from "./persona-creator";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const PublicPersonas = dynamic(() => import("./public-personas"), {
  ssr: false,
});

type HomeProps = {
  persona?: PublicPersona;
  personaVersion?: PublicPersonaVersion;
};

export default function Home(props: HomeProps) {
  const [personaId] = usePersonaId();

  if (!personaId) {
    return (
      <>
        <PersonaCreator />
        <Suspense fallback={<div>Loading...</div>}>
          <PublicPersonas />
        </Suspense>
      </>
    );
  }

  return (
    <>
      <SWRConfig
        value={{
          fallback: props.persona
            ? {
                [`/api/personas/${props.persona.id}`]: props.persona,
                [`/api/personas/${props.persona.id}/versions/${
                  props.personaVersion!.id
                }`]: props.personaVersion,
                [`/api/personas/${props.persona.id}/versions/current`]:
                  props.personaVersion,
              }
            : {},
        }}
      >
        <WorkbenchLayout>
          <WorkbenchContent />
          <WorkbenchSidebar />
        </WorkbenchLayout>
      </SWRConfig>
    </>
  );
}
