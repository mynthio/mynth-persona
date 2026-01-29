"use client";

import { Link } from "@/components/ui/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Plus,
  User01,
  MessageChatCircle,
  FileSearch02,
  Image01,
} from "@untitledui/icons";

export function CreateButton({ className }: { className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className={className}>
        <Button
          size="sm"
          className="h-8 gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary dark:bg-white/10 dark:hover:bg-white/15 dark:text-white border-0 shadow-none"
        >
          <Plus strokeWidth={2} className="size-4" />
          <span className="font-medium">New</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl" sideOffset={8}>
        <DropdownMenuItem asChild>
          <Link href="/personas/creator" className="flex items-center gap-2.5">
            <User01 className="h-4 w-4 opacity-70" strokeWidth={1.5} />
            <span>Persona</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/chats" className="flex items-center gap-2.5">
            <MessageChatCircle className="h-4 w-4 opacity-70" strokeWidth={1.5} />
            <span>Chat</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/scenarios/creator" className="flex items-center gap-2.5">
            <FileSearch02 className="h-4 w-4 opacity-70" strokeWidth={1.5} />
            <span>Scenario</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/images/creator" className="flex items-center gap-2.5">
            <Image01 className="h-4 w-4 opacity-70" strokeWidth={1.5} />
            <span>Image</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
