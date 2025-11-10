"use client";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { DeepPartial } from "ai";
import PersonaCreator from "./persona-creator";
import dynamic from "next/dynamic";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  creatorPersonaGenerateClientSchema,
  CreatorPersonaGenerateClientResponse,
} from "@/schemas/shared/creator/persona-generate-client.schema";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowsClockwiseIcon,
  ArrowsVerticalIcon,
  ChatsTeardropIcon,
  CircleNotchIcon,
  EraserIcon,
  ImageIcon,
  PencilLineIcon,
  PlusIcon,
  ShootingStarIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/components/ui/link";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { parseAsBoolean, useQueryState } from "nuqs";
import { snakeCase, spaceCase } from "case-anything";
import { Response } from "@/components/ai-elements/response";
import { useGenerationContext } from "@/contexts/generation-context";
import { z } from "zod";
import { Button } from "@/components/mynth-ui/base/button";
import { ButtonGroup } from "@/components/mynth-ui/base/button-group";
import {
  Popover,
  PopoverContent,
  PopoverFooter,
  PopoverPopup,
  PopoverPositioner,
  PopoverSubmitButton,
  PopoverTrigger,
} from "@/components/mynth-ui/base/popover";
import { Input } from "@/components/mynth-ui/base/input";
import { Form } from "@base-ui-components/react/form";
import {
  CUSTOM_PROPERTY_NAME_MAX_LENGTH,
  personaNewCustomPropertyNameSchema,
} from "@/schemas/shared/persona/persona-property-name.schema";
import { CreateChatButton } from "@/components/create-chat-button";
import { useUserPersonasMutation } from "@/app/_queries/use-user-personas.query";
import { BetaImageLimitBanner } from "@/components/beta-image-limit-banner";

dayjs.extend(relativeTime);

// Prevent duplicate auto-generation submissions (e.g., React StrictMode double-invoking effects in dev)
const AUTO_CREATE_STARTED = new Set<string>();

const PublicPersonas = dynamic(() => import("./public-personas"), {
  ssr: false,
});

