import { PersonaData, PersonaWithVersion } from "@/types/persona.type";
import { createStore } from "zustand";

export type PersonaGenerationState = {
  // TEMPORARY STREAMING DATA
  streamingData?: Partial<PersonaData>;

  // STATUS
  isGenerating: boolean;
  generationError?: string;

  // IMAGE GENERATION RUNS (if still relevant for generation context)
  imageGenerationRuns: Record<
    string,
    { runId: string; publicAccessToken: string }
  >;
};

export type PersonaGenerationActions = {
  setStreamingData: (data: Partial<PersonaData> | undefined) => void;
  updateStreamingData: (partialData: Partial<PersonaData>) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationError: (error: string | undefined) => void;
  setImageGenerationRuns: (
    runs: Record<string, { runId: string; publicAccessToken: string }>
  ) => void;
  addImageGenerationRun: (
    runId: string,
    run: { runId: string; publicAccessToken: string }
  ) => void;
};

export type PersonaGenerationStore = PersonaGenerationState &
  PersonaGenerationActions;

export const defaultInitState: PersonaGenerationState = {
  streamingData: undefined,
  isGenerating: false,
  generationError: undefined,
  imageGenerationRuns: {},
};

export const createPersonaGenerationStore = (
  initState: PersonaGenerationState = defaultInitState
) => {
  return createStore<PersonaGenerationStore>()((set, get) => ({
    ...initState,
    setStreamingData: (data) => set({ streamingData: data }),
    updateStreamingData: (partialData) =>
      set((state) => ({
        streamingData: { ...state.streamingData, ...partialData },
      })),
    setIsGenerating: (isGenerating) => set({ isGenerating }),
    setGenerationError: (error) => set({ generationError: error }),
    setImageGenerationRuns: (runs) => set({ imageGenerationRuns: runs }),
    addImageGenerationRun: (runId, run) =>
      set((state) => ({
        imageGenerationRuns: { ...state.imageGenerationRuns, [runId]: run },
      })),
  }));
};
