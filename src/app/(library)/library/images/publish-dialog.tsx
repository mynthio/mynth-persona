"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ShareNetwork } from "@phosphor-icons/react/dist/ssr";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (isAnonymous: boolean) => Promise<void>;
  isPublishing: boolean;
}

export function PublishDialog({
  open,
  onOpenChange,
  onPublish,
  isPublishing,
}: PublishDialogProps) {
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handlePublish = async () => {
    await onPublish(isAnonymous);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish to Art Gallery</DialogTitle>
          <DialogDescription>
            Share your image with the community. You can choose to publish
            anonymously or with your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between space-x-4 py-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="anonymous-mode" className="text-sm font-medium">
              Publish anonymously
            </Label>
            <p className="text-sm text-muted-foreground">
              Your username will not be displayed with this image
            </p>
          </div>
          <Switch
            id="anonymous-mode"
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPublishing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            className="w-full sm:w-auto"
          >
            {isPublishing ? (
              <>
                <Spinner className="mr-2 size-4" />
                Publishing...
              </>
            ) : (
              <>
                <ShareNetwork className="mr-2 size-4" />
                Publish
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
