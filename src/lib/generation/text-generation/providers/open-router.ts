import {
  createOpenRouter,
  OpenRouterProvider,
} from "@openrouter/ai-sdk-provider";

let openRouter: OpenRouterProvider;

export const getOpenRouter = (): OpenRouterProvider => {
  if (!openRouter) {
    openRouter = createOpenRouter({
      apiKey: process.env.OPEN_ROUTER_API_KEY!,
      headers: {
        "HTTP-Referer": "https://prsna.app",
        "X-Title": "Persona",
      },
    });
  }

  return openRouter;
};
