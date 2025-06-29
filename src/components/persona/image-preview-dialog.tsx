"use client";

import { Image } from "@heroui/image";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Card } from "@heroui/card";
import { DownloadIcon } from "@phosphor-icons/react/dist/ssr";
import { ReactNode } from "react";

interface ImagePreviewDialogProps {
  src: string;
  alt: string;
  trigger: ReactNode;
  title?: string;
  downloadFileName?: string;
}

export default function ImagePreviewDialog({
  src,
  alt,
  trigger,
  title = "Image Preview",
  downloadFileName,
}: ImagePreviewDialogProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFileName || "image.webp";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  return (
    <>
      <Card isPressable onPress={onOpen} className="p-0" shadow="none">
        {trigger}
      </Card>
      <Modal
        size="3xl"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
              <ModalBody className="p-4">
                <div className="flex justify-center">
                  <Image
                    src={src}
                    alt={alt}
                    loading="lazy"
                    className="max-w-full h-auto"
                    removeWrapper
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  startContent={<DownloadIcon />}
                  onPress={handleDownload}
                >
                  Download
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
