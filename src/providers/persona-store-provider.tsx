// src/providers/counter-store-provider.tsx
"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";

import {
  type PersonaStore,
  createPersonaStore,
  initPersonaStore,
} from "@/stores/persona-store";
import { PersonaWithVersion } from "@/types/persona.type";

export type PersonaStoreApi = ReturnType<typeof createPersonaStore>;

export const PersonaStoreContext = createContext<PersonaStoreApi | undefined>(
  undefined
);

export interface PersonaStoreProviderProps {
  children: ReactNode;
  initialData?: PersonaWithVersion;
}

export const PersonaStoreProvider = ({
  children,
  initialData,
}: PersonaStoreProviderProps) => {
  const storeRef = useRef<PersonaStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createPersonaStore(initPersonaStore(initialData));
  }

  return (
    <PersonaStoreContext.Provider value={storeRef.current}>
      {children}
    </PersonaStoreContext.Provider>
  );
};

export const usePersonaStore = <T,>(
  selector: (store: PersonaStore) => T
): T => {
  const personaStoreContext = useContext(PersonaStoreContext);

  if (!personaStoreContext) {
    throw new Error(`usePersonaStore must be used within PersonaStoreProvider`);
  }

  return useStore(personaStoreContext, selector);
};
