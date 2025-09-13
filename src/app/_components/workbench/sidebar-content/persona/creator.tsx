"use client";

import { enhancePersonaAction } from "@/actions/enhance-persona.action";
// removed events hooks; using versions list instead
import {
  usePersonaVersionMutation,
  usePersonaVersionQuery,
} from "@/app/_queries/use-persona-version.query";
import { usePersonaVersionsQuery } from "@/app/_queries/use-persona-versions.query";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
// Replace basic Textarea/Button with the shared PromptInput components for a cleaner, chat-like UI
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";

import { PublicPersonaVersion } from "@/schemas/shared";
import usePersonaGenerationStore from "@/stores/persona-generation.store";
import { CoinsIcon, SpinnerIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef } from "react";
import { useWorkbenchMode } from "@/hooks/use-workbench-mode.hook";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSWRConfig } from "swr";
import { useTokensBalanceMutation } from "@/app/_queries/use-tokens-balance.query";
import { useToast } from "@/components/ui/toast";
import { usePersonaMutation } from "@/app/_queries/use-persona.query";

type CreatorProps = {
  prompt: string;
  setPrompt: (prompt: string) => void;
};

export default function Creator({ prompt, setPrompt }: CreatorProps) {
  return (
    <div className="flex flex-col h-full">
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
  const endRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const params = useParams<{ personaId: string }>();
  const personaId = params.personaId;
  const { data } = usePersonaVersionsQuery(personaId, {
    revalidateIfStale: false,
  });

  // Auto-scroll to bottom on mount and when events change
  useEffect(() => {
    // Use rAF to ensure layout is settled before scrolling
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ block: "end" });
    });
  }, [data]);

  // Observe size changes within the content (e.g., images loading, dynamic layout)
  useEffect(() => {
    if (!contentRef.current) return;
    const ro = new ResizeObserver(() => {
      endRef.current?.scrollIntoView({ block: "end" });
    });
    ro.observe(contentRef.current);
    return () => {
      ro.disconnect();
    };
  }, []);

  return (
    <ScrollArea className="min-h-0 h-full px-4">
      <div className="h-full flex flex-col gap-8 min-h-0 pt-4">
        {children}
        <div className="h-4 min-h-0 shrink-0" />
      </div>
    </ScrollArea>
  );
}

function Events() {
  const params = useParams<{ personaId: string }>();
  const personaId = params.personaId;

  const { data, isLoading } = usePersonaVersionsQuery(personaId, {
    revalidateIfStale: false,
  });

  if (isLoading) return <SpinnerIcon className="animate-spinner-linear-spin" />;

  return data?.length
    ? data.map((version) => <Event key={version.id} version={version} />)
    : null;
}

type EventProps = {
  version: PublicPersonaVersion;
};

function Event({ version }: EventProps) {
  return (
    <div className="flex flex-col gap-6 shrink-0">
      <EventMessage
        content={version.metadata?.userMessage ?? "-"}
        createdAt={version.createdAt}
      />

      <div className="self-start w-auto flex flex-col gap-0.5">
        <EventPersonaVersion version={version} />
        <EventAiNote content={version.metadata?.aiNote} />
      </div>
    </div>
  );
}

type EventPersonaVersionProps = {
  version: PublicPersonaVersion;
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
      className="w-auto self-start bg-surface px-2 py-1 rounded-md cursor-pointer hover:bg-accent"
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
  const params = useParams<{ personaId: string }>();
  const personaId = params.personaId;

  const personaGenerationStore = usePersonaGenerationStore();
  const mutateCurrentVersion = usePersonaVersionMutation(personaId);
  const [, setWorkbenchMode] = useWorkbenchMode();
  const mutateBalance = useTokensBalanceMutation();
  const toast = useToast();
  const { mutate: swrMutate } = useSWRConfig();
  const { data: currentVersion } = usePersonaVersionQuery(
    personaId,
    "current",
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  const handleClick = async () => {
    if (!personaId) return;
    if (!prompt) return;
    if (personaGenerationStore.isGenerating) return;
    personaGenerationStore.setIsGenerating(true);

    // Ensure the sidebar is focused on Creator to see streaming updates
    setWorkbenchMode("persona");

    const response = await enhancePersonaAction(personaId, prompt);

    if (response.balance) {
      mutateBalance(() => response.balance);
    }

    personaGenerationStore.stream(response.object!, {
      onData: (data) => {
        mutateCurrentVersion((state) => {
          const base = state ??
            (currentVersion as any) ?? {
              id: "",
              personaId: personaId!,
              title: "",
              data: {} as any,
            };
          return {
            ...base,
            data: {
              ...base.data,
              ...data,
              extensions: {
                ...(base.data?.extensions ?? {}),
                ...(data?.extensions ?? {}),
              },
            },
          };
        });
      },
      onFinish: () => {
        toast.add({
          title: "Finished generating version",
        });

        // Revalidate current version and versions list to fetch the persisted server-side version
        if (personaId) {
          swrMutate(`/api/personas/${personaId}/versions/current`);
          swrMutate(`/api/personas/${personaId}/versions`);
        }
      },
    });
  };

  return (
    <div className="shrink-0 h-auto min-h-content px-4 pb-4">
      <PromptInput
        onSubmit={(_msg, e) => {
          e.preventDefault();
          void handleClick();
        }}
        className="w-full mx-auto sticky bottom-4 p-2 bg-gradient-to-t from-zinc-50/80 to-white/70 backdrop-blur-lg border-zinc-200 shadow-lg shadow-zinc-100/50"
      >
        <PromptInputTextarea
          value={prompt}
          placeholder="Enhance or modify persona..."
          onChange={(e) => setPrompt(e.currentTarget.value)}
          disabled={personaGenerationStore.isGenerating}
        />
        <PromptInputToolbar>
          <PromptInputTools>
            <Badge variant="secondary" className="gap-1 px-2 py-1">
              <CoinsIcon />1
            </Badge>
          </PromptInputTools>
          <PromptInputSubmit
            status={
              personaGenerationStore.isGenerating ? "submitted" : undefined
            }
            size="icon"
            disabled={!prompt.trim() || personaGenerationStore.isGenerating}
            className="size-10 shadow-none transition duration-250 hover:scale-110 bg-gradient-to-tr from-zinc-100 to-zinc-100/70 hover:to-zinc-100/80 text-sm text-zinc-600"
          />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
