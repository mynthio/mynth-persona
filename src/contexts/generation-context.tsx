"use client";

import { createContext, useContext, useMemo, useRef, useState } from "react";

type ActiveStream = "persona" | `section__${string}`;

export type GenerationContextValue = {
  isGenerating: boolean;

  activeStream: ActiveStream | null;

  setActiveStream: (id: ActiveStream | null) => void;

  resetGeneration: () => void;

  registerResetCallback: (callback: () => void) => void;
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
  const resetCallbackRef = useRef<(() => void) | null>(null);

  const isGenerating = useMemo(() => {
    return activeStream !== null;
  }, [activeStream]);

  const registerResetCallback = useMemo(
    () => (callback: () => void) => {
      resetCallbackRef.current = callback;
    },
    []
  );

  const resetGeneration = useMemo(
    () => () => {
      resetCallbackRef.current?.();
    },
    []
  );

  return (
    <GenerationContext.Provider
      value={{
        isGenerating,
        activeStream,
        setActiveStream,
        resetGeneration,
        registerResetCallback,
      }}
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
