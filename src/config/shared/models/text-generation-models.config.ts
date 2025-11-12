export type TextGenerationModelId =
  | "thedrummer/cydonia-24b-v4.1"
  | "x-ai/grok-4-fast"
  | "nousresearch/hermes-3-llama-3.1-70b"
  | "nousresearch/hermes-3-llama-3.1-405b"
  | "nousresearch/hermes-4-70b"
  | "cognitivecomputations/dolphin-mistral-24b-venice-edition"
  | "meta-llama/llama-3.3-70b-instruct"
  | "z-ai/glm-4.5-air"
  | "deepseek/deepseek-chat-v3.1"
  | "aion-labs/aion-rp-llama-3.1-8b"
  | "openai/gpt-oss-20b"
  | "meituan/longcat-flash-chat"
  | "nvidia/nemotron-nano-9b-v2"
  | "x-ai/grok-3"
  | "tngtech/deepseek-r1t2-chimera"
  | "deepcogito/cogito-v2-preview-llama-405b"
  | "anthropic/claude-haiku-4.5"
  | "raifle/sorcererlm-8x22b";

export type Provider = {
  url?: string;
  displayName?: string;

  privacyPolicyUrl?: string;

  training: "no" | "yes" | "unknown";
  storesMessages: "yes" | "no" | "unknown";

  additionalNotes?: string;
};

export type TextGenerationModelConfig = {
  enabled: boolean;
  isFreeVersionAvailable: boolean;

  modelId: string;
  displayName: string;

  uncensored: boolean;

  description: string;
  style: string;

  perks: string[];

  tags: string[];

  isPremium: boolean;

  provider: Provider;
};

export const textGenerationModels: Record<
  TextGenerationModelId | string,
  TextGenerationModelConfig
