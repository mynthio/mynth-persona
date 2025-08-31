"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Chats from "./chats";

import { useWorkbenchChatSidebarMode } from "@/hooks/use-workbench-chat-sidebar-mode";
import {
  ChatsCircle,
  ChatsCircleIcon,
  GearIcon,
} from "@phosphor-icons/react/dist/ssr";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const Settings = dynamic(() => import("./settings"), { ssr: false });

export default function ChatSidebar() {
  const [chatWorkbenchMode, setChatWorkbenchMode] =
    useWorkbenchChatSidebarMode();

  return (
    <Tabs
      className="h-full min-h-0"
      value={chatWorkbenchMode}
      onValueChange={(value) => setChatWorkbenchMode(value)}
    >
      <div className="pt-2 px-2">
        <TabsList className="w-full">
          <TabsTrigger value="chats">
            <ChatsCircleIcon />
            Chats
          </TabsTrigger>
          <TabsTrigger value="settings">
            <GearIcon />
            Settings
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="chats"
        className="h-full min-h-0 w-full max-w-full min-w-0"
      >
        <Chats />
      </TabsContent>

      <TabsContent
        value="settings"
        className="h-full min-h-0 w-full max-w-full"
      >
        <Suspense>
          <Settings />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
