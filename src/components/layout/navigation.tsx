"use client";

import { UserBalance } from "@/types/balance.type";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Chip } from "@heroui/chip";
import { PokerChipIcon, UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import useSWR from "swr";
import { Tooltip } from "@heroui/tooltip";
import { useQueryState } from "nuqs";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";

export default function Navigation() {
  const { data: balance } = useSWR<UserBalance>("/api/me/balance");

  const [isLibraryOpen, setIsLibraryOpen] = useQueryState("library");

  return (
    <div className="flex items-center justify-between gap-2 h-nav px-12 lg:px-16">
      <div>
        <Link href={"/"}>
          <Image
            width={60}
            height={60}
            src={"https://persona-mynth-prod.b-cdn.net/persona-logo-2.webp"}
          />
        </Link>
      </div>
      <div className="flex items-center gap-4">
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
