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
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { useRouter } from "next/navigation";

export default function LibraryModal() {
  const [isOpen, setIsOpen] = useQueryState("library");

  const { push } = useRouter();

  const { data: personas } = useSWR<PersonaWithCurrentVersion[]>(
    isOpen ? "/api/personas" : null
  );

  const getPersonaInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPersonaColor = (name: string) => {
    const colors = [
      "primary",
      "secondary",
      "success",
      "warning",
      "danger",
    ] as const;
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <Modal
      scrollBehavior="inside"
      size="5xl"
      backdrop={"blur"}
      isOpen={!!isOpen}
      onClose={() => setIsOpen(null)}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalBody className="p-2 md:p-6">
              <Tabs aria-label="Library" variant="underlined">
                <Tab key="personas" title="Personas">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {personas?.map((persona) => (
                      <Card
                        shadow="sm"
                        className="max-w-full hover:shadow-md transition-shadow cursor-pointer"
                        key={persona.id}
                        isPressable
                        onClick={() => {
                          push(`/?persona_id=${persona.id}&panel=true`);
                        }}
                      >
                        <CardBody className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            {persona.profileImage ? (
                              <Image
                                alt={`${persona.currentVersion.personaData.name} profile`}
                                className="object-cover rounded-full flex-shrink-0"
                                src={persona.profileImage.url}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div
                                className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                                  getPersonaColor(
                                    persona.currentVersion.personaData.name
                                  ) === "primary"
                                    ? "from-blue-500 to-blue-600"
                                    : getPersonaColor(
                                        persona.currentVersion.personaData.name
                                      ) === "secondary"
                                    ? "from-purple-500 to-purple-600"
                                    : getPersonaColor(
                                        persona.currentVersion.personaData.name
                                      ) === "success"
                                    ? "from-green-500 to-green-600"
                                    : getPersonaColor(
                                        persona.currentVersion.personaData.name
                                      ) === "warning"
                                    ? "from-orange-500 to-orange-600"
                                    : "from-red-500 to-red-600"
                                }`}
                              >
                                {getPersonaInitials(
                                  persona.currentVersion.personaData.name
                                )}
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 flex-1">
                              <h4 className="font-semibold text-foreground truncate">
                                {persona.currentVersion.personaData.name}
                              </h4>
                              {persona.currentVersion.personaData
                                .occupation && (
                                <p className="text-sm text-default-500 truncate">
                                  {
                                    persona.currentVersion.personaData
                                      .occupation
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          {persona.currentVersion.personaData.universe && (
                            <div className="flex justify-start">
                              <Chip
                                size="sm"
                                variant="flat"
                                color="primary"
                                className="text-xs"
                              >
                                {persona.currentVersion.personaData.universe
                                  .length > 20
                                  ? `${persona.currentVersion.personaData.universe.slice(
                                      0,
                                      20
                                    )}...`
                                  : persona.currentVersion.personaData.universe}
                              </Chip>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
