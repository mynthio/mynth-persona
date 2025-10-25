"use client";

import { Button } from "@/components/mynth-ui/base/button";
import {
  Dialog,
  DialogBackdrop,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from "@/components/mynth-ui/base/dialog";
import { Form } from "@/components/mynth-ui/base/form";
import { Field } from "@/components/mynth-ui/base/field";
import { Input } from "@/components/mynth-ui/base/input";
import { TextareaAutosize } from "@/components/mynth-ui/base/textarea";
import { Switch } from "@/components/mynth-ui/base/switch";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { publishScenarioFormSchema } from "@/schemas/shared";
import {
  Popover,
  PopoverContent,
  PopoverPopup,
  PopoverPositioner,
  PopoverTrigger,
} from "@/components/mynth-ui/base/popover";
import { InfoIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonGroup } from "@/components/mynth-ui/base/button-group";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import { ScrollArea } from "@/components/mynth-ui/base/scroll-area";
import { publishScenarioAction } from "@/actions/scenarios";
import { useToast } from "@/components/ui/toast";

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
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="p-0 overflow-hidden justify-center">
          <DialogTitle className="sr-only">Publish scenario</DialogTitle>
          <ScrollArea>
            <div className="py-[32px]">
              <PublishScenarioForm scenarioId={params.id} />
            </div>
          </ScrollArea>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

type PublishScenarioFormProps = {
  scenarioId: string;
};

function PublishScenarioForm(props: PublishScenarioFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiGenerate, setAiGenerate] = useState(true);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({}); // Clear previous errors
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);

      // Extract fields
      const anonymous = formData.get("anonymous") === "on";

      // Build validation data - only include title/description when AI generation is disabled
      const validationData = aiGenerate
        ? {
            title: "",
            description: "",
            anonymous,
            aiGenerate,
          }
        : {
            title: (formData.get("title") as string) || "",
            description: (formData.get("description") as string) || "",
            anonymous,
            aiGenerate,
          };

      const formValidation = publishScenarioFormSchema.safeParse(validationData);

      // Collect validation errors
      const validationErrors: Record<string, string> = {};

      if (!formValidation.success) {
        console.log(formValidation.error.flatten());
        const fieldErrors = formValidation.error.flatten().fieldErrors;
        Object.entries(fieldErrors).forEach(([field, errors]) => {
          if (errors && errors.length > 0) {
            validationErrors[field] = errors[0]; // Take first error message
          }
        });
      }

      console.log(validationErrors);

      // If there are validation errors, set them and return
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Call server action to publish scenario
      const result = await publishScenarioAction({
        scenarioId: props.scenarioId,
        title: validationData.title,
        description: validationData.description,
        anonymous: validationData.anonymous,
        aiGenerate: validationData.aiGenerate,
      });

      if (result.success) {
        // Show success toast
        toast.add({
          title: "Scenario publishing started",
          description:
            "Your scenario is being reviewed and will be published shortly.",
          type: "success",
        });

        // Close dialog and navigate back to scenario page
        router.replace(`/scenarios/${props.scenarioId}`);
      }
    } catch (error) {
      // Handle server-side errors
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "An unexpected error occurred" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      className="space-y-[24px] mt-[24px] max-w-[400px] mx-auto"
      onSubmit={handleSubmit}
      errors={errors}
      onClearErrors={(clearedErrors) =>
        setErrors(clearedErrors as Record<string, string>)
      }
    >
      <Field.Root name="aiGenerate">
        <div className="flex items-center gap-[12px]">
          <Switch.Root
            name="aiGenerate"
            checked={aiGenerate}
            onCheckedChange={setAiGenerate}
          >
            <Switch.Thumb />
          </Switch.Root>
          <div className="flex flex-col gap-[4px]">
            <Field.Label className="mb-0">
              Generate title and description with AI
            </Field.Label>
            <Field.Description>
              AI will automatically generate a title and description based on
              your scenario content
            </Field.Description>
          </div>
        </div>
        <Field.Error />
      </Field.Root>

      {!aiGenerate && (
        <>
          <Field.Root name="title">
            <Field.Label>Title</Field.Label>
            <Input name="title" placeholder="Adventure of..." required />
            <Field.Error />
            <Field.Description>Title</Field.Description>
          </Field.Root>

          <Field.Root name="description">
            <Field.Label>Description</Field.Label>
            <TextareaAutosize
              minRows={2}
              maxRows={4}
              name="description"
              placeholder="A thrilling adventure where..."
              required
            />
            <Field.Error />
            <Field.Description>
              Description of scenario, should be catchy and describe scenario
              summary. 1-3 sentences.
            </Field.Description>
          </Field.Root>
        </>
      )}

      <Field.Root name="anonymous">
        <div className="flex items-center gap-[12px]">
          <Switch.Root name="anonymous">
            <Switch.Thumb />
          </Switch.Root>
          <div className="flex flex-col gap-[4px]">
            <Field.Label className="mb-0">Publish anonymously</Field.Label>
            <Field.Description>
              In anonymous mode, your name and profile won't be displayed
              publicly. You will still be able to manage scenario.
            </Field.Description>
          </div>
        </div>
        <Field.Error />
      </Field.Root>

      <div className="space-y-[12px] pt-[12px]">
        {errors.submit && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-[12px] p-[12px]">
            {errors.submit}
          </div>
        )}

        <ButtonGroup className="justify-end">
          <PublishInfo />
          <Button type="submit" color="primary" disabled={isSubmitting}>
            {isSubmitting ? "Publishing..." : "Publish Scenario"}
          </Button>
        </ButtonGroup>
      </div>
    </Form>
  );
}

function PublishInfo() {
  return (
    <Popover modal={false}>
      <PopoverTrigger nativeButton render={<Button size="icon" />}>
        <InfoIcon />
      </PopoverTrigger>
      <PopoverPositioner side="top">
        <PopoverPopup className="max-w-[420px]">
          <PopoverContent>
            <h3 className="text-[1.05rem] font-[500] font-onest">
              Publishing scenario
            </h3>

            <p>
              After you submit the scenario to publish, we will perform an
              automated AI review of scenario content to make sure the content
              is appropraite. This process may take few minutes, before the
              scenario is published.
              <br />
              <br /> Scenario might not be published if it has inappropriate
              content.
              <br />
              <br /> Scenario background image will be automatically created
              with AI. For now this is only option available, but we plan more
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
          </PopoverContent>
        </PopoverPopup>
      </PopoverPositioner>
    </Popover>
  );
}
