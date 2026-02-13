"use client";

import { Loading02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { enhancePersonaAction } from "@/actions/enhance-persona.action";
// removed events hooks; using versions list instead
import {
  usePersonaVersionMutation,
  usePersonaVersionQuery,
} from "@/app/_queries/use-persona-version.query";
import { usePersonaVersionsQuery } from "@/app/_queries/use-persona-versions.query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
// Replace basic Textarea/Button with the shared PromptInput components for a cleaner, chat-like UI
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";

import { PublicPersonaVersion } from "@/schemas/shared";
import usePersonaGenerationStore from "@/stores/persona-generation.store";
import { useEffect, useRef } from "react";
import { useWorkbenchMode } from "@/hooks/use-workbench-mode.hook";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSWRConfig } from "swr";
import { toast } from "sonner";

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

  if (isLoading) return <HugeiconsIcon icon={Loading02Icon} className="animate-spinner-linear-spin" />;

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
      <span className="text-muted-foreground italic text-sm">
        Failed to generate version
      </span>
    );
  return (
    <Card
      className="w-auto self-start cursor-pointer transition-colors hover:bg-accent/50 active:bg-accent py-3 shadow-none border-border/50"
      onClick={handleOpenVersion}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleOpenVersion();
      }}
      aria-label={`Open version ${version.versionNumber}`}
    >
      <CardContent className="flex items-center gap-2 p-0 px-3">
        <Badge variant="secondary">{version?.versionNumber}</Badge>
        <span className="text-sm font-medium">{version?.title}</span>
      </CardContent>
    </Card>
  );
}

type EventAiNoteProps = {
  content?: string | null;
};

function EventAiNote({ content }: EventAiNoteProps) {
  if (!content) return null;
  return (
    <div className="w-auto self-start text-muted-foreground text-sm max-w-11/12 px-1">
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
    <Card className="shrink-0 w-auto min-w-0 self-end max-w-[85%] py-3 shadow-sm">
      <CardContent className="p-0 px-4 text-sm">{content}</CardContent>
    </Card>
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
        toast("Finished generating version");

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
      >
        <PromptInputTextarea
          value={prompt}
          placeholder="Enhance or modify persona..."
          onChange={(e) => setPrompt(e.currentTarget.value)}
          disabled={personaGenerationStore.isGenerating}
        />
        <PromptInputFooter>
          <PromptInputTools></PromptInputTools>
          <PromptInputSubmit
            status={
              personaGenerationStore.isGenerating ? "submitted" : undefined
            }
            size="icon-sm"
            disabled={!prompt.trim() || personaGenerationStore.isGenerating}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
