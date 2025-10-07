import { getChatMessagesData } from "@/data/messages/get-chat-messages.data";
import { db } from "@/db/drizzle";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Chat from "./_components/chat";
import { ChatPersonasProvider } from "./_contexts/chat-personas.context";
import { PersonaData } from "@/schemas";
import { ChatBranchesProvider } from "./_contexts/chat-branches.context";
import { getChatBranches } from "@/services/chat/get-chat-branches";
import { kv } from "@vercel/kv";
import { logger } from "@/lib/logger";
import { ChatMainProvider } from "./_contexts/chat-main.context";
import type { TextGenerationModelId } from "@/config/shared/models/text-generation-models.config";
import { ChatIntro } from "./_components/chat-intro";
import { ChatSettings } from "./_components/chat-settings";
import { ChatSettings as ChatSettingsSchema } from "@/schemas/backend/chats/chat.schema";

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

  const chat = await db.query.chats.findFirst({
    where: (chatsTable, { eq, and }) =>
      and(eq(chatsTable.id, chatId), eq(chatsTable.userId, userId)),
    with: {
      chatPersonas: {
        columns: {},
        with: {
          persona: {
            columns: {
              profileImageId: true,
            },
          },
          personaVersion: {
            columns: {
              id: true,
              personaId: true,
              data: true,
            },
          },
        },
      },
    },
  });

  if (!chat) notFound();

  const personas = chat.chatPersonas.map((chatPersona) => ({
    id: chatPersona.personaVersion.personaId,
    versionId: chatPersona.personaVersion.id,
    name: (chatPersona.personaVersion.data as PersonaData)?.name ?? "",
    profileImageId: chatPersona.persona.profileImageId ?? undefined,
  }));

  const leafId = await kv.get<string>(`chat:${chatId}:leaf`);
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
    <div className="w-full h-full mx-auto flex flex-col">
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
            {hasNoMessages && <ChatIntro />}
            <Chat chat={chat} initialMessages={initialMessages.messages} />
            <ChatSettings defaultOpen={areSettingsOpen} />
          </ChatBranchesProvider>
        </ChatPersonasProvider>
      </ChatMainProvider>
    </div>
  );
}
