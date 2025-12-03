"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogContentCustom,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageId } from "@/hooks/use-image-id.hook";
import { useMediaComments } from "@/hooks/use-media-comments.hook";
import { getImageUrl } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";
import { Button, buttonVariants } from "@/components/ui/button";
import { DownloadIcon } from "@phosphor-icons/react/dist/ssr";
import { ExternalLink, Cpu } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";

import { cn } from "@/lib/utils";
import {
  Download02,
  Download04,
  User03,
  X,
  Trash01,
  CpuChip02,
} from "@untitledui/icons";
import { useForm } from "@tanstack/react-form";
import { useAuth } from "@clerk/nextjs";
import { z } from "zod";
import { Field, FieldDescription, FieldError } from "@/components/ui/field";

import {
  publishMediaAction,
  createMediaCommentAction,
  deleteMediaCommentAction,
} from "@/app/(art)/_actions/actions";
import { toast } from "sonner";
import { ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import posthog from "posthog-js";
import { Link } from "@/components/ui/link";
import { getModelDisplayName } from "@/config/shared/image-models";

export function MediaDialog() {
  const [imageId, setImageId] = useImageId();
  const isOpen = Boolean(imageId);
  const [isPublishing, setIsPublishing] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    isOpen && imageId ? `/api/media/${imageId}` : null,
    fetcher
  );

  useEffect(() => {
    if (!isOpen || !imageId) return;

    try {
      posthog.capture("media_dialog_opened", {
        media_id: imageId,
        has_persona: Boolean(data?.persona),
        tags_count: Array.isArray(data?.tags) ? data.tags.length : 0,
      });
    } catch {}
  }, [isOpen, imageId, data]);

  const handleClose = () => setImageId(null);

  const handleDownload = () => {
    if (!imageId) return;
    try {
      posthog.capture("media_download_clicked", {
        media_id: imageId,
      });
    } catch {}
    const link = document.createElement("a");
    link.href = getImageUrl(imageId, "full");
    link.download = `image-${imageId}.webp`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogOverlay className="bg-background/70 backdrop-blur-[2px]" />
      <DialogContentCustom
        showCloseButton={false}
        className="sm:max-w-full max-w-full rounded-none w-full h-full p-0 gap-0 bg-none bg-transparent border-none lg:overflow-hidden overflow-y-auto flex flex-col outline-none"
      >
        <DialogClose asChild className="fixed left-4 top-4 z-50">
          <Button size="lg">
            <X strokeWidth={1.5} />
            Close
          </Button>
        </DialogClose>

        <DialogTitle className="sr-only">Image Details</DialogTitle>

        {data && (
          <div className="flex flex-col lg:grid lg:grid-cols-3 lg:h-full w-full">
            <div className="shrink-0 h-[70vh] lg:h-full lg:col-span-2 w-full relative backdrop-grayscale-100 backdrop-blur-[2px]">
              <img
                loading="lazy"
                alt="Generated image"
                src={getImageUrl(data.id)}
                className="absolute top-0 w-full h-full object-contain"
              />
              {/* <DialogClose className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white lg:hidden z-10">
                <X strokeWidth={1.5} />
              </DialogClose> */}
            </div>

            <div className="bg-popover p-2 min-h-[30vh] lg:flex-1 lg:min-h-0 lg:h-full flex flex-col gap-4 lg:overflow-hidden">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={data?.user?.imageUrl} />
                    <AvatarFallback>
                      <User03 className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    by{" "}
                    <span className="font-medium text-foreground">
                      {data.user
                        ? data.user.displayName || data.user.username
                        : "Anonymous"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Creator and Persona Info */}
              {data.persona && (
                <div className="flex flex-col gap-2 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      with{" "}
                      <Link
                        href={`/persona/${data.persona.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        persona
                      </Link>
                    </span>
                  </div>
                </div>
              )}

              {data.generation?.aiModel && (
                <div>
                  <Badge
                    variant="secondary"
                    className="gap-1.5 py-1 px-2 font-normal text-muted-foreground bg-muted/50 border-border/50 border hover:bg-muted/50"
                  >
                    <CpuChip02 strokeWidth={1.5} />
                    {getModelDisplayName(data.generation.aiModel)}
                  </Badge>
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {data.tags?.map((tag: string) => (
                  <Badge variant="outline" key={tag} asChild>
                    <Link href={`/art?tags=${tag}`}>{tag}</Link>
                  </Badge>
                ))}
              </div>

              <div className="lg:flex-1 lg:min-h-0 flex flex-col lg:justify-end lg:overflow-hidden">
                <Comments mediaId={data.id} />
              </div>
            </div>
          </div>
        )}
      </DialogContentCustom>
    </Dialog>
  );
}

function Comments({ mediaId }: { mediaId: string }) {
  const { comments, isLoading, mutate } = useMediaComments(mediaId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const { userId } = useAuth();
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      const result = await deleteMediaCommentAction({ commentId });

      if (result.success) {
        try {
          posthog.capture("media_comment_deleted", {
            media_id: mediaId,
            comment_id: commentId,
          });
        } catch {}
        toast.success("Comment deleted successfully");

        // Mutate locally without refetch
        mutate((currentData?: any) => {
          if (!currentData?.comments) return currentData;
          return {
            ...currentData,
            comments: currentData.comments.filter(
              (comment: any) => comment.id !== commentId
            ),
          };
        }, false);
      } else {
        toast.error(result.error || "Failed to delete comment");
      }
    } catch (error) {
      toast.error("An error occurred while deleting your comment");
    } finally {
      setDeletingCommentId(null);
    }
  };

  const commentSchema = z.object({
    content: z
      .string()
      .min(1, "Comment cannot be empty")
      .max(500, "Comment cannot exceed 500 characters"),
  });

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const hasMoreContent = scrollTop + clientHeight < scrollHeight - 10;
      setShowBottomShadow(hasMoreContent);
    };

    // Check initially and after comments load
    checkScroll();

    // Check on scroll
    container.addEventListener("scroll", checkScroll);

    // Check when comments change
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", checkScroll);
      resizeObserver.disconnect();
    };
  }, [comments, isLoading]);

  const form = useForm({
    defaultValues: {
      content: "",
    },
    validators: {
      onSubmit: commentSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await createMediaCommentAction({
          mediaId,
          content: value.content,
        });

        if (result.success) {
          try {
            posthog.capture("media_comment_submitted", {
              media_id: mediaId,
              comment_length: value.content.length,
            });
          } catch {}
          toast.success("Comment posted successfully");
          form.reset();

          // Mutate locally without refetch
          mutate((currentData?: any) => {
            if (!result.comment) return currentData;
            return {
              ...currentData,
              comments: [...(currentData?.comments || []), result.comment],
            };
          }, false);
        } else {
          toast.error(result.error || "Failed to post comment");
        }
      } catch (error) {
        toast.error("An error occurred while posting your comment");
      }
    },
  });

  return (
    <div className="flex gap-2 flex-col-reverse lg:flex-col lg:h-full justify-start lg:overflow-hidden">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : (
        <div className="relative lg:h-full lg:min-h-0 lg:max-h-full">
          <div
            ref={scrollContainerRef}
            className="flex flex-col gap-3 lg:overflow-y-auto lg:h-full lg:min-h-0 lg:max-h-full"
          >
            {comments.map((comment: any) => {
              const isCommentAuthor = userId === comment.userId;
              return (
                <div key={comment.id} className="flex gap-2">
                  <div className="shrink-0">
                    <Avatar>
                      <AvatarImage src={comment.user.imageUrl} />
                      <AvatarFallback>
                        {comment.user.displayName || comment.user.username}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.user.displayName || comment.user.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      {isCommentAuthor && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto h-6 w-6 p-0"
                              disabled={deletingCommentId === comment.id}
                            >
                              <Trash01 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete comment?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete your comment.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteComment(comment.id)}
                                className={cn(
                                  buttonVariants({ variant: "destructive" })
                                )}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground prose dark:prose-invert">
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {showBottomShadow && (
            <div className="hidden lg:block absolute bottom-0 left-0 right-0 h-12 pointer-events-none bg-linear-to-t from-popover to-transparent" />
          )}
        </div>
      )}

      <form
        className="shrink-0 h-auto"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Field name="content">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            const remainingChars = 500 - field.state.value.length;

            return (
              <Field data-invalid={isInvalid}>
                <InputGroup>
                  <InputGroupTextarea
                    placeholder="Add comment"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    maxLength={500}
                  />

                  <InputGroupAddon align="block-end">
                    <InputGroupText className="text-muted-foreground text-xs">
                      {remainingChars} characters left
                    </InputGroupText>

                    <InputGroupButton
                      className="ml-auto"
                      variant="default"
                      type="submit"
                      disabled={!form.state.canSubmit}
                    >
                      {form.state.isSubmitting ? "Posting..." : "Post Comment"}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </form>
    </div>
  );
}
