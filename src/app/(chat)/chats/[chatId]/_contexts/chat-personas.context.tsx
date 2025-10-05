"use client";

import { createContext, useContext } from "react";

type ChatPersona = {
  id: string;
  versionId: string;

  name: string;

  profileImageId?: string;
};

export const ChatPersonasContext = createContext<{
  personas: ChatPersona[];
}>({
  personas: [],
});

export const ChatPersonasProvider = ({
  children,
  personas,
}: {
  children: React.ReactNode;
  personas: ChatPersona[];
}) => {
  return (
    <ChatPersonasContext.Provider value={{ personas }}>
      {children}
    </ChatPersonasContext.Provider>
  );
};

export const useChatPersonas = () => {
  const context = useContext(ChatPersonasContext);

  if (!context) {
    throw new Error(
      "useChatPersonas must be used within a ChatPersonasProvider"
    );
  }

  return context;
};
