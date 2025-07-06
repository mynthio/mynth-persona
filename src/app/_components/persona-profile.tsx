"use client";

import { setPersonaCurrentVersion } from "@/actions/set-persona-current-version.action";
import { usePersonaVersionId } from "@/hooks/use-persona-version-id.hook";
import { usePersonaStore } from "@/providers/persona-store-provider";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { Tooltip } from "@heroui/tooltip";
import {
  PersonIcon,
  SparkleIcon,
  StarIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { deletePersonaVersion } from "@/actions/delete-persona-version.action";

export default function PersonaProfile() {
  const persona = usePersonaStore((state) => state.data);
  const isLoadingData = usePersonaStore((state) => state.isLoadingData);
  const { mutate } = useSWRConfig();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const data = useMemo(() => {
    if (!persona) return null;
    return persona.version.data;
  }, [persona]);

  const changedProperties = useMemo(() => {
    if (!persona) return [];
    return persona.version.changedProperties || [];
  }, [persona]);

  const [personaVersionId, setPersonaVersionId] = usePersonaVersionId();

  const isCurrentVersion = useMemo(
    () => persona?.currentVersionId === persona?.version.id,
    [persona]
  );

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-default-500">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-default-500">No persona</div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <div className="mb-6 mt-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <h1 className="text-2xl font-bold">{data.name}</h1>
              <div className="flex gap-2 justify-end">
                {!isCurrentVersion && (
                  <Button
                    variant="faded"
                    onPress={async () => {
                      if (!persona?.id || !personaVersionId) return;

                      try {
                        await setPersonaCurrentVersion(
                          persona.id,
                          personaVersionId
                        );

                        mutate(`/api/personas/${persona.id}`);
                        mutate(`/api/personas/${persona.id}/events`);

                        addToast({
                          title: "Success",
                          description: "Version set as current",
                          color: "success",
                        });
                      } catch (error) {
                        addToast({
                          title: "Error",
                          description: "Failed to set this version as current",
                          color: "danger",
                        });
                      }
                    }}
                  >
                    Revert to this version
                  </Button>
                )}
                <Button
                  isIconOnly
                  variant="flat"
                  color="danger"
                  onPress={() => setIsDeleteModalOpen(true)}
                >
                  <TrashIcon />
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-4 text-default-600">
              <span>Age: {data.age}</span>
              <div className="flex items-center gap-1">
                <PersonIcon size={16} />
                <span>{data.gender}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ProfileSection
            title="Universe"
            content={data.universe}
            isChanged={changedProperties.includes("universe")}
          />

          <ProfileSection
            title="Appearance"
            content={data.appearance}
            isChanged={changedProperties.includes("appearance")}
          />

          <ProfileSection
            title="Personality"
            content={data.personality}
            isChanged={changedProperties.includes("personality")}
          />

          <ProfileSection
            title="Background"
            content={data.background}
            isChanged={changedProperties.includes("background")}
          />

          <ProfileSection
            title="Occupation"
            content={data.occupation}
            isChanged={changedProperties.includes("occupation")}
          />

          {data.other && (
            <ProfileSection
              title="Other"
              content={data.other}
              isChanged={changedProperties.includes("other")}
            />
          )}
        </div>
      </div>

      <DeleteVersionModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
      />
    </>
  );
}

function DeleteVersionModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const [personaId, setPersonaId] = usePersonaId();
  const [personaVersionId, setPersonaVersionId] = usePersonaVersionId();
  const personaStore = usePersonaStore((state) => state.data);
  const { mutate } = useSWRConfig();

  const [isDeleting, setIsDeleting] = useState(false);

  const isCurrentVersion = useMemo(
    () => personaStore?.currentVersionId === personaVersionId,
    [personaStore, personaVersionId]
  );

  const handleDelete = async () => {
    if (!personaId || !personaVersionId || isDeleting) return;
    setIsDeleting(true);

    try {
      await deletePersonaVersion(personaVersionId);

      addToast({
        title: "Success",
        description: "Version deleted",
        color: "success",
      });

      mutate(`/api/personas/${personaId}/versions/${personaVersionId}`);
      setPersonaVersionId(null);
      mutate(`/api/personas/${personaId}/events`);

      setIsOpen(false);
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to delete version",
        color: "danger",
      });

      return;
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Delete Version
            </ModalHeader>
            <ModalBody>
              {isCurrentVersion ? (
                <p>
                  You can't remove the current version of Persona. Please set
                  another version as current first.
                </p>
              ) : (
                <p>
                  Are you sure you want to delete this version? This action is
                  irreversible.
                </p>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="light"
                onPress={onClose}
                isDisabled={isDeleting}
              >
                Close
              </Button>
              <Button
                color="primary"
                onPress={handleDelete}
                isDisabled={isCurrentVersion}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

type ProfileSectionProps = {
  title: string;
  content: string;
  isChanged?: boolean;
};

function ProfileSection({ title, content, isChanged }: ProfileSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-default-800">
        {title}
        {isChanged && (
          <Tooltip content="Enhanced in this version">
            <SparkleIcon
              weight="duotone"
              size={18}
              className="text-yellow-500"
            />
          </Tooltip>
        )}
      </h3>
      <p className="text-default-700 leading-relaxed">{content}</p>
    </div>
  );
}
