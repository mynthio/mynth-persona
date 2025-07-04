"use client";

import { PersonaWithCurrentVersion } from "@/types/persona.type";
import { Modal, ModalContent, ModalBody } from "@heroui/modal";
import { useQueryState } from "nuqs";
import { Card, CardBody } from "@heroui/card";
import useSWR from "swr";
import { Image } from "@heroui/react";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Spinner } from "@heroui/spinner";

export default function LibraryModal() {
  const [isOpen, setIsOpen] = useQueryState("library");
  const { isSignedIn } = useAuth();

  const { push } = useRouter();

  const { data: personas, isLoading } = useSWR<PersonaWithCurrentVersion[]>(
    isOpen && isSignedIn ? "/api/personas" : null
  );

  const getPersonaInitials = (name?: string) => {
    if (!name) {
      return "??";
    }
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPersonaColor = (name?: string) => {
    if (!name) {
      return "primary";
    }
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
                  {isLoading && <Spinner />}
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
                            {persona.profileImageId ? (
                              <Image
                                alt={`${persona.currentVersion?.data.name} profile`}
                                className="object-cover rounded-full flex-shrink-0"
                                src={`${process.env.NEXT_PUBLIC_CDN_BASE_URL}/personas/${persona.profileImageId}.webp`}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div
                                className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                                  getPersonaColor(
                                    persona.currentVersion?.data.name
                                  ) === "primary"
                                    ? "from-blue-500 to-blue-600"
                                    : getPersonaColor(
                                        persona.currentVersion?.data.name
                                      ) === "secondary"
                                    ? "from-purple-500 to-purple-600"
                                    : getPersonaColor(
                                        persona.currentVersion?.data.name
                                      ) === "success"
                                    ? "from-green-500 to-green-600"
                                    : getPersonaColor(
                                        persona.currentVersion?.data.name
                                      ) === "warning"
                                    ? "from-orange-500 to-orange-600"
                                    : "from-red-500 to-red-600"
                                }`}
                              >
                                {getPersonaInitials(
                                  persona.currentVersion?.data.name
                                )}
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 flex-1">
                              <h4 className="font-semibold text-foreground truncate">
                                {persona.currentVersion?.data.name}
                              </h4>
                              {persona.currentVersion?.data.occupation && (
                                <p className="text-sm text-default-500 truncate">
                                  {persona.currentVersion?.data.occupation}
                                </p>
                              )}
                            </div>
                          </div>

                          {persona.currentVersion?.data.universe && (
                            <div className="flex justify-start">
                              <Chip
                                size="sm"
                                variant="flat"
                                color="primary"
                                className="text-xs"
                              >
                                {persona.currentVersion?.data.universe.length >
                                20
                                  ? `${persona.currentVersion?.data.universe.slice(
                                      0,
                                      20
                                    )}...`
                                  : persona.currentVersion.data.universe}
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
