import { PersonaWithVersion } from "@/types/persona.type";
import { createStore } from "zustand";

export type PersonaState = {
  // DATA
  data?: PersonaWithVersion;
  isLoadingData: boolean;

  // GENERATION
  isGenerationInProgress: boolean;

  // IMAGE GENERATION
  imageGenerationRuns: Record<
    string,
    { runId: string; publicAccessToken: string }
  >;
};

export type PersonaActions = {
  setData: (data: PersonaWithVersion | undefined) => void;
  setIsLoadingData: (isLoadingData: boolean) => void;

  setIsGenerationInProgress: (isGenerationInProgress: boolean) => void;

  setImageGenerationRuns: (
    imageGenerationRuns: Record<
      string,
      { runId: string; publicAccessToken: string }
    >
  ) => void;
};

export type PersonaStore = PersonaState & PersonaActions;

export const initPersonaStore = (data?: PersonaWithVersion): PersonaState => {
  return {
    data,
    isLoadingData: false,
    isGenerationInProgress: false,
    imageGenerationRuns: {},
  };
};

export const defaultInitState: PersonaState = {
  data: undefined,
  isLoadingData: false,
  isGenerationInProgress: false,
  imageGenerationRuns: {},
};

export const createPersonaStore = (
  initState: PersonaState = defaultInitState
) => {
  return createStore<PersonaStore>()((set) => ({
    ...initState,
    setData: (data: PersonaWithVersion | undefined) =>
      set({ data, isLoadingData: false }),
    setIsLoadingData: (isLoadingData: boolean) => set({ isLoadingData }),
    setIsGenerationInProgress: (isGenerationInProgress: boolean) =>
      set({ isGenerationInProgress }),
    setImageGenerationRuns: (
      imageGenerationRuns: Record<
        string,
        { runId: string; publicAccessToken: string }
      >
    ) => set({ imageGenerationRuns }),
  }));
};
