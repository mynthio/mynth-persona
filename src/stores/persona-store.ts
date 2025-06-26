import { PersonaWithVersion } from "@/types/persona.type";
import { createStore } from "zustand";

export type PersonaState = {
  // DATA
  data?: PersonaWithVersion;
  isLoadingData: boolean;

  // GENERATION
  isGenerationInProgress: boolean;
};

export type PersonaActions = {
  setData: (data: PersonaWithVersion) => void;
  setIsLoadingData: (isLoadingData: boolean) => void;
};

export type PersonaStore = PersonaState & PersonaActions;

export const initPersonaStore = (data?: PersonaWithVersion): PersonaState => {
  return { data, isLoadingData: false, isGenerationInProgress: false };
};

export const defaultInitState: PersonaState = {
  data: undefined,
  isLoadingData: false,
  isGenerationInProgress: false,
};

export const createPersonaStore = (
  initState: PersonaState = defaultInitState
) => {
  return createStore<PersonaStore>()((set) => ({
    ...initState,
    setData: (data: PersonaWithVersion) => set({ data, isLoadingData: false }),
    setIsLoadingData: (isLoadingData: boolean) => set({ isLoadingData }),
    setIsGenerationInProgress: (isGenerationInProgress: boolean) =>
      set({ isGenerationInProgress }),
  }));
};
