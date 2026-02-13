"use client";

import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TextareaAutosize } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { publishScenarioFormSchema } from "@/schemas/shared";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ButtonGroup } from "@/components/ui/button-group";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { publishScenarioAction } from "@/actions/scenarios";
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";

export function PublishScenarioDialog() {
  const searchParams = useSearchParams();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const action = searchParams.get("action");

  return (
    <Dialog
      open={Boolean(action === "publish")}
      onOpenChange={() => router.replace(`/scenarios/${params.id}`)}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Publish scenario</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100vh-10rem)]">
          <div className="py-4">
            <PublishScenarioForm scenarioId={params.id} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

type PublishScenarioFormProps = {
  scenarioId: string;
};

function PublishScenarioForm(props: PublishScenarioFormProps) {
  const [submitError, setSubmitError] = useState<string>("");
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      anonymous: false,
      aiGenerate: true,
    },
    validators: {
      onSubmit: publishScenarioFormSchema.parse,
    },
    onSubmit: async ({ value }) => {
      setSubmitError("");

      try {
        // Call server action to publish scenario
        const result = await publishScenarioAction({
          scenarioId: props.scenarioId,
          title: value.title,
          description: value.description,
          anonymous: value.anonymous,
          aiGenerate: value.aiGenerate,
        });

        if (result.success) {
          // Show success toast
          toast.success("Scenario publishing started", {
            description:
              "Your scenario is being reviewed and will be published shortly.",
          });

          // Close dialog and navigate back to scenario page
          router.replace(`/scenarios/${props.scenarioId}`);
        } else {
          setSubmitError("Unable to publish scenario");
        }
      } catch (error) {
        // Handle server-side errors
        if (error instanceof Error) {
          setSubmitError(error.message);
        } else {
          setSubmitError("An unexpected error occurred");
        }
      }
    },
  });

  return (
    <form
      className="space-y-[24px] mt-[24px] max-w-[400px] mx-auto"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="aiGenerate">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <div className="flex items-center gap-[12px]">
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
                <div className="flex flex-col gap-[4px]">
                  <FieldLabel className="mb-0">
                    Generate title and description with AI
                  </FieldLabel>
                  <FieldDescription>
                    AI will automatically generate a title and description based
                    on your scenario content
                  </FieldDescription>
                </div>
              </div>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="aiGenerate">
        {(aiGenerateField) =>
          !aiGenerateField.state.value && (
            <>
              <form.Field name="title">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Adventure of..."
                        autoComplete="off"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                      <FieldDescription>Title</FieldDescription>
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="description">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                      <TextareaAutosize
                        id={field.name}
                        minRows={2}
                        maxRows={4}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="A thrilling adventure where..."
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                      <FieldDescription>
                        Description of scenario, should be catchy and describe
                        scenario summary. 1-3 sentences.
                      </FieldDescription>
                    </Field>
                  );
                }}
              </form.Field>
            </>
          )
        }
      </form.Field>

      <form.Field name="anonymous">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <div className="flex items-center gap-[12px]">
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
                <div className="flex flex-col gap-[4px]">
                  <FieldLabel className="mb-0">Publish anonymously</FieldLabel>
                  <FieldDescription>
                    In anonymous mode, your name and profile won&apos;t be
                    displayed publicly. You will still be able to manage
                    scenario.
                  </FieldDescription>
                </div>
              </div>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      <div className="space-y-[12px] pt-[12px]">
        {submitError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-[12px] p-[12px]">
            {submitError}
          </div>
        )}

        <ButtonGroup className="justify-end">
          <PublishInfo />
          <Button type="submit" disabled={form.state.isSubmitting}>
            {form.state.isSubmitting ? "Publishing..." : "Publish Scenario"}
          </Button>
        </ButtonGroup>
      </div>
    </form>
  );
}

function PublishInfo() {
  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button size="icon">
          <HugeiconsIcon icon={InformationCircleIcon} />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-[420px]">
        <div className="space-y-2">
          <h3 className="text-[1.05rem] font-[500] font-onest">
            Publishing scenario
          </h3>

          <p className="text-sm">
            After you submit the scenario to publish, we will perform an
            automated AI review of scenario content to make sure the content is
            appropraite. This process may take few minutes, before the scenario
            is published.
            <br />
            <br /> Scenario might not be published if it has inappropriate
            content.
            <br />
            <br /> Scenario background image will be automatically created with
            AI. For now this is only option available, but we plan more
            customization in future.
            <br />
            <br />
            In case of any issue, please report them on our Discord:{" "}
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-500 hover:text-purple-600"
            >
              Discord
            </a>
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
