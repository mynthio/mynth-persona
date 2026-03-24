"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { PlusSignIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { snakeCase, spaceCase } from "case-anything";
import { usePostHog } from "posthog-js/react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CUSTOM_PROPERTY_NAME_MAX_LENGTH,
  personaNewCustomPropertyNameSchema,
} from "@/schemas/shared/persona/persona-property-name.schema";
import { personaDataSchema } from "@/schemas/backend/persona.schema";
import { createCustomPersonaAction } from "@/actions/create-custom-persona.action";
import { useUserPersonasMutation } from "@/app/_queries/use-user-personas.query";

type FormExtension = { key: string; value: string };

export default function CustomCreatorForm() {
  const router = useRouter();
  const posthog = usePostHog();
  const mutateUserPersonas = useUserPersonasMutation();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [summary, setSummary] = useState("");
  const [appearance, setAppearance] = useState("");
  const [personality, setPersonality] = useState("");
  const [background, setBackground] = useState("");
  const [speakingStyle, setSpeakingStyle] = useState("");
  const [occupation, setOccupation] = useState("");
  const [extensions, setExtensions] = useState<FormExtension[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addExtension = useCallback(
    (propertyName: string) => {
      const normalized = snakeCase(propertyName, {
        keepSpecialCharacters: false,
      });
      if (extensions.some((e) => e.key === normalized)) return;
      setExtensions((prev) => [...prev, { key: normalized, value: "" }]);
    },
    [extensions],
  );

  const removeExtension = useCallback((key: string) => {
    setExtensions((prev) => prev.filter((e) => e.key !== key));
  }, []);

  const updateExtensionValue = useCallback((key: string, value: string) => {
    setExtensions((prev) =>
      prev.map((e) => (e.key === key ? { ...e, value } : e)),
    );
  }, []);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const extensionsRecord: Record<string, string> = {};
    for (const ext of extensions) {
      if (ext.value.trim()) {
        extensionsRecord[ext.key] = ext.value;
      }
    }

    const data = {
      name: name.trim(),
      age: age.trim(),
      gender: gender.trim(),
      summary: summary.trim(),
      appearance: appearance.trim(),
      personality: personality.trim(),
      background: background.trim(),
      ...(speakingStyle.trim() && { speakingStyle: speakingStyle.trim() }),
      ...(occupation.trim() && { occupation: occupation.trim() }),
      ...(Object.keys(extensionsRecord).length > 0 && {
        extensions: extensionsRecord,
      }),
    };

    const result = personaDataSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0]?.toString();
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const { personaId } = await createCustomPersonaAction(result.data);

      posthog?.capture("persona_creation_requested", { mode: "custom" });

      mutateUserPersonas((state) => {
        const newItem = {
          id: personaId,
          title: result.data.name,
          currentVersionId: null,
          profileImageIdMedia: null,
          createdAt: new Date().toISOString(),
        };

        if (!state) {
          return {
            data: [newItem],
            hasMore: true,
            nextCreatedAt: null,
            nextId: null,
          };
        }

        return {
          ...state,
          data: [newItem, ...(state.data ?? [])],
        };
      });

      router.push(`/workbench/${personaId}`);
    } catch {
      setErrors({ _form: "Failed to create persona. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="w-full max-w-3xl mx-auto flex flex-col gap-[24px] mt-[32px] px-[12px] md:px-0"
    >
      <div>
        <h2 className="text-[2rem] font-onest font-extralight">
          Create Custom Persona
        </h2>
        <p className="text-surface-100/60 text-sm mt-1">
          Fill in the details to create your persona manually.
        </p>
      </div>

      {errors._form && (
        <p className="text-destructive text-sm">{errors._form}</p>
      )}

      <div className="flex flex-col gap-[20px]">
        <Field label="Name" error={errors.name}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name or alias"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
          <Field label="Age" error={errors.age}>
            <Input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 28, Early 30s, Unknown"
            />
          </Field>

          <Field label="Gender" error={errors.gender}>
            <Input
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              placeholder="e.g. Female, Male, Non-binary"
            />
          </Field>
        </div>

        <Field label="Summary" error={errors.summary}>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="1-2 sentences capturing the essence and vibe of this persona"
            rows={3}
          />
        </Field>

        <Field label="Appearance" error={errors.appearance}>
          <Textarea
            value={appearance}
            onChange={(e) => setAppearance(e.target.value)}
            placeholder="Physical description — build, features, clothing, distinguishing marks"
            rows={4}
          />
        </Field>

        <Field label="Personality" error={errors.personality}>
          <Textarea
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            placeholder="Traits, temperament, how they interact with others, emotional patterns"
            rows={4}
          />
        </Field>

        <Field label="Background" error={errors.background}>
          <Textarea
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="History, upbringing, key life events, formative experiences"
            rows={4}
          />
        </Field>

        <Field label="Speaking Style" optional error={errors.speakingStyle}>
          <Textarea
            value={speakingStyle}
            onChange={(e) => setSpeakingStyle(e.target.value)}
            placeholder="Speech patterns, mannerisms, vocabulary, communication style"
            rows={3}
          />
        </Field>

        <Field label="Occupation" optional error={errors.occupation}>
          <Input
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="Role, job, or profession"
          />
        </Field>

        {extensions.length > 0 && (
          <div className="flex flex-col gap-[16px] mt-[8px]">
            <h3 className="text-lg font-onest font-light text-surface-100/80">
              Custom Properties
            </h3>

            {extensions.map((ext) => (
              <div key={ext.key} className="flex flex-col gap-[6px]">
                <div className="flex items-center justify-between">
                  <Label className="capitalize text-sm font-onest">
                    {spaceCase(ext.key, { keepSpecialCharacters: false })}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-[28px] text-surface-100/50 hover:text-red-400"
                    onClick={() => removeExtension(ext.key)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                  </Button>
                </div>
                <Textarea
                  value={ext.value}
                  onChange={(e) =>
                    updateExtensionValue(ext.key, e.target.value)
                  }
                  placeholder={`Describe ${spaceCase(ext.key, {
                    keepSpecialCharacters: false,
                  }).toLowerCase()}`}
                  rows={3}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center">
          <AddPropertyPopover onAdd={addExtension} />
        </div>
      </div>

      <div className="flex items-center justify-center mt-[24px] mb-[64px]">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="font-onest font-bold px-[32px] h-[48px] text-[1rem]"
        >
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {isSubmitting ? "Creating..." : "Create Persona"}
        </Button>
      </div>
    </motion.div>
  );
}

function Field({
  label,
  optional,
  error,
  children,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <Label className="text-sm font-onest font-medium">
        {label}
        {optional && (
          <span className="text-surface-100/40 font-normal ml-1">
            (optional)
          </span>
        )}
      </Label>
      {children}
      {error && <p className="text-destructive text-xs mt-0.5">{error}</p>}
    </div>
  );
}

function AddPropertyPopover({ onAdd }: { onAdd: (property: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <HugeiconsIcon icon={PlusSignIcon} size={12} /> Add Property
        </Button>
      </PopoverTrigger>

      <PopoverContent side="top" align="start" className="min-w-[260px]">
        <form
          onSubmit={async (e) => {
            e.preventDefault();

            const formData = new FormData(e.currentTarget);
            const normalizedProperty = snakeCase(
              formData.get("property")?.toString() ?? "",
              { keepSpecialCharacters: false },
            );

            const property =
              await personaNewCustomPropertyNameSchema.parseAsync(
                normalizedProperty,
              );

            onAdd(property);
            setIsOpen(false);
          }}
        >
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-onest text-[0.75rem] font-medium text-surface-foreground/50 mb-[6px] px-[4px]">
                Property name
              </p>
              <Input
                placeholder="Custom property name"
                name="property"
                required
                minLength={1}
                maxLength={CUSTOM_PROPERTY_NAME_MAX_LENGTH}
              />
            </div>
            <div className="w-full flex items-center justify-center">
              <Button
                type="submit"
                className="bg-background text-surface hover:text-surface hover:bg-background/90 w-full"
              >
                Add
              </Button>
            </div>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
