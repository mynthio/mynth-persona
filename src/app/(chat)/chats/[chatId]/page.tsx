import { getChatMessagesData } from "@/data/messages/get-chat-messages.data";
import { getChatForPageCached } from "@/data/chats/get-chat.data";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Chat from "./_components/chat";
import { ChatPersonasProvider } from "./_contexts/chat-personas.context";
import { PersonaData } from "@/schemas";
import { ChatBranchesProvider } from "./_contexts/chat-branches.context";
import { getChatBranches } from "@/services/chat/get-chat-branches";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { ChatMainProvider } from "./_contexts/chat-main.context";
import type { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";
import { ChatIntro } from "./_components/chat-intro";
import { ChatSettings } from "./_components/chat-settings";
import { ChatSettings as ChatSettingsSchema } from "@/schemas/backend/chats/chat.schema";
import { Provider } from "@ai-sdk-tools/store";
import { ChatTopBar } from "./_components/chat-top-bar";
import { ChatSidebar } from "./_components/chat-sidebar";

export default async function ChatDetailPage({
  params,
  searchParams,
}: PageProps<"/chats/[chatId]">) {
  const { userId } = await auth();
  if (!userId) notFound();

  const { chatId } = await params;
  const { areSettingsOpen } = await searchParams.then(
    (searchParamsResolved) => ({
      areSettingsOpen: !!searchParamsResolved.s,
    })
  );

  // Use cached chat fetch for page rendering - automatically invalidated via updateTag
  const chat = await getChatForPageCached(chatId, userId);

  if (!chat) notFound();

  const personas = chat.chatPersonas.map((chatPersona) => ({
    id: chatPersona.personaVersion.personaId,
    versionId: chatPersona.personaVersion.id,
    name: (chatPersona.personaVersion.data as PersonaData)?.name ?? "",
    profileImageIdMedia: chatPersona.persona.profileImageIdMedia ?? undefined,
    slug: chatPersona.persona.slug ?? undefined,
    visibility: chatPersona.persona.visibility ?? undefined,
  }));

  const leafId = await redis.get<string>(`chat:${chatId}:leaf`);
  logger.debug({ leafId }, "Leaf ID");

  const [initialMessages, branches] = await Promise.all([
    getChatMessagesData(chat.id, {
      limit: 10,
      messageId: leafId ?? undefined,
    }),
    getChatBranches(chat.id),
  ]);

  const hasNoMessages = initialMessages.messages.length === 0;

  return (
    <>
      <Provider initialMessages={initialMessages.messages}>
        <ChatMainProvider
          initialSettings={chat.settings as ChatSettingsSchema}
          chatId={chat.id}
          mode={chat.mode}
          initialModelId={
            (chat.settings as { model?: string } | null)?.model as
              | TextGenerationModelId
              | undefined
          }
        >
          <ChatPersonasProvider personas={personas}>
            <ChatBranchesProvider
              chatId={chatId}
              branches={branches}
              activeBranch={leafId}
            >
              <div className="flex h-full items-start w-full">
                <div className="flex flex-col items-start w-full h-full min-h-screen [&>*:nth-child(2)]:h-full [&>*:nth-child(2)]:flex-1">
                  <ChatTopBar className="shrink-0" />

                  {hasNoMessages && <ChatIntro />}

                  <Chat
                    chat={chat}
                    initialMessages={initialMessages.messages}
                  />
                </div>

                <ChatSidebar className="shrink-0" />
              </div>
              <ChatSettings defaultOpen={areSettingsOpen} />
            </ChatBranchesProvider>
          </ChatPersonasProvider>
        </ChatMainProvider>
      </Provider>
    </>
  );
}
