"use client";

import { ArrowReloadVerticalIcon, Eraser01Icon, FallingStarIcon, Image02Icon, Loading02Icon, Message01Icon, PencilEdit02Icon, PlusSignIcon, SparklesIcon, StopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { DeepPartial } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  creatorPersonaGenerateClientSchema,
  CreatorPersonaGenerateClientResponse,
} from "@/schemas/shared/creator/persona-generate-client.schema";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { Response } from "@/components/ai-elements/response";
import { useGenerationContext } from "@/contexts/generation-context";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  CUSTOM_PROPERTY_NAME_MAX_LENGTH,
  personaNewCustomPropertyNameSchema,
} from "@/schemas/shared/persona/persona-property-name.schema";
import { CreateChatButton } from "@/components/create-chat-button";
import { useUserPersonasMutation } from "@/app/_queries/use-user-personas.query";
import PersonaCreator from "../persona-creator";
import { Link } from "@/components/ui/link";
import { snakeCase, spaceCase } from "case-anything";
import { z } from "zod";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ThinkingProcess } from "./thinking-process";

dayjs.extend(relativeTime);

const AUTO_CREATE_STARTED = new Set<string>();

const FOLLOW_UP_SUGGESTIONS = [
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
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

type RateLimitInfo = {
  limit: number;
  remaining: number;
  reset: number;
};

export default function CreatorScreen() {
  const { isSignedIn } = useUser();
  const signedIn = Boolean(isSignedIn);
  const mutateUserPersonas = useUserPersonasMutation();
  const { setActiveStream, isGenerating, registerResetCallback } =
    useGenerationContext();
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [personaId, setPersonaId] = useState<string | undefined>();
  const [rateLimitError, setRateLimitError] = useState<RateLimitInfo | null>(
    null
  );
  const [showResultView, setShowResultView] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const handledPromptRef = useRef<string | null>(null);

  const { isLoading, object, submit, error, clear, stop } = useObject({
    api: "/api/creator/personas/generate",
    schema: creatorPersonaGenerateClientSchema,
    onError: (err: any) => {
      setActiveStream(null);
      try {
        const errorObject = JSON.parse(err.message);
        if (errorObject.error === "rate_limit_exceeded") {
          setRateLimitError({
            limit: errorObject.limit,
            remaining: errorObject.remaining,
            reset: errorObject.reset,
          });
        }
      } catch {
        // ignore parse errors
      }
    },
    onFinish: (data) => {
      setActiveStream(null);
      if (data.object?.personaId) {
        setPersonaId(data.object.personaId);
        if (signedIn) {
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
      if (isGenerating) return;

      const trimmed = text.trim();
      if (!trimmed) return;

      setActiveStream("persona");
      setRateLimitError(null);
      setPersonaId(undefined);
      setSubmittedPrompt(trimmed);
      setShowResultView(true);
      submit({ prompt: trimmed, modelId: options?.model });
    },
    [isGenerating, setActiveStream, submit]
  );

  const handleRetry = useCallback(
    (options?: { model?: string }) => {
      if (isGenerating) return;

      const trimmed = submittedPrompt.trim();
      if (!trimmed) return;

      setActiveStream("persona");
      submit({
        prompt: trimmed,
        personaId,
        modelId: options?.model,
      });
    },
    [isGenerating, personaId, submittedPrompt, setActiveStream, submit]
  );

  const handleReset = useCallback(() => {
    clear();
    setActiveStream(null);
    setSubmittedPrompt("");
    setPersonaId(undefined);
    setRateLimitError(null);
    setShowResultView(false);
  }, [clear, setActiveStream]);

  useEffect(() => {
    registerResetCallback(handleReset);
  }, [registerResetCallback, handleReset]);

  useEffect(() => {
    const promptParam = searchParams.get("prompt");

    if (promptParam === null) {
      handledPromptRef.current = null;
      return;
    }

    if (handledPromptRef.current === promptParam) {
      return;
    }

    handledPromptRef.current = promptParam;

    const removePromptParam = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("prompt");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    };

    const trimmed = promptParam.trim();
    if (!trimmed) {
      removePromptParam();
      return;
    }

    // Defer the submit to avoid synchronous state updates in effect
    setTimeout(() => {
      handleSubmit(trimmed);
    }, 0);
    removePromptParam();
  }, [handleSubmit, pathname, router, searchParams]);

  const shouldShowResult =
    showResultView ||
    isGenerating ||
    isLoading ||
    Boolean(object) ||
    Boolean(error);

  return (
    <AnimatePresence mode="wait">
      {shouldShowResult ? (
        <motion.div
          key="result"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="w-full max-w-3xl mx-auto flex flex-col gap-[12px] mt-[32px] px-[12px] md:px-0 relative"
        >
          <div
            className="
              bg-background/70 text-surface-100/80 font-medium backdrop-blur-lg border border-surface-200/50
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
              bg-white/50 mt-[12px] text-surface-foreground/80 font-medium backdrop-blur-lg border border-surface-200/70
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
              <HugeiconsIcon icon={Loading02Icon} className="animate-spin" />
            </div>
          ) : error ? (
            <CreatorError
              isSignedIn={signedIn}
              rateLimitError={rateLimitError}
              onRetry={handleRetry}
              onReset={handleReset}
              clearErrors={() => setRateLimitError(null)}
            />
          ) : (
            <PersonaStreamingResult
              key={submittedPrompt || "pending"}
              object={object}
            />
          )}

          <Footer
            personaId={personaId}
            onRetry={handleRetry}
            onReset={handleReset}
            onStop={stop}
            isLoading={isLoading}
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
          <PersonaCreator onGenerate={handleSubmit} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CreatorError({
  isSignedIn,
  rateLimitError,
  onRetry,
  onReset,
  clearErrors,
}: {
  isSignedIn: boolean;
  rateLimitError: RateLimitInfo | null;
  onRetry: () => void;
  onReset: () => void;
  clearErrors: () => void;
}) {
  return (
    <div className="w-full flex flex-col max-w-xl mx-auto text-center items-center justify-center mt-0 md:mt-[42px] z-10">
      <img
        className="rounded-[24px] max-w-[280px] md:max-w-[320px] w-full h-auto object-cover object-top"
        src="https://cdn.persona.mynth.io/static/persona-sad.webp"
        alt="Persona - Something Went Wrong"
      />

      {rateLimitError ? (
        <p>
          <b className="font-onest font-bold text-[1.1rem]">
            Rate Limit Reached
          </b>
          <br /> You&apos;ve reached the rate limit for generating personas.
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
            <br /> Please try again later. If the issue persist, please contact
            our support, or create issue on{" "}
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer">
              Discord
            </a>
            .
          </p>

          <div className="flex items-center justify-center gap-[12px]">
            <Button
              className="mt-[24px] font-onest font-extrabold"
              variant="ghost"
              type="button"
              onClick={() => {
                clearErrors();
                onRetry();
              }}
            >
              Retry
            </Button>
            <Button
              className="mt-[24px] font-onest font-extrabold"
              variant="ghost"
              type="button"
              onClick={onReset}
            >
              Try new prompt
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Footer({
  onRetry,
  onReset,
  onStop,
  personaId,
  isLoading,
}: {
  onRetry: () => void;
  onReset: () => void;
  onStop: () => void;
  personaId?: string;
  isLoading: boolean;
}) {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const { isGenerating, setActiveStream } = useGenerationContext();

  const loader = useMemo(
    () => (
      <div className="size-[42px] rounded-[16px] flex items-center justify-center text-surface-100">
        <HugeiconsIcon icon={Loading02Icon} className="animate-spin" />
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
        <>
          {loader}
          <Button
            type="button"
            onClick={() => {
              onStop();
              setActiveStream(null);
            }}
            variant="ghost"
            className="text-[0.98rem] text-surface-100 h-[42px] px-[12px] md:px-[24px] rounded-[16px] hover:bg-surface/20 font-mono"
            aria-label="Stop generation"
          >
            <HugeiconsIcon icon={StopIcon} size={16} />
            Stop
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            onClick={onReset}
            variant="ghost"
            size="icon"
            className="size-[42px] rounded-[16px] text-surface-100 hover:bg-surface/20 font-mono"
            disabled={isLoading}
            aria-label="New prompt"
          >
            <HugeiconsIcon icon={Eraser01Icon} size={16} />
          </Button>

          <Button
            type="button"
            onClick={() => onRetry()}
            variant="ghost"
            className="text-[0.98rem] text-surface-100 h-[42px] px-[12px] md:px-[24px] rounded-[16px] hover:bg-surface/20 font-mono"
            disabled={isLoading || isGenerating}
          >
            <HugeiconsIcon icon={ArrowReloadVerticalIcon} size={16} />
            Retry
          </Button>

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
                  <HugeiconsIcon icon={SparklesIcon} size={16} />
                  Workbench
                </Link>

                <CreateChatButton personaId={personaId}>
                  <HugeiconsIcon icon={Message01Icon} size={16} />
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
                  <HugeiconsIcon icon={Image02Icon} size={16} />
                </Link>
              </>
            )
          ) : (
            <Button
              onClick={() => openSignIn()}
              variant="ghost"
              className="text-[0.98rem] text-surface-100 h-[42px] px-[12px] md:px-[24px] rounded-[16px] hover:bg-surface/20 font-mono"
            >
              <HugeiconsIcon icon={FallingStarIcon} size={16} /> Sign in for more
            </Button>
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
  const thinking = object?.thinking;
  const { isGenerating } = useGenerationContext();
  const [extraSections, setExtraSections] = useState<string[]>([]);

  const addNewSection = useCallback(
    (name: string) => {
      if (isGenerating) return;
      if (!name) return;
      if (extraSections.includes(name)) return;
      if (persona && (persona as any)?.extensions?.[name]) return;
      setExtraSections((prev) => [...prev, name]);
    },
    [extraSections, isGenerating, persona]
  );

  const randomFollowUps = (() => {
    const extensionKeys = persona?.extensions
      ? Object.keys(persona.extensions)
      : [];

    const available = FOLLOW_UP_SUGGESTIONS.filter(
      (item) =>
        !extensionKeys.includes(item.key) && !extraSections.includes(item.key)
    );

    const seed = object?.personaId ?? persona?.name ?? "persona";
    const sorted = [...available].sort((a, b) => {
      const hashA = hashString(`${seed}:${a.key}`);
      const hashB = hashString(`${seed}:${b.key}`);
      return hashA - hashB;
    });

    return sorted.slice(0, 3);
  })();

  // isThinking: undefined = not started, true = thinking, false = thinking done
  const isThinking = object?.isThinking;

  // Show thinking panel while actively thinking (before isThinking becomes false)
  const showThinkingPanel = Boolean(thinking) && isThinking !== false;

  // Show content once we have persona data (isThinking is false)
  const showContent = isThinking === false && Boolean(persona);

  return (
    <div className="flex flex-col gap-[42px] mt-[36px] min-h-[calc(50vh)] w-full">
      <AnimatePresence>
        {showThinkingPanel ? (
          <ThinkingProcess
            key="thinking"
            content={thinking ?? ""}
            isActive={isGenerating}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showContent ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col gap-[42px] w-full"
          >
            {persona?.name && (
              <div>
                <h2 className="text-[2.3rem] text-left font-extralight font-onest">
                  {persona.name}
                </h2>

                <div className="flex items-center gap-[12px]">
                  {persona?.age && (
                    <p className="text-left font-onest font-extralight">
                      Age: {persona.age}
                    </p>
                  )}

                  {persona?.gender && (
                    <p className="text-left font-onest font-extralight">
                      Gender:{" "}
                      <span className="capitalize">{persona.gender}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {persona?.summary && (
              <Response className="text-[1.05rem] font-light">
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

            {persona?.speakingStyle && (
              <Section
                title="speakingStyle"
                content={persona.speakingStyle}
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

            {object?.personaId && randomFollowUps.length > 0 && (
              <>
                <ButtonGroup>
                  <AddCustomPropertyPopover onAdd={addNewSection} />

                  <ButtonGroupSeparator />

                  {randomFollowUps.map((item) => (
                    <Button
                      key={`suggest_${item.key}`}
                      disabled={isGenerating}
                      onClick={() => addNewSection(item.key)}
                    >
                      <HugeiconsIcon icon={FallingStarIcon} size={12} /> {item.label}
                    </Button>
                  ))}
                </ButtonGroup>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
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
      <PopoverTrigger asChild>
        <Button disabled={isGenerating}>
          <HugeiconsIcon icon={PlusSignIcon} size={12} /> Custom
        </Button>
      </PopoverTrigger>

      <PopoverContent side="top" align="start" className="min-w-[260px]">
        <form
          onSubmit={async (e) => {
            e.preventDefault();

            const formData = new FormData(e.currentTarget);

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
          <div className="space-y-3">
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

  const { submit, isLoading, object, stop } = useObject({
    api: "/api/creator/personas/properties/generate",
    schema: z.object({
      [title]: z.string(),
    }),
    onError: () => {
      setActiveStream(null);
    },
    onFinish: () => {
      setActiveStream(null);
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
        personaId,
        property: title,
        action,
      });
    },
    [submit, personaId, title, isGenerating, setActiveStream]
  );

  const autoStartedRef = useRef(false);
  const autoKey = useMemo(
    () => `${personaId ?? "none"}::${title}`,
    [personaId, title]
  );

  useEffect(() => {
    if (
      autoGenerateAction === "create" &&
      !autoStartedRef.current &&
      !content &&
      personaId &&
      !isGenerating &&
      !isLoading &&
      !AUTO_CREATE_STARTED.has(autoKey)
    ) {
      AUTO_CREATE_STARTED.add(autoKey);
      autoStartedRef.current = true;
      handleAction("create");
    }
  }, [
    autoGenerateAction,
    content,
    personaId,
    isGenerating,
    isLoading,
    handleAction,
    autoKey,
  ]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl leading-tight capitalize">
          <span className="text-primary font-bold mr-1">#</span>
          {spaceCase(title, { keepSpecialCharacters: false })}
        </h3>
        {personaId && activeStream !== "persona" && (
          <ButtonGroup>
            {activeStream === `section__${title}` && isLoading ? (
              <Button
                onClick={() => {
                  stop();
                  setActiveStream(null);
                }}
                variant="ghost"
              >
                <HugeiconsIcon icon={StopIcon} size={12} />
                Stop
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isGenerating}
                  onClick={() => handleAction("expand")}
                >
                  <HugeiconsIcon icon={ArrowReloadVerticalIcon} size={12} />
                  Expand
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={isGenerating}
                  onClick={() => handleAction("rewrite")}
                >
                  <HugeiconsIcon icon={PencilEdit02Icon} size={12} />
                  Rewrite
                </Button>
              </>
            )}
          </ButtonGroup>
        )}
      </div>

      {isLoading && !currentContent && (
        <HugeiconsIcon icon={Loading02Icon} className="animate-spin my-[24px] ml-[6px]" />
      )}

      <Response className="text-[1.05rem] w-full">{currentContent}</Response>
    </div>
  );
}
