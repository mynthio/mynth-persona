import { create } from "zustand";

export type ChatImageGenerationRunOutput = {
  imageUrl?: string | null;
  mediaId?: string | null;
};

export type ChatImageGenerationRun = {
  runId: string;
  publicAccessToken: string;
  messageId: string;
  chatId: string;
  startedAt: number;
  modelId: string;
  status?: string;
  completedAt?: number;
  output?: ChatImageGenerationRunOutput;
  errorCode?: string;
};

export type ChatImageGenerationState = {
  // IMAGE GENERATION RUNS for chat messages
  imageGenerationRuns: Record<string, ChatImageGenerationRun>;

  // SCENE IMAGE GENERATION RUNS for chats
  sceneImageGenerationRuns: Record<
    string,
    {
      runId: string;
      publicAccessToken: string;
      chatId: string;
      startedAt: number;
    }
  >;
};

export type ChatImageGenerationActions = {
  setImageGenerationRuns: (
    runs: Record<string, ChatImageGenerationRun>
  ) => void;

  addImageGenerationRun: (
    runId: string,
    run: ChatImageGenerationRun
  ) => void;

  updateImageGenerationRun: (
    runId: string,
    update: Partial<ChatImageGenerationRun>
  ) => void;

  removeImageGenerationRun: (runId: string) => void;

  setSceneImageGenerationRuns: (
    runs: Record<
      string,
      {
        runId: string;
        publicAccessToken: string;
        chatId: string;
        startedAt: number;
      }
    >
  ) => void;

  addSceneImageGenerationRun: (
    runId: string,
    run: {
      runId: string;
      publicAccessToken: string;
      chatId: string;
      startedAt: number;
    }
  ) => void;

  removeSceneImageGenerationRun: (runId: string) => void;
};

export type ChatImageGenerationStore = ChatImageGenerationState &
  ChatImageGenerationActions;

export const defaultInitState: ChatImageGenerationState = {
  imageGenerationRuns: {},
  sceneImageGenerationRuns: {},
};

export const useChatImageGenerationStore = create<ChatImageGenerationStore>(
  (set) => ({
    ...defaultInitState,

    setImageGenerationRuns: (runs) => set({ imageGenerationRuns: runs }),

    addImageGenerationRun: (runId, run) =>
      set((state) => ({
        imageGenerationRuns: { ...state.imageGenerationRuns, [runId]: run },
      })),

    updateImageGenerationRun: (runId, update) =>
      set((state) => {
        const existingRun = state.imageGenerationRuns[runId];

        if (!existingRun) {
          return { imageGenerationRuns: state.imageGenerationRuns };
        }

        const nextOutput =
          update.output !== undefined
            ? { ...existingRun.output, ...update.output }
            : existingRun.output;

        return {
          imageGenerationRuns: {
            ...state.imageGenerationRuns,
            [runId]: {
              ...existingRun,
              ...update,
              output: nextOutput,
            },
          },
        };
      }),

    removeImageGenerationRun: (runId) =>
      set((state) => {
        const newRuns = { ...state.imageGenerationRuns };
        delete newRuns[runId];
        return { imageGenerationRuns: newRuns };
      }),

    setSceneImageGenerationRuns: (runs) =>
      set({ sceneImageGenerationRuns: runs }),

    addSceneImageGenerationRun: (runId, run) =>
      set((state) => ({
        sceneImageGenerationRuns: {
          ...state.sceneImageGenerationRuns,
          [runId]: run,
        },
      })),

    removeSceneImageGenerationRun: (runId) =>
      set((state) => {
        const newRuns = { ...state.sceneImageGenerationRuns };
        delete newRuns[runId];
        return { sceneImageGenerationRuns: newRuns };
      }),
  })
);

export default useChatImageGenerationStore;
