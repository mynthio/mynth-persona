"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useParams, useRouter } from "next/navigation";
import { usePersonaPublishStatusQuery } from "@/app/_queries/use-persona-publish-status.query";
import { publishPersonaAction } from "@/actions/publish-persona.action";
import { useSWRConfig } from "swr";
import { GlobeIcon } from "@phosphor-icons/react/dist/ssr";
import { usePersonaQuery } from "@/app/_queries/use-persona.query";
import { updatePersonaVisibilityAction } from "@/actions/update-persona-visibility.action";
import { TrashIcon, ProhibitIcon } from "@phosphor-icons/react/dist/ssr";
import { AlertCircle, AlertTriangle } from "lucide-react";

export default function WorkbenchSidebarManage() {
  const params = useParams<{ personaId: string }>();
  const router = useRouter();
  const personaId = params.personaId;
  const { data, isLoading } = usePersonaPublishStatusQuery(personaId);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { mutate } = useSWRConfig();
  const { data: persona } = usePersonaQuery(personaId);

  const isPublished = data?.visibility === "public";
  const isPending = data?.lastPublishAttempt?.status === "pending";
  const hasProfileImage = Boolean(persona?.profileImageIdMedia);

  const lastAttemptAt = useMemo(() => {
    const ts = data?.lastPublishAttempt?.attemptedAt;
    return ts ? new Date(ts).toLocaleString() : undefined;
  }, [data?.lastPublishAttempt?.attemptedAt]);

  function onPublishClick() {
    setShowPublishDialog(true);
    setTermsAccepted(false);
  }

  async function onPublishConfirm() {
    if (!personaId) return;
    if (!termsAccepted) {
      toast("Please accept the terms of use to continue");
      return;
    }
    try {
      setSubmitting(true);
      await publishPersonaAction(personaId);
      toast("Publishing started", {
        description: "We'll update the status once it's complete.",
      });
      // Refresh status now
      await mutate(`/api/personas/${personaId}/publish-status`);
      setShowPublishDialog(false);
    } catch (e: any) {
      const message = e?.message || "Failed to start publishing";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onUnpublish() {
    if (!personaId) return;
    try {
      setSubmitting(true);
      await updatePersonaVisibilityAction(personaId, "private");
      toast("Persona unpublished");
      await Promise.all([
        mutate(`/api/personas/${personaId}/publish-status`),
        mutate(`/api/personas/${personaId}`),
      ]);
    } catch (e: any) {
      const message = e?.message || "Failed to unpublish persona";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!personaId) return;
    try {
      setSubmitting(true);
      await updatePersonaVisibilityAction(personaId, "deleted");
      toast("Persona deleted");
      await Promise.all([
        mutate(`/api/personas/${personaId}/publish-status`),
        mutate(`/api/personas/${personaId}`),
      ]);
      // Navigate to workbench without persona ID
      router.push("/workbench");
      setShowDeleteDialog(false);
    } catch (e: any) {
      const message = e?.message || "Failed to delete persona";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const disabledReason = useMemo(() => {
    if (!personaId) return "No persona selected";
    if (!hasProfileImage) return "Profile image is required to publish";
    if (isPublished) return "Persona is already published";
    if (isPending) return "Publishing in progress";
    return undefined;
  }, [personaId, hasProfileImage, isPublished, isPending]);

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 p-2">
        <Card className="text-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Manage</CardTitle>
              {isPublished ? (
                <Badge variant="default" className="text-[11px]">
                  Published
                </Badge>
              ) : isPending ? (
                <Badge variant="secondary" className="text-[11px]">
                  Pending
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[11px]">
                  Not published
                </Badge>
              )}
            </div>
            <CardDescription className="text-[12px] leading-relaxed">
              Publishing makes your persona discoverable on the public feed and
              allows them to generate content on the platform. After you
              publish, your persona will be reviewed automatically and should be
              published within a few minutes.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isPublished && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Permanent License</AlertTitle>
                <AlertDescription className="text-[12px]">
                  By publishing, you granted us a perpetual license to use this
                  persona. It cannot be unpublished or deleted through normal
                  means. For exceptional removal requests, contact hi@prsna.app
                  or Discord.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                {!isLoading && lastAttemptAt && (
                  <span className="text-[11px] text-muted-foreground">
                    Last attempt: {lastAttemptAt}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isPublished
                  ? `Published${
                      data?.publishedAt
                        ? ` on ${new Date(data.publishedAt).toLocaleString()}`
                        : ""
                    }`
                  : isPending
                  ? "Publishing in progress…"
                  : "Not published"}
              </p>
              {data?.lastPublishAttempt?.status === "failed" &&
                data.lastPublishAttempt.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-[12px]">
                      {data.lastPublishAttempt.error}
                    </AlertDescription>
                  </Alert>
                )}
            </div>

            {!hasProfileImage && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[12px]">
                  A profile image is required to publish your persona.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-8 px-3 text-[12px]"
                onClick={onPublishClick}
                disabled={Boolean(disabledReason) || submitting || isLoading}
                title={disabledReason}
              >
                <GlobeIcon />
                {submitting
                  ? "Publishing…"
                  : isPublished
                  ? "Published"
                  : "Publish persona"}
              </Button>

              {isPublished && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-[12px]"
                  onClick={onUnpublish}
                  disabled={true}
                  title="You granted a perpetual license when publishing. Contact hi@prsna.app for exceptional removal requests."
                >
                  <ProhibitIcon />
                  Unpublish
                </Button>
              )}

              <Button
                size="sm"
                variant="destructive"
                className="h-8 px-3 text-[12px]"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isPublished || submitting || isLoading}
                title={
                  isPublished
                    ? "You granted a perpetual license when publishing. Contact hi@prsna.app for exceptional removal requests."
                    : "Delete persona"
                }
              >
                <TrashIcon />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publish Persona</DialogTitle>
            <DialogDescription>
              Publishing your persona makes it permanent and public.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Once you publish your persona, it becomes publicly discoverable
              and can generate content on the platform.
            </p>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>This action is permanent</AlertTitle>
              <AlertDescription>
                You will not be able to unpublish or delete your persona once
                it's published. Please read our{" "}
                <a
                  href="/terms-of-service#publishing-personas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium hover:underline"
                >
                  Publishing Personas policy
                </a>{" "}
                before continuing.
              </AlertDescription>
            </Alert>

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) =>
                  setTermsAccepted(checked === true)
                }
              />
              <label
                htmlFor="terms"
                className="text-sm leading-tight cursor-pointer flex-1"
              >
                I have read and agree to the{" "}
                <a
                  href="/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  Terms of Service
                </a>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPublishDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={onPublishConfirm}
              disabled={!termsAccepted || submitting}
            >
              {submitting ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Persona</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this persona? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
