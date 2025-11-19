"use client";

import {
  TopBar,
  TopBarSidebarTrigger,
  TopBarTitle,
} from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import {
  FlexAlignRight,
  LayoutRight,
  MessageTextSquare02,
} from "@untitledui/icons";
import { useChatPersonas } from "../_contexts/chat-personas.context";
import { useChatMain } from "../_contexts/chat-main.context";

export function ChatTopBar({ className }: { className?: string }) {
  const { sidebarOpen, setSidebarOpen } = useChatMain();
  const { personas } = useChatPersonas();

  const persona = personas[0];

  return (
    <TopBar
      className={className}
      left={
        <>
          <TopBarSidebarTrigger />
        </>
      }
      center={
        <TopBarTitle>
          <MessageTextSquare02 strokeWidth={1.5} /> {persona.name}
        </TopBarTitle>
      }
      right={
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FlexAlignRight /> : <LayoutRight />}
          </Button>
        </>
      }
    />
  );
}
