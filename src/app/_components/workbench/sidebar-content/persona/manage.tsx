"use client";

import { AlertCircleIcon, CancelCircleIcon, CheckmarkCircle02Icon, Clock01Icon, Delete02Icon, Globe02Icon, Image02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useParams, useRouter } from "next/navigation";
import { usePersonaPublishStatusQuery } from "@/app/_queries/use-persona-publish-status.query";
import { publishPersonaAction } from "@/actions/publish-persona.action";
import { useSWRConfig } from "swr";
import { usePersonaQuery } from "@/app/_queries/use-persona.query";
import { updatePersonaVisibilityAction } from "@/actions/update-persona-visibility.action";
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
      <div className="flex-1 min-h-0 p-3 space-y-3">
        {/* Publish status card */}
        <div className="rounded-xl border border-border/30 bg-card/20 backdrop-blur-sm overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-7 rounded-lg bg-primary/10 text-primary">
                  <HugeiconsIcon icon={Globe02Icon} className="size-4" />
                </div>
                <span className="text-sm font-semibold text-foreground/90">
                  Publishing
                </span>
              </div>
              {isPublished ? (
                <Badge
                  variant="default"
                  className="text-[10px] bg-emerald-500/15 text-emerald-500 border-emerald-500/20"
                >
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" />
                  Published
                </Badge>
              ) : isPending ? (
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-amber-500/15 text-amber-500 border-amber-500/20"
                >
                  <HugeiconsIcon icon={Clock01Icon} className="size-3" />
                  Pending
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[10px] border-border/40 text-muted-foreground"
                >
                  Not published
                </Badge>
              )}
            </div>

            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Publishing makes your persona discoverable on the public feed.
              After publishing, it will be reviewed automatically and should be
              live within a few minutes.
            </p>
          </div>

          <Separator className="bg-border/20" />

          <div className="p-4 space-y-3">
            {isPublished && (
              <Alert className="border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-[12px] font-semibold">
                  Permanent License
                </AlertTitle>
                <AlertDescription className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
                  By publishing, you granted a perpetual license. Contact
                  hi@prsna.app or Discord for removal requests.
                </AlertDescription>
              </Alert>
            )}

            {/* Status detail */}
            <div className="rounded-lg bg-card/30 border border-border/20 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground/70 uppercase tracking-wider">
                  Status
                </span>
                {!isLoading && lastAttemptAt && (
                  <span className="text-[10px] text-muted-foreground">
                    {lastAttemptAt}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-muted-foreground">
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
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <AlertDescription className="text-[11px]">
                      {data.lastPublishAttempt.error}
                    </AlertDescription>
                  </Alert>
                )}
            </div>

            {!hasProfileImage && (
              <div className="flex items-center gap-2 rounded-lg bg-card/30 border border-border/20 p-3">
                <HugeiconsIcon icon={Image02Icon} className="size-4 text-muted-foreground shrink-0" />
                <p className="text-[11px] text-muted-foreground">
                  A profile image is required to publish your persona.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="h-8 px-4 text-[12px] rounded-full bg-primary shadow-[0_8px_20px_-8px_rgba(124,58,237,0.5)] ring-1 ring-primary/30 transition-all hover:-translate-y-px hover:brightness-110"
                onClick={onPublishClick}
                disabled={Boolean(disabledReason) || submitting || isLoading}
                title={disabledReason}
              >
                <HugeiconsIcon icon={Globe02Icon} className="size-3.5" />
                {submitting
                  ? "Publishing…"
                  : isPublished
                    ? "Published"
                    : "Publish"}
              </Button>

              {isPublished && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-[12px] rounded-full border-border/40 bg-card/30 hover:bg-card/60"
                  onClick={onUnpublish}
                  disabled={true}
                  title="You granted a perpetual license when publishing. Contact hi@prsna.app for exceptional removal requests."
                >
                  <HugeiconsIcon icon={CancelCircleIcon} className="size-3.5" />
                  Unpublish
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-[12px] rounded-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isPublished || submitting || isLoading}
                title={
                  isPublished
                    ? "You granted a perpetual license when publishing. Contact hi@prsna.app for exceptional removal requests."
                    : "Delete persona"
                }
              >
                <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="max-w-md border-border/40 bg-card/95 backdrop-blur-xl">
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

            <Alert className="border-amber-500/20 bg-amber-500/5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle>This action is permanent</AlertTitle>
              <AlertDescription>
                You will not be able to unpublish or delete your persona once
                it's published. Please read our{" "}
                <a
                  href="/terms-of-service#publishing-personas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium hover:no-underline"
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
              className="rounded-full border-border/50"
            >
              Cancel
            </Button>
            <Button
              onClick={onPublishConfirm}
              disabled={!termsAccepted || submitting}
              className="rounded-full bg-primary shadow-[0_8px_20px_-8px_rgba(124,58,237,0.5)]"
            >
              {submitting ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="border-border/40 bg-card/95 backdrop-blur-xl">
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
              className="rounded-full border-border/50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={submitting}
              className="rounded-full"
            >
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
