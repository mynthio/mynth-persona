"use client";

import { Persona, PersonaWithCurrentVersion } from "@/types/persona.type";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { useQueryState } from "nuqs";
import { Card, CardHeader, CardBody } from "@heroui/card";
import useSWR from "swr";
import { Image } from "@heroui/react";
import Link from "next/link";

export default function LibraryModal() {
  const [isOpen, setIsOpen] = useQueryState("library");

  const { data: personas } = useSWR<PersonaWithCurrentVersion[]>(
    isOpen ? "/api/personas" : null
  );

  return (
    <Modal
      size="5xl"
      backdrop={"blur"}
      isOpen={!!isOpen}
      onClose={() => setIsOpen(null)}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Library</ModalHeader>
            <ModalBody>
              {personas?.map((persona) => (
                <Card shadow="none" className="py-4 max-w-96" key={persona.id}>
                  <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                    <Link
                      href={`/?persona_id=${persona.id}`}
                      className="font-bold text-large"
                    >
                      {persona.currentVersion.personaData.name}
                    </Link>
                  </CardHeader>
                  <CardBody className="overflow-visible py-2">
                    <Image
                      alt="Card background"
                      className="object-cover rounded-xl"
                      src="https://heroui.com/images/hero-card-complete.jpeg"
                      width={270}
                    />
                  </CardBody>
                </Card>
              ))}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