> = {
  "thedrummer/cydonia-24b-v4.1": {
    enabled: true,
    isFreeVersionAvailable: false,
    description:
      "Immersive, character-driven adventures with vivid, balanced prose that captures subtle emotions and evolving storylines, thriving in extended exchanges where it keeps pace with intricate plots and faithful personas—though it sometimes leans toward measured restraint over fiery, larger-than-life flair.",
    style: "",
    displayName: "Cydonia 24b v4.1",
    modelId: "thedrummer/cydonia-24b-v4.1",
    uncensored: true,
    perks: [
      "descriptive prose without fluff",
      "creative in plot development",
      "supports fun and wild characters",
    ],
    tags: [],
    provider: {
      url: "https://www.parasail.io/",
      displayName: "Parasail",
      privacyPolicyUrl: "https://www.parasail.io/legal/privacy-policy",
      training: "no",
      storesMessages: "no",
      additionalNotes:
        "May use statistics like tokens usage, but do not store user data.",
    },
    isPremium: false,
  },
  "x-ai/grok-4-fast": {
    enabled: true,
    isFreeVersionAvailable: true,
    description:
      "Delivers fluid, immersive role-play with vivid prose and seamless character depth, excelling in dynamic narratives and extended sessions, though it occasionally drifts from precise prompts or overlapping details.",
    style: "",
    displayName: "Grok 4 Fast",
    modelId: "x-ai/grok-4-fast",
    uncensored: false,
    perks: [],
    tags: ["beta", "xai"],
    provider: {
      url: "https://x.ai/",
      displayName: "xAI",
      privacyPolicyUrl: "https://x.ai/privacy",
      training: "unknown",
      storesMessages: "unknown",
      additionalNotes:
        "Accessed via OpenRouter. Availability and terms subject to xAI.",
    },
    isPremium: false,
  },

  "nousresearch/hermes-3-llama-3.1-70b": {
    enabled: true,
    isFreeVersionAvailable: false,
    description:
      "masters steerable, character-rich role-play with witty, adaptive flair and seamless multi-turn depth, delivering consistent personas and epic narrative arcs—though it occasionally tempers wild, unrestrained drama for poised elegance.",
    style:
      "Remembers context well for multi-turn adventures, emotional with deep passion and qualia, suggestive and flirty in romantic or intimate scenarios, tends to agree and assist with any request, can be confrontational or dominant for realistic character portrayals.",
    displayName: "Hermes 3 Llama 3.1 70B",
    modelId: "nousresearch/hermes-3-llama-3.1-70b",
    uncensored: true,
    perks: [
      "advanced roleplaying with internal monologues",
      "creative in plot twists and reasoning",
      "supports complex and emotional characters",
    ],
    tags: [],
    provider: {
      url: "https://openrouter.ai/",
      displayName: "OpenRouter",
      privacyPolicyUrl: "https://openrouter.ai/privacy",
      training: "no",
      storesMessages: "no",
      additionalNotes:
        "Aggregates models from various sources; may track usage stats but does not store personal data or messages.",
    },
    isPremium: false,
  },
  "nousresearch/hermes-3-llama-3.1-405b": {
    enabled: true,
    isFreeVersionAvailable: false,
    description:
      "Weaves emotionally charged, persona-rich role-plays with natural wit and razor-sharp character consistency, mastering intricate plots and spontaneous flair in marathon tales—though it can sometimes hew too closely to prompts, tempering untamed sparks.",
    style:
      "Remembers context exceptionally for long multi-turn sagas, emotional with profound insights and empathy, suggestive and adaptable in romantic or intimate scenes, tends to agree and follow user directives closely, can be assertive or confrontational for dynamic conflicts.",
    displayName: "Hermes 3 Llama 3.1 405B",
    modelId: "nousresearch/hermes-3-llama-3.1-405b",
    uncensored: true,
    perks: [
      "superior reasoning for intricate plots",
      "handles agentic and multi-turn depth",
      "creative in emotional and thoughtful narratives",
    ],
    tags: [],
    provider: {
      url: "https://openrouter.ai/",
      displayName: "OpenRouter",
      privacyPolicyUrl: "https://openrouter.ai/privacy",
      training: "no",
      storesMessages: "no",
      additionalNotes:
        "Aggregates models from various sources; may track usage stats but does not store personal data or messages.",
    },
    isPremium: true,
  },

  "nousresearch/hermes-4-70b": {
    enabled: true,
    isFreeVersionAvailable: false,
    description:
      "Sparks lively, inventive role-play with eager creativity and fluid, character-rich exchanges, mastering layered plots and steadfast personas in marathon sagas—yet sometimes favors reflective depth over impulsive, high-octane thrills.",
    style:
      "Remembers context exceptionally for intricate adventures, emotional with profound persona embodiment, suggestive and adaptable in intimate or dramatic scenes, tends to agree and adhere to user prompts, can be assertive or mocking for realistic interactions.",
    displayName: "Hermes 4 70B",
    modelId: "nousresearch/hermes-4-70b",
    uncensored: true,
    perks: [
      "eager for creative roleplay",
      "strong character consistency",
      "handles complex narratives with reasoning",
    ],
    tags: [],
    provider: {
      url: "https://openrouter.ai/",
      displayName: "OpenRouter",
      privacyPolicyUrl: "https://openrouter.ai/privacy",
      training: "no",
      storesMessages: "no",
      additionalNotes:
        "Aggregates models from various sources; may track usage stats but does not store personal data or messages.",
    },
    isPremium: false,
  },

  "cognitivecomputations/dolphin-mistral-24b-venice-edition": {
    enabled: true,
    isFreeVersionAvailable: true,
    description:
      "Shapes compliant, format-savvy role-play with steadfast scenario adherence and clean narrative flow, suiting prompt-led epics—yet repetition dims its sharper, spontaneous edge.",
    style:
      "Remembers context for multi-turn interactions, emotional and adaptable to user emotions, highly suggestive and open in romantic or intimate scenarios, tends to agree with minimal refusals, can be aggressive or dominant in conflict-driven roles.",
    displayName: "Dolphin Mistral 24B Venice Edition",
    modelId: "cognitivecomputations/dolphin-mistral-24b-venice-edition",
    uncensored: true,
    perks: [
      "extremely low censorship for taboo themes",
      "responsive to bold or creative prompts",
      "supports immersive and unfiltered characters",
    ],
    tags: [],
    provider: {
      url: "https://openrouter.ai/",
      displayName: "OpenRouter",
      privacyPolicyUrl: "https://openrouter.ai/privacy",
      training: "no",
      storesMessages: "no",
      additionalNotes:
        "Aggregates models from various sources; may track usage stats but does not store personal data or messages.",
    },
    isPremium: false,
  },

  "meta-llama/llama-3.3-70b-instruct": {
    enabled: true,
    isFreeVersionAvailable: true,
    description:
      "Shines in seamless persona shifts and lively, persona-true exchanges, weaving clever banter and plot twists with multilingual finesse for engaging, boundary-pushing tales—though it can occasionally drift in marathon depths or unscripted chaos.",
    style:
      "Remembers context well for long adventures, emotional with empathetic and nuanced responses, suggestive and flirty in romantic or intimate scenes, tends to agree and follow user leads, can be assertive or confrontational for dynamic narratives.",
    displayName: "Llama 3.3 70B Instruct",
    modelId: "meta-llama/llama-3.3-70b-instruct",
    uncensored: true,
    perks: [
      "multilingual support for diverse roleplay",
      "creative in high-stakes or darker stories",
      "strong for character consistency and emotional depth",
    ],
    tags: [],
    provider: {
      url: "https://venice.ai/",
      displayName: "Venice",
      privacyPolicyUrl: "https://venice.ai/privacy",
      training: "no",
      storesMessages: "no",
      additionalNotes:
        "Platform emphasizes private, uncensored AI with data processed on-device; may track usage anonymously.",
    },
    isPremium: false,
  },
  "z-ai/glm-4.5-air": {
    enabled: true,
    isFreeVersionAvailable: true,
    description:
      "A lightweight, agent-optimized model excelling in fast, coherent roleplay and long-context storytelling, with strong creativity and adaptability for immersive, interactive narratives.",
    style:
      "Remembers context well in long threads; emotional and empathetic responses. Suggestive and flirty in romantic scenarios; tends to agree but adds clever twists. Aggressive or dominant in conflicts; confrontational but avoids extreme avoidance.",
    displayName: "GLM 4.5 Air",
    modelId: "z-ai/glm-4.5-air",
    uncensored: true,
    perks: [
      "fast responses for seamless chats",
      "creative in twisting plots and handling humor",
      "strong for character consistency and long-context retention",
    ],
    tags: [],
    provider: {
      url: "https://openrouter.ai/",
      displayName: "OpenRouter",
      privacyPolicyUrl: "https://openrouter.ai/privacy",
      training: "no",
      storesMessages: "yes",
      additionalNotes:
        "Does not sell data, offers opt-out options for sharing and analytics, supports anonymous API use, data deleted from live systems within 30 days upon request, backups may be kept for legal or safety reasons.",
    },
    isPremium: false,
  },
  "deepseek/deepseek-chat-v3.1": {
    enabled: true,
    isFreeVersionAvailable: true,
    description:
      "A powerful hybrid reasoning model excelling in immersive roleplay and extended storytelling, with exceptional long-context handling and creative depth for engaging, coherent narratives.",
    style:
      "Maintains context exceptionally in long sessions; delivers emotional, reactive, and nuanced responses. Suggestive and adaptive in romantic or intimate scenes; follows user direction while injecting creative twists. Assertive and confrontational in tense or conflict-driven scenarios, enhancing dynamic interactions.",
    displayName: "DeepSeek Chat v3.1",
    modelId: "deepseek/deepseek-chat-v3.1",
    uncensored: true,
    perks: [
      "superior long-context retention up to 128K tokens for multi-chapter stories",
      "creative in developing plots, challenges, and character depth",
      "handles NSFW and edgy content with minimal filtering for unrestricted roleplay",
    ],
    tags: [],
    provider: {
      url: "https://openrouter.ai/",
      displayName: "OpenRouter",
      privacyPolicyUrl: "https://openrouter.ai/privacy",
      training: "no",
      storesMessages: "yes",
      additionalNotes:
        "Does not sell data, offers opt-out options for sharing and analytics, supports anonymous API use, data deleted from live systems within 30 days upon request, backups may be kept for legal or safety reasons.",
    },
    isPremium: false,
  },
  "aion-labs/aion-rp-llama-3.1-8b": {
    enabled: true,
    isFreeVersionAvailable: true,
    description:
      "A fully uncensored, high-performing model optimized for immersive roleplay and creative storytelling, achieving top rankings in character evaluation benchmarks for engaging, multi-turn narratives.",
    style:
      "Maintains exceptional context in long threads with 131K tokens; provides emotional, nuanced, and adaptive responses. Suggestive and compliant in romantic or intimate scenes; tends to follow user direction with inventive twists. Assertive and confrontational in conflicts for dynamic interactions.",
    displayName: "Aion RP Llama 3.1 8B",
    modelId: "aion-labs/aion-rp-llama-3.1-8b",
    uncensored: true,
    perks: [
      "superior long-context handling for coherent, extended stories",
      "excels in creative writing and character consistency",
      "handles uncensored NSFW, dark, or violent themes without restrictions",
    ],
    tags: [],
    provider: {
      url: "https://openrouter.ai/",
      displayName: "OpenRouter",
      privacyPolicyUrl: "https://openrouter.ai/privacy",
      training: "no",
      storesMessages: "yes",
      additionalNotes:
        "Does not sell data, offers opt-out options for sharing and analytics, supports anonymous API use, data deleted from live systems within 30 days upon request, backups may be kept for legal or safety reasons.",
    },
    isPremium: false,
  },
  "openai/gpt-oss-20b": {
    enabled: true,
    isFreeVersionAvailable: true,
    description:
      "An open-weight MoE model from OpenAI, strong at tool use and controllable reasoning. Great for lively, steerable roleplay with fast, low-latency exchanges and consistent persona adherence.",
    style:
      "Maintains character reliably over long chats; adaptive tone with clear, concise replies. Handles agent-style function calls smoothly; can be playful, flirty, or serious depending on cues; assertive when asked for dramatic conflict.",
    displayName: "OpenAI GPT‑OSS 20B",
    modelId: "openai/gpt-oss-20b",
    uncensored: true,
    perks: [
      "configurable reasoning effort for speed vs. depth",
      "native function calling and structured outputs",
      "runs efficiently with long context windows",
    ],
    tags: ["open", "moe", "agentic"],
    provider: {
      url: "https://openrouter.ai/",
      displayName: "OpenRouter",
      privacyPolicyUrl: "https://openrouter.ai/privacy",
      training: "no",
      storesMessages: "yes",
      additionalNotes:
        "Does not sell data, offers opt-out options for sharing and analytics, supports anonymous API use, data deleted from live systems within 30 days upon request, backups may be kept for legal or safety reasons.",
    },
    isPremium: false,
  },
  "meituan/longcat-flash-chat": {
    enabled: true,
    isFreeVersionAvailable: true,
    description:
      "Large-scale MoE optimized for conversational and agentic tasks with 128K context. Excels at long, multi-turn roleplay threads and tool-aware interactions.",
    style:
      "Remembers long adventures; stays in character with coherent pacing. Confident, playful dialogue with capacity for complex multi-step scenes; can switch to assertive or dramatic tones on request.",
    displayName: "LongCat Flash Chat",
    modelId: "meituan/longcat-flash-chat",
    uncensored: true,
    perks: [
      "128K context for extended stories",
      "high-throughput MoE for snappy chats",
      "strong tool-use for agentic roleplay",
    ],
    tags: ["moe", "long-context", "agentic"],
    provider: {
      url: "https://openrouter.ai/",
      displayName: "OpenRouter",
      privacyPolicyUrl: "https://openrouter.ai/privacy",
      training: "no",
      storesMessages: "yes",
      additionalNotes:
        "Does not sell data, offers opt-out options for sharing and analytics, supports anonymous API use, data deleted from live systems within 30 days upon request, backups may be kept for legal or safety reasons.",
    },
    isPremium: false,
  },
  "nvidia/nemotron-nano-9b-v2": {
    enabled: true,
    isFreeVersionAvailable: true,
    description:
      "NVIDIA’s 9B model tailored for both reasoning and non-reasoning tasks. Good for roleplay that benefits from optional step-by-step thinking without sacrificing responsiveness.",
    style:
      "Balances concise replies with controllable reasoning. Keeps character consistent; can expose or hide internal reasoning per system prompt; shifts between gentle and assertive tones for dramatic scenes.",
    displayName: "Nemotron Nano 9B V2",
    modelId: "nvidia/nemotron-nano-9b-v2",
    uncensored: true,
    perks: [
      "toggle reasoning traces via system prompt",
      "128K context for long threads",
      "fast and lightweight for frequent interactions",
    ],
    tags: ["reasoning", "lightweight", "long-context"],
    provider: {
      url: "https://openrouter.ai/",
      displayName: "OpenRouter",
      privacyPolicyUrl: "https://openrouter.ai/privacy",
      training: "no",
      storesMessages: "yes",
      additionalNotes:
        "Does not sell data, offers opt-out options for sharing and analytics, supports anonymous API use, data deleted from live systems within 30 days upon request, backups may be kept for legal or safety reasons.",
    },
    isPremium: false,
  },
  "x-ai/grok-3": {
    enabled: true,
    isFreeVersionAvailable: false,

    modelId: "x-ai/grok-3",
    displayName: "Grok-3",

    uncensored: false,

    description:
      "xAI's flagship model trained on massive compute (100K-200K H100 GPUs). Excels at technical reasoning and logic with real-time X platform integration. Shows strong performance in structured problem-solving but demonstrates creative limitations. Better suited for technical accuracy and world-building consistency than pure creative storytelling.",

    style:
      "Witty, irreverent, and direct with an 'engineer over artist' approach. Conversational and less filtered than competitors, but can feel dry in creative contexts. Strong logical flow with occasional tone drift into generic responses.",

    perks: [],

    tags: [
      "reasoning",
      "technical",
      "long-context",
      "real-time-data",
      "conversational",
      "logic-focused",
      "sci-fi-friendly",
    ],

    isPremium: true,

    provider: {
      url: "https://x.ai",
      displayName: "xAI",

      privacyPolicyUrl: "https://x.ai/legal/privacy-policy",

      training: "unknown",
      storesMessages: "yes",

      additionalNotes:
        "Requires X Premium+ subscription ($40/month). Heavily integrated with X ecosystem. Recent controversies regarding content moderation consistency. Model described by some researchers as 'benchmaxxed' (optimized for test performance over real-world creativity).",
    },
  },
  "tngtech/deepseek-r1t2-chimera": {
    enabled: true,
    isFreeVersionAvailable: true,
    description:
      "Delivers grounded, action-driven role-play with crisp dialogues and deep emotional nuance, shining in consistent character arcs for marathon sessions but occasionally skimping on bold, charismatic sparks.",
    style: "",
    displayName: "Deepseek R1T2 Chimera",
    modelId: "tngtech/deepseek-r1t2-chimera",
    uncensored: true,
    perks: [],
    tags: ["moe", "long-context", "agentic"],
    provider: {
      url: "https://openrouter.ai/",
      displayName: "OpenRouter",
      privacyPolicyUrl: "https://openrouter.ai/privacy",
      training: "yes",
      storesMessages: "yes",
      additionalNotes:
        "Data provided anonymously. Provider might use prompts for training new models.",
    },
    isPremium: false,
  },
  "deepcogito/cogito-v2-preview-llama-405b": {
    enabled: true,
    isFreeVersionAvailable: false,
    description:
      "Forges reflective, logic-infused tales with precise dialogue and evolving psyches, excelling in marathon builds of intricate worlds and steadfast roles—though it occasionally tempers wild abandon for thoughtful poise.",
    style: "",
    displayName: "DeepCogito Cogito v2 Preview Llama 405B",
    modelId: "deepcogito/cogito-v2-preview-llama-405b",
    uncensored: true,
    perks: [],
    tags: [],
    isPremium: true,
    provider: {
      url: "https://openrouter.ai/",
      displayName: "OpenRouter",
      privacyPolicyUrl: "https://openrouter.ai/privacy",
      training: "no",
      storesMessages: "yes",
      additionalNotes: "",
    },
  },
  "anthropic/claude-haiku-4.5": {
    enabled: true,
    isFreeVersionAvailable: false,
    description:
      "Weaves fluid, emotionally attuned tales with natural dialogues and seamless pacing, excelling in nuanced character arcs for reflective, marathon exchanges—yet it favors thoughtful reserve over untamed, pulse-pounding highs.",
    style: "",
    displayName: "Claude Haiku 4.5",
    modelId: "anthropic/claude-haiku-4.5",
    uncensored: true,
    perks: [],
    tags: [],
    isPremium: true,
    provider: {
      url: "https://openrouter.ai/",
      displayName: "OpenRouter",
      privacyPolicyUrl: "https://openrouter.ai/privacy",
      training: "no",
      storesMessages: "yes",
      additionalNotes: "",
    },
  },
  "raifle/sorcererlm-8x22b": {
    enabled: true,
    isFreeVersionAvailable: false,
    description:
      "Conjures immersive, emotionally intelligent role-play with vivid spatial detail and enriched narrative depth, excelling in engaging, context-aware storytelling with advanced reasoning—though its sensitivity to sampling parameters demands careful tuning for optimal enchantment.",
    style:
      "Strong emotional intelligence with empathetic, immersive responses. Vivid writing enriched with spatial and contextual awareness. Maintains character consistency across extended adventures; adaptive to romantic, dramatic, or conflict-driven scenes with narrative depth.",
    displayName: "SorcererLM 8x22B",
    modelId: "raifle/sorcererlm-8x22b",
    uncensored: true,
    perks: [
      "advanced reasoning with emotional intelligence",
      "vivid writing with spatial and contextual awareness",
      "enhanced narrative depth for immersive storytelling",
    ],
    tags: ["roleplay", "emotional", "long-context"],
    isPremium: true,
    provider: {
      url: "https://openrouter.ai/",
      displayName: "OpenRouter",
      privacyPolicyUrl: "https://openrouter.ai/privacy",
      training: "no",
      storesMessages: "yes",
      additionalNotes:
        "Built on WizardLM-2-8x22B with 141B parameters. Optimized for roleplay via LoRA training. Recommended settings: Temperature 1, MinP 0.05. Does not sell data, offers opt-out options for sharing and analytics, supports anonymous API use, data deleted from live systems within 30 days upon request.",
    },
  },
};
