"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useParams, useRouter } from "next/navigation";
import { usePersonaPublishStatusQuery } from "@/app/_queries/use-persona-publish-status.query";
import { publishPersonaAction } from "@/actions/publish-persona.action";
import { useSWRConfig } from "swr";
import { GlobeIcon } from "@phosphor-icons/react/dist/ssr";
import { usePersonaQuery } from "@/app/_queries/use-persona.query";
import { updatePersonaVisibilityAction } from "@/actions/update-persona-visibility.action";
import { TrashIcon, ProhibitIcon } from "@phosphor-icons/react/dist/ssr";

export default function WorkbenchSidebarManage() {
  const params = useParams<{ personaId: string }>();
  const router = useRouter();
  const personaId = params.personaId;
  const { data, isLoading } = usePersonaPublishStatusQuery(personaId);
  // removed consent state
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const { data: persona } = usePersonaQuery(personaId);

  const isPublished = data?.visibility === "public";
  const isPending = data?.lastPublishAttempt?.status === "pending";
  const hasProfileImage = Boolean(persona?.profileImageId);

  const lastAttemptAt = useMemo(() => {
    const ts = data?.lastPublishAttempt?.attemptedAt;
    return ts ? new Date(ts).toLocaleString() : undefined;
  }, [data?.lastPublishAttempt?.attemptedAt]);

  async function onPublish() {
    if (!personaId) return;
    try {
      setSubmitting(true);
      await publishPersonaAction(personaId);
      toast.add({
        title: "Publishing started",
        description: "We'll update the status once it's complete.",
      });
      // Refresh status now
      await mutate(`/api/personas/${personaId}/publish-status`);
    } catch (e: any) {
      const message = e?.message || "Failed to start publishing";
      toast.add({ title: message });
    } finally {
      setSubmitting(false);
    }
  }

  async function onUnpublish() {
    if (!personaId) return;
    try {
      setSubmitting(true);
      await updatePersonaVisibilityAction(personaId, "private");
      toast.add({ title: "Persona unpublished" });
      await Promise.all([
        mutate(`/api/personas/${personaId}/publish-status`),
        mutate(`/api/personas/${personaId}`),
      ]);
    } catch (e: any) {
      const message = e?.message || "Failed to unpublish persona";
      toast.add({ title: message });
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!personaId) return;
    try {
      setSubmitting(true);
      await updatePersonaVisibilityAction(personaId, "deleted");
      toast.add({ title: "Persona deleted" });
      await Promise.all([
        mutate(`/api/personas/${personaId}/publish-status`),
        mutate(`/api/personas/${personaId}`),
      ]);
      // Navigate to workbench without persona ID
      router.push('/workbench');
      setShowDeleteDialog(false);
    } catch (e: any) {
      const message = e?.message || "Failed to delete persona";
      toast.add({ title: message });
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
        <div className="rounded-md border border-zinc-200/60 bg-zinc-50 p-3 text-sm text-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">Manage</span>
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

          <div className="text-[12px] leading-relaxed text-zinc-700">
            Publishing makes your persona discoverable on the public feed. You
            can unlist or update later.
          </div>
          <div className="mt-2 text-[12px] leading-relaxed text-zinc-700">
            After you publish, your persona will be reviewed automatically and
            should be published within a few minutes.
          </div>

          <div className="mt-3 grid gap-2">
            <div className="text-[12px] text-zinc-700">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status</span>
                {!isLoading && lastAttemptAt && (
                  <span className="text-[11px] text-zinc-500">
                    Last attempt: {lastAttemptAt}
                  </span>
                )}
              </div>
              <div className="mt-1">
                {isPublished ? (
                  <span>
                    Published
                    {data?.publishedAt
                      ? ` on ${new Date(data.publishedAt).toLocaleString()}`
                      : ""}
                  </span>
                ) : isPending ? (
                  <span>Publishing in progress…</span>
                ) : (
                  <span>Not published</span>
                )}
              </div>
              {data?.lastPublishAttempt?.status === "failed" &&
                data.lastPublishAttempt.error && (
                  <div className="mt-1 text-red-600">
                    {data.lastPublishAttempt.error}
                  </div>
                )}
            </div>

            {!hasProfileImage && (
              <div className="mt-1 text-[12px] text-amber-600">
                A profile image is required to publish your persona.
              </div>
            )}

            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                className="h-8 px-3 text-[12px]"
                onClick={onPublish}
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
                  disabled={submitting || isLoading}
                  title="Unpublish persona"
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
                disabled={submitting || isLoading}
                title="Delete persona"
              >
                <TrashIcon />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Persona</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this persona? This action cannot be undone.
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
