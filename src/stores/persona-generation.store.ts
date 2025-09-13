import { readStreamableValue, StreamableValue } from "@ai-sdk/rsc";
import { create } from "zustand";

export type PersonaGenerationState = {
  // TEMPORARY STREAMING DATA
  streamingData?: Record<string, any>;

  // STATUS
  isGenerating: boolean;
  generationError?: string;

  // IMAGE GENERATION RUNS (if still relevant for generation context)
  imageGenerationRuns: Record<
    string,
    {
      runId: string;
      publicAccessToken: string;
      personaId: string;
      startedAt?: number;
    }
  >;
};

export type PersonaGenerationActions = {
  setStreamingData: (data: Record<string, any> | undefined) => void;
  updateStreamingData: (partialData: Record<string, any>) => void;
  stream: (
    value: StreamableValue<any, any>,
    options?: {
      onData?: (data: any) => void;
      onError?: (error: any) => void;
      onFinish?: (data: any) => void;
    }
  ) => void;
  clearStreamingData: () => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationError: (error: string | undefined) => void;
  setImageGenerationRuns: (
    runs: Record<
      string,
      {
        runId: string;
        publicAccessToken: string;
        personaId: string;
        startedAt?: number;
      }
    >
  ) => void;
  addImageGenerationRun: (
    runId: string,
    run: {
      runId: string;
      publicAccessToken: string;
      personaId: string;
      startedAt?: number;
    }
  ) => void;
  removeImageGenerationRun: (runId: string) => void;
};

export type PersonaGenerationStore = PersonaGenerationState &
  PersonaGenerationActions;

export const defaultInitState: PersonaGenerationState = {
  streamingData: undefined,
  isGenerating: false,
  generationError: undefined,
  imageGenerationRuns: {},
};

export const usePersonaGenerationStore = create<PersonaGenerationStore>(
  (set) => ({
    ...defaultInitState,
    setStreamingData: (data) => set({ streamingData: data }),
    clearStreamingData: () => set({ streamingData: undefined }),
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
    stream: async (streamValue, options) => {
      set({ isGenerating: true });

      let lastPartialObject: any;

      try {
        for await (const partialObject of readStreamableValue(streamValue!)) {
          options?.onData?.(partialObject);
          lastPartialObject = partialObject;
        }

        options?.onFinish?.(lastPartialObject);
      } catch (error) {
        options?.onError?.(error);
      } finally {
        set({ isGenerating: false });
      }
    },
    removeImageGenerationRun: (runId) =>
      set((state) => {
        const newRuns = { ...state.imageGenerationRuns };
        delete newRuns[runId];
        return { imageGenerationRuns: newRuns };
      }),
  })
);

export default usePersonaGenerationStore;
