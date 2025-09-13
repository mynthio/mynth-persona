"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { DeepPartial } from "ai";
import PersonaCreator from "./persona-creator";
import dynamic from "next/dynamic";

import { Suspense, useCallback, useMemo, useState } from "react";
import {
  creatorPersonaGenerateClientSchema,
  CreatorPersonaGenerateClientResponse,
} from "@/schemas/shared/creator/persona-generate-client.schema";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowsClockwiseIcon,
  CircleNotchIcon,
  EraserIcon,
  ImageIcon,
  ShootingStarIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/components/ui/link";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { parseAsBoolean, useQueryState } from "nuqs";
import { spaceCase } from "case-anything";

dayjs.extend(relativeTime);

const PublicPersonas = dynamic(() => import("./public-personas"), {
  ssr: false,
});

export default function Home() {
  const { isSignedIn } = useUser();
  const [isCreator, setIscreator] = useQueryState(
    "creator",
    parseAsBoolean.withOptions({ history: "push" }).withDefault(false)
  );
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [personaId, setPersonaId] = useState<string | undefined>(undefined);

  const [rateLimitError, setRateLimitError] = useState<{
    limit: number;
    remaining: number;
    reset: number;
  } | null>(null);

  const { isLoading, object, submit, error, clear } = useObject({
    api: "/api/creator/personas/generate",
    schema: creatorPersonaGenerateClientSchema,

    onError: (error: any) => {
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
      if (data.object?.personaId) {
        setPersonaId(data.object.personaId);
      }
    },
  });

  const handleSubmit = useCallback(
    (text: string) => {
      if (text.trim() === "") {
        return;
      }
      setIscreator(true);
      setSubmittedPrompt(text.trim());
      submit({ prompt: text.trim() });
    },
    [submit]
  );

  const handleRetry = useCallback(() => {
    if (submittedPrompt.trim() === "") {
      return;
    }
    submit({ prompt: submittedPrompt.trim(), personaId });
  }, [personaId, submittedPrompt, submit]);

  return (
    <AnimatePresence mode="wait">
      {isCreator && (isLoading || object || error) ? (
        <motion.div
          key="result"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="max-w-3xl mx-auto flex flex-col gap-[12px] mt-[32px] px-[12px] md:px-0 relative z-50"
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
              bg-surface-200/70 mt-[12px] text-surface-foreground/80 font-[500] backdrop-blur-lg border border-surface-200/50
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
                      onClick={handleRetry}
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
          <PersonaCreator
            onGenerate={(prompt) => {
              handleSubmit(prompt);
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
      className="flex items-center justify-center gap-[12px] self-center mt-[42px]
      rounded-[22px]
      p-[6px]
                  sticky bottom-[100px] md:bottom-[24px] bg-background/70 backdrop-blur-[12px] min-w-content w-auto"
    >
      {isLoading ? (
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

  return (
    <div className="flex flex-col gap-[42px] mt-[36px]">
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
        <p className="text-[1.05rem] font-[300]">{persona.summary}</p>
      )}

      {persona?.appearance && (
        <Section title="Appearance" content={persona.appearance} />
      )}

      {persona?.personality && (
        <Section title="Personality" content={persona.personality} />
      )}

      {persona?.background && (
        <Section title="Background" content={persona.background} />
      )}

      {persona?.occupation && (
        <Section title="Occupation" content={persona.occupation} />
      )}

      {persona?.extensions &&
        Object.entries(persona.extensions).map(
          ([key, value]) =>
            value && <Section key={key} title={key} content={value} />
        )}
    </div>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <h3 className="text-[1.1rem] font-bold capitalize">
        {spaceCase(title, { keepSpecialCharacters: false })}
      </h3>
      <p className="text-[1.05rem]">{content}</p>
    </div>
  );
}
