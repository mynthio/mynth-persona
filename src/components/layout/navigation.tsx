"use client";

import { UserBalance } from "@/types/balance.type";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Chip } from "@heroui/chip";
import {
  DiscordLogoIcon,
  GithubLogoIcon,
  PokerChipIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import useSWR from "swr";
import { Tooltip } from "@heroui/tooltip";
import { useQueryState } from "nuqs";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { useAuth } from "@clerk/nextjs";

export default function Navigation() {
  const { isSignedIn } = useAuth();
  const { data: balance } = useSWR<UserBalance>(
    isSignedIn ? "/api/me/balance" : null
  );

  const [isLibraryOpen, setIsLibraryOpen] = useQueryState("library");

  return (
    <div className="flex absolute top-0 left-0 right-0 items-center justify-between gap-2 h-nav px-12 lg:px-16">
      <div>
        <Link href={"/"}>
          <Image
            width={60}
            height={60}
            src={"https://cdn.persona.mynth.io/logo.webp"}
          />
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <SignedOut>
          <a
            href="https://github.com/mynthio/mynth-persona"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="light" isIconOnly>
              <GithubLogoIcon />
            </Button>
          </a>
          <a
            href="https://discord.gg/ktHXuPVaqB"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="light" isIconOnly>
              <DiscordLogoIcon />
            </Button>
          </a>
        </SignedOut>
        <SignedIn>
          {balance && (
            <div className="flex items-center gap-2">
              <Tooltip content="Tokens" placement="bottom">
                <Link href={"/tokens"}>
                  <Chip
                    variant="faded"
                    color="secondary"
                    startContent={<PokerChipIcon />}
                  >
                    {balance.balance}
                  </Chip>
                </Link>
              </Tooltip>
            </div>
          )}

          <Tooltip content="Library" placement="bottom">
            <Button
              variant="light"
              isIconOnly
              onPress={() => setIsLibraryOpen("1")}
            >
              <UsersThreeIcon />
            </Button>
          </Tooltip>
        </SignedIn>

        <SignedIn>
          <UserButton />
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <Button>Sign in</Button>
          </SignInButton>
        </SignedOut>
      </div>
    </div>
  );
}
