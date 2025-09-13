import { DISCORD_INVITE_URL } from "@/lib/constants";
import { ChatsTeardropIcon, ImageIcon } from "@phosphor-icons/react/dist/ssr";

export default function ImagesPage() {
  return (
    <div className="w-full h-full flex items-center justify-center max-w-xl mx-auto flex-col gap-[24px] text-center">
      <p>
        <ImageIcon size={64} weight="thin" />
      </p>
      <p>
        While we work on the new image studio for creating character images, you
        can still use the image creator in the Persona workbench.
      </p>

      <p>
        Want to help us shape the future of images?{" "}
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
