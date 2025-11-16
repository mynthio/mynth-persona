"use client";

import * as React from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import GradientButton from "@/components/kokonutui/gradient-button";
import {
  Plus,
  User01,
  MessageChatCircle,
  FileSearch02,
  Image01,
} from "@untitledui/icons";

export function CreateButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <GradientButton>
          Create <Plus className="text-white/80" />
        </GradientButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/personas/creator" className="flex items-center gap-2">
            <User01 className="h-4 w-4" />
            Persona
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/chats" className="flex items-center gap-2">
            <MessageChatCircle className="h-4 w-4" />
            Chat
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/scenarios/creator" className="flex items-center gap-2">
            <FileSearch02 className="h-4 w-4" />
            Scenario
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/images/creator" className="flex items-center gap-2">
            <Image01 className="h-4 w-4" />
            Image
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
