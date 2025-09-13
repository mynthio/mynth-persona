import { DISCORD_INVITE_URL } from "@/lib/constants";
import { ChatsTeardropIcon } from "@phosphor-icons/react/dist/ssr";

export default function ChatsPage() {
  return (
    <div className="w-full h-full flex items-center justify-center max-w-xl mx-auto flex-col gap-[24px] text-center">
      <p>
        <ChatsTeardropIcon size={64} weight="thin" />
      </p>
      <p>
        While we work on the new chat functionality, you can still use the chats
        available in the Persona workbench.
      </p>

      <p>
        Want to help us shape the future of chats?{" "}
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Join our Discord.
        </a>
      </p>
    </div>
  );
}
