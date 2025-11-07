"use client";

import { createContext, useContext, useMemo, useState } from "react";

type ActiveStream = "persona" | `section__${string}`;

export type GenerationContextValue = {
  isGenerating: boolean;

  activeStream: ActiveStream | null;

  setActiveStream: (id: ActiveStream | null) => void;
};

// Context to share generation state across sections and footer within the Home tree
const GenerationContext = createContext<GenerationContextValue | null>(
  null
);
GenerationContext.displayName = "GenerationContext";

export function GenerationContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeStream, setActiveStream] = useState<ActiveStream | null>(null);

  const isGenerating = useMemo(() => {
    return activeStream !== null;
  }, [activeStream]);

  return (
    <GenerationContext.Provider
      value={{ isGenerating, activeStream, setActiveStream }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

// Convenience hook for consuming the context
export function useGenerationContext(): GenerationContextValue {
  const ctx = useContext(GenerationContext);
  if (ctx === null) {
    throw new Error(
      "useGenerationContext must be used within a GenerationContext.Provider"
    );
  }

  return ctx;
}