export default function Home() {
  const { isSignedIn } = useUser();
  const mutateUserPersonas = useUserPersonasMutation();
  const [isCreator, setIscreator] = useQueryState(
    "creator",
    parseAsBoolean.withOptions({ history: "push" }).withDefault(false)
  );
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [personaId, setPersonaId] = useState<string | undefined>(undefined);
  const { isGenerating, activeStream, setActiveStream } =
    useGenerationContext();

  const [rateLimitError, setRateLimitError] = useState<{
    limit: number;
    remaining: number;
    reset: number;
  } | null>(null);

  const { isLoading, object, submit, error, clear } = useObject({
    api: "/api/creator/personas/generate",
    schema: creatorPersonaGenerateClientSchema,

    onError: (error: any) => {
      setActiveStream(null);
      try {
        const errorObject = JSON.parse(error.message);
        if (errorObject.error === "rate_limit_exceeded") {
          setRateLimitError({
            limit: errorObject.limit,
            remaining: errorObject.remaining,
            reset: errorObject.reset,
          });
        }
      } catch (error) {
        // default, something went wrong error handling
      }
    },

    onFinish: (data) => {
      setActiveStream(null);
      if (data.object?.personaId) {
        setPersonaId(data.object.personaId);
        // Locally add the new persona to the user's personas list without revalidation
        if (isSignedIn) {
          mutateUserPersonas((state) => {
            const createdAt = new Date().toISOString();
            const newItem = {
              id: data.object!.personaId!,
              title: data.object?.persona?.title ?? null,
              currentVersionId: data.object?.versionId ?? null,
              profileImageIdMedia: null,
              createdAt,
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
        }
      }
    },
  });

  const handleSubmit = useCallback(
    (text: string, options?: { model?: string }) => {
      if (isGenerating) {
        return;
      }
      setActiveStream("persona");
      if (text.trim() === "") {
        return;
      }
      setIscreator(true);
      setSubmittedPrompt(text.trim());
      submit({ prompt: text.trim(), modelId: options?.model });
    },
    [submit]
  );

  const handleRetry = useCallback(
    (options?: { model?: string }) => {
      if (isGenerating) {
        return;
      }
      setActiveStream("persona");
      if (submittedPrompt.trim() === "") {
        return;
      }
      submit({
        prompt: submittedPrompt.trim(),
        personaId,
        modelId: options?.model,
      });
    },
    [personaId, submittedPrompt, submit]
  );

  return (
    <AnimatePresence mode="wait">
      {isCreator && (isLoading || object || error) ? (
        <motion.div
          key="result"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="max-w-3xl mx-auto flex flex-col gap-[12px] mt-[32px] px-[12px] md:px-0 relative"
        >
          <div
            className="
              bg-background/70 text-surface-100/80 font-[500] backdrop-blur-lg border border-surface-200/50
              rounded-[16px] rounded-br-[6px] px-[24px] py-[12px]
              max-w-[460px]
              text-right
              self-end w-auto grow-0
            "
          >
            {submittedPrompt}
          </div>

          {object?.persona?.note_for_user && (
            <div
              className="
              bg-white/50 mt-[12px] text-surface-foreground/80 font-[500] backdrop-blur-lg border-[1px] border-surface-200/70
              rounded-[16px] rounded-bl-[6px] px-[24px] py-[12px]
              max-w-[460px]
              text-left
              self-start w-auto grow-0
            "
            >
              {object?.persona?.note_for_user}
            </div>
          )}

          {isLoading && !object ? (
            <div className="w-full h-[80vh] flex items-center justify-center">
              <CircleNotchIcon className="animate-spin" />
            </div>
          ) : error ? (
            <div className="w-full flex flex-col max-w-xl mx-auto text-center items-center justify-center mt-0 md:mt-[42px] z-10">
              <img
                className="rounded-[24px] max-w-[280px] md:max-w-[320px] w-full h-auto object-cover object-top"
                src="https://cdn.persona.mynth.io/static/persona-sad.webp"
                alt="Persona - Something Went Wrong"
              />

              {error && rateLimitError ? (
                <p>
                  <b className="font-onest font-[700] text-[1.1rem]">
                    Rate Limit Reached
                  </b>
                  <br /> You've reached the rate limit for generating personas.
                  <br />
                  <br />
                  Please try again {dayjs(rateLimitError.reset).fromNow()}.
                  {!isSignedIn && (
                    <>
                      <br />
                      <br />
                      Sign in to increase your rate limit.
                    </>
                  )}
                </p>
              ) : (
                <>
                  <p className="mt-[42px] max-w-[320px] text-center text-balance">
                    <b>Oops! Something Went Wrong</b>
                    <br /> Please try again later. If the issue persist, please
                    contact our support, or create issue on{" "}
                    <a
                      href={DISCORD_INVITE_URL}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Discord
                    </a>
                  </p>

                  <div className="flex items-center justify-center gap-[12px]">
                    <button
                      className="mt-[24px] font-onest font-[800] cursor-pointer"
                      type="button"
                      onClick={() => handleRetry()}
                    >
                      Retry
                    </button>
                    <button
                      className="mt-[24px] font-onest font-[800] cursor-pointer"
                      type="button"
                      onClick={() => clear()}
                    >
                      Try new prompt
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <PersonaStreamingResult object={object} />
          )}

          <Footer
            personaId={personaId}
            onRetry={() => {
              handleRetry();
            }}
            isLoading={isLoading}
            isError={!!error}
          />
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <div className="max-w-3xl mx-auto mb-[24px] mt-[24px] px-[12px] md:px-0">
            <BetaImageLimitBanner />
          </div>
          <PersonaCreator
            onGenerate={(prompt, options) => {
              handleSubmit(prompt, options);
            }}
          />
          <Suspense fallback={<div>Loading...</div>}>
            <PublicPersonas />
          </Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Footer({
  onRetry,
  personaId,
  isLoading,
  isError,
}: {
  onRetry: () => void;
  personaId?: string;
  isLoading: boolean;
  isError: boolean;
}) {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const { isGenerating } = useGenerationContext();
  const [model, setModel] = useState<string>("auto");

  const loader = useMemo(
    () => (
      <div className="size-[42px] rounded-[16px] flex items-center justify-center text-surface-100">
        <CircleNotchIcon className="animate-spin" />
      </div>
    ),
    []
  );

  return (
    <div
      className="flex items-center justify-center gap-[12px] self-center mt-[64px]
      rounded-[22px]
      p-[6px]
                  sticky bottom-[100px] md:bottom-[24px] bg-background min-w-content w-auto"
    >
      {isGenerating ? (
        loader
      ) : (
        <>
          <Link
            href="/"
            className="
          text-[0.98rem] text-surface-100
          cursor-pointer
          size-[42px]
          
          rounded-[16px]
          hover:bg-surface/20
          transition-colors
          font-mono
          duration-200
          flex items-center justify-center gap-[9px]
        "
          >
            <EraserIcon size={16} />
          </Link>

          <button
            type="button"
            onClick={onRetry}
            className="
          text-[0.98rem] text-surface-100
          cursor-pointer
          h-[42px] px-[12px] md:px-[24px]
          rounded-[16px]
          hover:bg-surface/20
          transition-colors
          font-mono
          duration-200
          flex items-center gap-[9px]
        "
          >
            <ArrowsClockwiseIcon size={16} />
            Retry
          </button>

          {isSignedIn ? (
            personaId && (
              <>
                <Link
                  href={`/workbench/${personaId}`}
                  className="
        text-[0.98rem] text-surface-100
        cursor-pointer
        h-[42px] px-[12px] md:px-[24px]
        rounded-[16px]
        hover:bg-surface/20
        transition-colors
        font-mono
        duration-200
        flex items-center gap-[9px]
        "
                >
                  <SparkleIcon size={16} />
                  Workbench
                </Link>

                <CreateChatButton personaId={personaId} color="primary">
                  <ChatsTeardropIcon size={16} />
                </CreateChatButton>

                <Link
                  href={`/workbench/${personaId}?workbench=gallery`}
                  className="
      text-[0.98rem] text-surface-100
      cursor-pointer
      h-[42px] w-[42px]
      rounded-[16px]
      hover:bg-surface/20
      transition-colors
      font-mono
      duration-200
      flex items-center justify-center gap-[9px]
      "
                >
                  <ImageIcon size={16} />
                </Link>
              </>
            )
          ) : (
            <button
              onClick={() => openSignIn()}
              className="
          text-[0.98rem] text-surface-100
          cursor-pointer
          h-[42px] px-[12px] md:px-[24px]
          rounded-[16px]
          hover:bg-surface/20
          transition-colors
          font-mono
          duration-200
          flex items-center gap-[9px]
        "
            >
              <ShootingStarIcon size={16} /> Sign in for more
            </button>
          )}
        </>
      )}
    </div>
  );
}

function PersonaStreamingResult({
  object,
}: {
  object: DeepPartial<CreatorPersonaGenerateClientResponse> | undefined;
}) {
  const persona = object?.persona;
  const { isGenerating } = useGenerationContext();
  const [extraSections, setExtraSections] = useState<string[]>([]);

  const addNewSection = useCallback(
    (name: string) => {
      if (isGenerating) return;
      if (!name) return;
      if (extraSections.includes(name)) return;
      // avoid adding if already exists on persona (extensions only)
      if (persona && (persona as any)?.extensions?.[name]) return;
      setExtraSections((prev) => [...prev, name]);
    },
    [extraSections, isGenerating, persona]
  );

  // Candidate follow-up suggestions (exclude required/core properties)
  const FOLLOW_UP_SUGGESTIONS = useMemo(
    () => [
      { key: "hobbies", label: "Hobbies" },
      { key: "top_5_movies", label: "Top 5 Movies" },
      { key: "favorite_foods", label: "Favorite Foods" },
      { key: "skills", label: "Skills" },
      { key: "fears", label: "Fears" },
      { key: "goals", label: "Goals" },
      { key: "relationships", label: "Relationships" },
      { key: "quirks", label: "Quirks" },
      { key: "favorite_music", label: "Favorite Music" },
      { key: "favorite_books", label: "Favorite Books" },
      { key: "favorite_places", label: "Favorite Places" },
      { key: "daily_routine", label: "Daily Routine" },
      { key: "secrets", label: "Secrets" },
      { key: "catchphrases", label: "Catchphrases" },
      { key: "strengths", label: "Strengths" },
      { key: "weaknesses", label: "Weaknesses" },
      { key: "values", label: "Values" },
      { key: "habits", label: "Habits" },
    ],
    []
  );

  // Compute 3 random suggestions not already present in extensions or newly added
  const randomFollowUps = useMemo(() => {
    const extensionKeys = persona?.extensions
      ? Object.keys(persona.extensions)
      : [];

    const available = FOLLOW_UP_SUGGESTIONS.filter(
      (item) =>
        !extensionKeys.includes(item.key) && !extraSections.includes(item.key)
    );

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [FOLLOW_UP_SUGGESTIONS, persona?.extensions, extraSections]);

  return (
    <div className="flex flex-col gap-[42px] mt-[36px] min-h-[calc(50vh)]">
      {persona?.name && (
        <div>
          <h2 className="text-[2.3rem] text-left font-[200] font-onest">
            {persona.name}
          </h2>

          <div className="flex items-center gap-[12px]">
            {persona?.age && (
              <p className="text-left font-onest font-[200]">
                Age: {persona.age}
              </p>
            )}

            {persona?.gender && (
              <p className="text-left font-onest font-[200]">
                Gender: <span className="capitalize">{persona.gender}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {persona?.summary && (
        <Response className="text-[1.05rem] font-[300]">
          {persona.summary}
        </Response>
      )}

      {persona?.appearance && (
        <Section
          title="appearance"
          content={persona.appearance}
          personaId={object?.personaId}
        />
      )}

      {persona?.personality && (
        <Section
          title="personality"
          content={persona.personality}
          personaId={object?.personaId}
        />
      )}

      {persona?.background && (
        <Section
          title="background"
          content={persona.background}
          personaId={object?.personaId}
        />
      )}

      {persona?.occupation && (
        <Section
          title="occupation"
          content={persona.occupation}
          personaId={object?.personaId}
        />
      )}

      {persona?.extensions &&
        Object.entries(persona.extensions).map(
          ([key, value]) =>
            value && (
              <Section
                key={key}
                title={key}
                content={value}
                personaId={object?.personaId}
              />
            )
        )}

      {extraSections.map((prop) => (
        <Section
          key={`extra__${prop}`}
          title={prop}
          content=""
          personaId={object?.personaId}
          autoGenerateAction="create"
        />
      ))}

      {/* Follow-up suggestions (3 random), filtered by existing extensions and newly added sections */}
      {object?.personaId && randomFollowUps.length > 0 && (
        <>
          <ButtonGroup>
            <AddCustomPropertyPopover onAdd={addNewSection} />

            <ButtonGroup.Separator />

            {randomFollowUps.map((item) => (
              <Button
                key={`suggest_${item.key}`}
                disabled={isGenerating}
                onClick={() => addNewSection(item.key)}
              >
                <ShootingStarIcon size={12} /> {item.label}
              </Button>
            ))}
          </ButtonGroup>
        </>
      )}
    </div>
  );
}

function AddCustomPropertyPopover({
  onAdd,
}: {
  onAdd: (property: string) => void;
}) {
  const { isGenerating } = useGenerationContext();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button disabled={isGenerating}>
            <PlusIcon size={12} /> Custom
          </Button>
        }
      />

      <PopoverPositioner side="top" align="start">
        <PopoverPopup className="min-w-[260px]">
          <Form
            onSubmit={async (e) => {
              e.preventDefault();

              const formData = new FormData(e.currentTarget);

              /**
               * Normalize before validation, so users can use spaces, dashes, and underscores
               */
              const normalizedProperty = snakeCase(
                formData.get("property")?.toString() ?? "",
                {
                  keepSpecialCharacters: false,
                }
              );

              const property =
                await personaNewCustomPropertyNameSchema.parseAsync(
                  normalizedProperty
                );

              onAdd(property);
              setIsOpen(false);
            }}
          >
            <PopoverContent>
              <p className="font-onest text-[0.75rem] font-[500] text-surface-foreground/50 mb-[6px] px-[4px]">
                Property name
              </p>
              <Input
                placeholder="Custom property name"
                name="property"
                required
                minLength={1}
                maxLength={CUSTOM_PROPERTY_NAME_MAX_LENGTH}
              />
            </PopoverContent>
            <PopoverFooter>
              <PopoverSubmitButton type="submit">Add</PopoverSubmitButton>
            </PopoverFooter>
          </Form>
        </PopoverPopup>
      </PopoverPositioner>
    </Popover>
  );
}

function Section({
  title,
  content,
  personaId,
  autoGenerateAction,
}: {
  title: string;
  content: string;
  personaId?: string;
  autoGenerateAction?: "create";
}) {
  const { isGenerating, activeStream, setActiveStream } =
    useGenerationContext();

  const { submit, isLoading, object } = useObject({
    api: "/api/creator/personas/properties/generate",
    schema: z.object({
      [title]: z.string(),
    }),
    onError: (error) => {
      setActiveStream(null);
    },
    onFinish: (data) => {
      setActiveStream(null);
      console.log(data);
    },
  });

  const currentContent = useMemo(() => {
    return isLoading ? object?.[title] : object?.[title] || content;
  }, [object, title, content, isLoading]);

  const handleAction = useCallback(
    (action: "expand" | "rewrite" | "create") => {
      if (isGenerating) {
        return;
      }
      setActiveStream(`section__${title}`);
      submit({
        personaId: personaId,
        property: title,
        action,
      });
    },
    [submit, personaId, title, isGenerating, setActiveStream]
  );

  // Auto-start generation for new sections if requested
  const [autoStarted, setAutoStarted] = useState(false);
  const autoKey = useMemo(
    () => `${personaId ?? "none"}::${title}`,
    [personaId, title]
  );
  useEffect(() => {
    if (
      autoGenerateAction === "create" &&
      !autoStarted &&
      !content &&
      personaId &&
      !isGenerating &&
      !isLoading &&
      !AUTO_CREATE_STARTED.has(autoKey)
    ) {
      AUTO_CREATE_STARTED.add(autoKey);
      setAutoStarted(true);
      handleAction("create");
    }
  }, [
    autoGenerateAction,
    autoStarted,
    content,
    personaId,
    isGenerating,
    isLoading,
    handleAction,
    autoKey,
  ]);

  return (
    <div>
      <h3 className="text-[1.1rem] font-bold capitalize">
        {spaceCase(title, { keepSpecialCharacters: false })}
      </h3>

      {isLoading && !currentContent && (
        <CircleNotchIcon className="animate-spin my-[24px] ml-[6px]" />
      )}

      <Response className="text-[1.05rem] mt-[3px]">{currentContent}</Response>

      {personaId && activeStream !== "persona" && (
        <ButtonGroup className="mt-[12px]">
          <Button
            disabled={isGenerating}
            onClick={() => handleAction("expand")}
          >
            <ArrowsVerticalIcon size={12} />
            Expand
          </Button>

          <Button
            disabled={isGenerating}
            onClick={() => handleAction("rewrite")}
          >
            <PencilLineIcon size={12} />
            Rewrite
          </Button>
        </ButtonGroup>
      )}
    </div>
  );
}
