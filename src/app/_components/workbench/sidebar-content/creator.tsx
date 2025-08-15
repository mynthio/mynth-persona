"use client";

import { enhancePersonaAction } from "@/actions/enhance-persona.action";
import {
  usePersonaEventsMutation,
  usePersonaEventsQuery,
} from "@/app/_queries/use-persona-events.query";
import { usePersonaVersionMutation } from "@/app/_queries/use-persona-version.query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { PublicPersonaEventWithVersion } from "@/schemas";
import usePersonaGenerationStore from "@/stores/persona-generation.store";
import { CoinsIcon, SpinnerIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef } from "react";
import { useWorkbenchMode } from "@/hooks/use-workbench-mode.hook";
import { useRouter, useSearchParams } from "next/navigation";
import { useTokensBalanceMutation } from "@/app/_queries/use-tokens-balance.query";
import { useToast } from "@/components/ui/toast";
import { usePersonaMutation } from "@/app/_queries/use-persona.query";

type CreatorProps = {
  prompt: string;
  setPrompt: (prompt: string) => void;
};

export default function WorkbenchSidebarCreator({
  prompt,
  setPrompt,
}: CreatorProps) {
  return (
    <div className="flex flex-col h-full gap-4">
      <EventsWrapper>
        <Events />
      </EventsWrapper>
      <Prompt prompt={prompt} setPrompt={setPrompt} />
    </div>
  );
}

type EventsWrapperProps = {
  children: React.ReactNode;
};

function EventsWrapper({ children }: EventsWrapperProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [personaId] = usePersonaId();
  const { data } = usePersonaEventsQuery(personaId, {
    revalidateIfStale: false,
  });

  // Auto-scroll to bottom when events change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [data]);

  // Auto-scroll to bottom on mount
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  return (
    <ScrollArea ref={scrollAreaRef} className="min-h-0 h-full">
      <div className="min-h-0 mt-auto h-full overflow-y-auto overflow-x-hidden flex flex-col justify-end gap-6 px-2 pt-16">
        {children}
      </div>
    </ScrollArea>
  );
}

function Events() {
  const [personaId] = usePersonaId();
  const { data, isLoading } = usePersonaEventsQuery(personaId, {
    revalidateIfStale: false,
  });

  if (isLoading) return <SpinnerIcon className="animate-spinner-linear-spin" />;

  return data?.length
    ? data.map((event) => <Event key={event.id} event={event} />)
    : null;
}

type EventProps = {
  event: PublicPersonaEventWithVersion;
};

function Event({ event }: EventProps) {
  return (
    <div className="flex flex-col gap-6">
      <EventMessage
        content={event.userMessage ?? ""}
        createdAt={event.createdAt}
      />

      <div className="self-start w-auto flex flex-col gap-0.5">
        <EventPersonaVersion version={event.version} />
        <EventAiNote content={event.aiNote} />
      </div>
    </div>
  );
}

type EventPersonaVersionProps = {
  version: PublicPersonaEventWithVersion["version"];
};

function EventPersonaVersion({ version }: EventPersonaVersionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handleOpenVersion = () => {
    if (!version?.id) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("versionId", version.id);
    router.replace(`?${params.toString()}`, { scroll: false });
  };
  if (!version)
    return (
      <span className="italic text-zinc-600 text-sm">
        Failed to generate version
      </span>
    );
  return (
    <div
      className="w-auto self-start bg-background px-2 py-1 rounded-md cursor-pointer hover:bg-accent"
      onClick={handleOpenVersion}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleOpenVersion();
      }}
      aria-label={`Open version ${version.versionNumber}`}
    >
      <Badge variant="secondary">{version?.versionNumber}</Badge>
      <span className="ml-2">{version?.title}</span>
    </div>
  );
}

type EventAiNoteProps = {
  content?: string | null;
};

function EventAiNote({ content }: EventAiNoteProps) {
  return (
    <div className="w-auto self-start text-zinc-600 text-sm max-w-11/12">
      {content}
    </div>
  );
}

type EventMessageProps = {
  content: string;
  createdAt: Date;
};

function EventMessage({ content, createdAt }: EventMessageProps) {
  return (
    <div className="bg-zinc-100 border-zinc-200/50 border px-4 py-2.5 rounded-md shrink-0 w-auto min-w-0 self-end">
      {content}
    </div>
  );
}

type PromptProps = {
  prompt: string;
  setPrompt: (prompt: string) => void;
};

function Prompt({ prompt, setPrompt }: PromptProps) {
  const [personaId] = usePersonaId();
  const personaGenerationStore = usePersonaGenerationStore();
  const mutateCurrentVersion = usePersonaVersionMutation(personaId);
  const mutatePersonaEvents = usePersonaEventsMutation(personaId!);
  const mutatePersona = usePersonaMutation(personaId!);
  const [, setWorkbenchMode] = useWorkbenchMode();
  const mutateBalance = useTokensBalanceMutation();
  const toast = useToast();

  const handleClick = async () => {
    if (!personaId) return;
    if (!prompt) return;
    if (personaGenerationStore.isGenerating) return;
    personaGenerationStore.setIsGenerating(true);

    // Ensure the sidebar is focused on Creator to see streaming updates
    setWorkbenchMode("creator");

    const response = await enhancePersonaAction(personaId, prompt);

    if (response.balance) {
      mutateBalance(() => response.balance);
    }

    const promptNow = prompt;

    personaGenerationStore.stream(response.object!, {
      onData: (data) => {
        mutateCurrentVersion((state) => {
          if (!state) return undefined;
          return {
            ...state,
            data: {
              ...state.data,
              ...data,
              extensions: {
                ...state.data.extensions,
                ...data.extensions,
              },
            },
          };
        });
      },
      onFinish: (data) => {
        toast.add({
          title: "Finished generating version",
        });

        mutatePersonaEvents(
          (state) => {
            if (!state) return [];

            return [
              ...state,
              {
                aiNote: "",
                errorMessage: null,
                createdAt: new Date(),
                id: response.personaEventId!,
                personaId: personaId,
                tokensCost: 1,
                type: "persona_edit",
                userMessage: promptNow,
                versionId: "",
                version: {
                  id: "",
                  versionNumber: 0,
                  title: "",
                },
              },
            ];
          },
          {
            revalidate: true,
          }
        );
      },
    });
  };

  return (
    <div className="shrink-0 h-32 min-h-0 flex flex-col gap-1">
      <Textarea
        placeholder="Enhance/Modify persona..."
        className="bg-background border border-zinc-200/50 shadow-none min-h-0 resize-none h-full"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div className="flex items-center justify-between gap-1">
        <Badge variant="secondary">
          <CoinsIcon />1
        </Badge>
        <Button
          size={"sm"}
          className="bg-[#8661C1]"
          onClick={handleClick}
          disabled={personaGenerationStore.isGenerating}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
