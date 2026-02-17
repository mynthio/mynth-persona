export type VoiceGender = "female" | "male" | "neutral";
export type VoiceAge = "young" | "middle-aged" | "older";

export type VoiceConfig = {
  id: string;
  displayName: string;
  gender: VoiceGender;
  accent: string;
  age: VoiceAge;
  description: string;
  tags: string[];
  previewUrl: string;
};

export const voices: VoiceConfig[] = [
  // ── Female voices ──
  {
    id: "BNlQZXHhRfq9Rzsahhpb",
    displayName: "Sofia V.",
    gender: "female",
    accent: "Spanish",
    age: "older",
    description: "Middle-aged/Older woman with spanish accent",
    tags: ["spanish"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/database/user/eFd3DolNNZViZOfaQX2h8ZlIROn2/voices/BNlQZXHhRfq9Rzsahhpb/83caff1f-2ee1-4807-b0c0-159a9cde223c.mp3",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    displayName: "Sarah",
    gender: "female",
    accent: "American",
    age: "young",
    description:
      "Young adult woman with a confident and warm, mature quality and a reassuring, professional tone.",
    tags: ["confident", "reassuring", "mature"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/01a3e33c-6e99-4ee7-8543-ff2216a32186.mp3",
  },
  {
    id: "FGY2WhTYpPnrIDTdsKH5",
    displayName: "Laura",
    gender: "female",
    accent: "American",
    age: "young",
    description:
      "This young adult female voice delivers sunny enthusiasm with a quirky attitude.",
    tags: ["enthusiastic", "quirky", "sassy"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/FGY2WhTYpPnrIDTdsKH5/67341759-ad08-41a5-be6e-de12fe448618.mp3",
  },
  {
    id: "cgSgspJ2msm6clMCkdW9",
    displayName: "Jessica",
    gender: "female",
    accent: "American",
    age: "young",
    description:
      "Young and popular, this playful American female voice is perfect for trendy content.",
    tags: ["playful", "bright", "cute"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/cgSgspJ2msm6clMCkdW9/56a97bf8-b69b-448f-846c-c3a11683d45a.mp3",
  },
  {
    id: "pFZP5JQG7iQjIQuC4Bku",
    displayName: "Lily",
    gender: "female",
    accent: "British",
    age: "middle-aged",
    description:
      "Velvety British female voice delivers news and narrations with warmth and clarity.",
    tags: ["velvety", "confident", "warm"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/pFZP5JQG7iQjIQuC4Bku/89b68b35-b3dd-4348-a84a-a3c13a3c2b30.mp3",
  },
  {
    id: "Xb7hH8MSUJpSbSDYk0k2",
    displayName: "Alice",
    gender: "female",
    accent: "British",
    age: "middle-aged",
    description:
      "Clear and engaging, friendly woman with a British accent suitable for e-learning.",
    tags: ["clear", "engaging", "professional"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/Xb7hH8MSUJpSbSDYk0k2/d10f7534-11f6-41fe-a012-2de1e482d336.mp3",
  },
  {
    id: "XrExE9yKIg1WjnnlVkGX",
    displayName: "Matilda",
    gender: "female",
    accent: "American",
    age: "middle-aged",
    description:
      "A professional woman with a pleasing alto pitch. Suitable for many use cases.",
    tags: ["professional", "upbeat", "versatile"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/XrExE9yKIg1WjnnlVkGX/b930e18d-6b4d-466e-bab2-0ae97c6d8535.mp3",
  },
  {
    id: "hpp4J3VqNfWAUOO0d1Us",
    displayName: "Bella",
    gender: "female",
    accent: "American",
    age: "middle-aged",
    description:
      "Warm, bright, and professional voice with crisp diction and a deliberate, rhythmic pace.",
    tags: ["warm", "bright", "professional"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/hpp4J3VqNfWAUOO0d1Us/dab0f5ba-3aa4-48a8-9fad-f138fea1126d.mp3",
  },

  // ── Male voices ──
  {
    id: "TX3LPaxmHKxFdv7VOQHJ",
    displayName: "Liam",
    gender: "male",
    accent: "American",
    age: "young",
    description:
      "A young adult with energy and warmth - suitable for reels and shorts.",
    tags: ["energetic", "confident", "warm"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/TX3LPaxmHKxFdv7VOQHJ/63148076-6363-42db-aea8-31424308b92c.mp3",
  },
  {
    id: "bIHbv24MWmeRgasZH58o",
    displayName: "Will",
    gender: "male",
    accent: "American",
    age: "young",
    description: "Conversational and laid back.",
    tags: ["relaxed", "chill", "conversational"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/bIHbv24MWmeRgasZH58o/8caf8f3d-ad29-4980-af41-53f20c72d7a4.mp3",
  },
  {
    id: "IKne3meq5aSn9XLyUdCD",
    displayName: "Charlie",
    gender: "male",
    accent: "Australian",
    age: "young",
    description:
      "A young Australian male with a confident and energetic voice.",
    tags: ["confident", "energetic", "hyped"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/IKne3meq5aSn9XLyUdCD/102de6f2-22ed-43e0-a1f1-111fa75c5481.mp3",
  },
  {
    id: "SOYHLrjzK2X1ezoPC6cr",
    displayName: "Harry",
    gender: "male",
    accent: "American",
    age: "young",
    description: "An animated warrior ready to charge forward.",
    tags: ["fierce", "rough", "animated"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/SOYHLrjzK2X1ezoPC6cr/86d178f6-f4b6-4e0e-85be-3de19f490794.mp3",
  },
  {
    id: "cjVigY5qzO86Huf0OWal",
    displayName: "Eric",
    gender: "male",
    accent: "American",
    age: "middle-aged",
    description:
      "A smooth tenor pitch from a man in his 40s - perfect for agentic use cases.",
    tags: ["smooth", "trustworthy", "classy"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/cjVigY5qzO86Huf0OWal/d098fda0-6456-4030-b3d8-63aa048c9070.mp3",
  },
  {
    id: "CwhRBWXzGAHq8TQ4Fs17",
    displayName: "Roger",
    gender: "male",
    accent: "American",
    age: "middle-aged",
    description: "Easy going and perfect for casual conversations.",
    tags: ["laid-back", "casual", "classy"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/CwhRBWXzGAHq8TQ4Fs17/58ee3ff5-f6f2-4628-93b8-e38eb31806b0.mp3",
  },
  {
    id: "iP95p4xoKVk53GoZ742B",
    displayName: "Chris",
    gender: "male",
    accent: "American",
    age: "middle-aged",
    description:
      "Natural and real, this down-to-earth voice is great across many use-cases.",
    tags: ["charming", "casual", "natural"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/iP95p4xoKVk53GoZ742B/3f4bde72-cc48-40dd-829f-57fbf906f4d7.mp3",
  },
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    displayName: "George",
    gender: "male",
    accent: "British",
    age: "middle-aged",
    description: "Warm resonance that instantly captivates listeners.",
    tags: ["warm", "captivating", "mature"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/JBFqnCBsd6RMkjVDRZzb/e6206d1a-0721-4787-aafb-06a6e705cac5.mp3",
  },
  {
    id: "nPczCjzI2devNBz1zQrb",
    displayName: "Brian",
    gender: "male",
    accent: "American",
    age: "middle-aged",
    description:
      "Middle-aged man with a resonant and comforting tone. Great for narrations and advertisements.",
    tags: ["deep", "resonant", "comforting"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/nPczCjzI2devNBz1zQrb/2dd3e72c-4fd3-42f1-93ea-abc5d4e5aa1d.mp3",
  },
  {
    id: "N2lVS1w4EtoT3dr4eOWO",
    displayName: "Callum",
    gender: "male",
    accent: "American",
    age: "middle-aged",
    description: "Deceptively gravelly, yet unsettling edge.",
    tags: ["husky", "gravelly", "edgy"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/N2lVS1w4EtoT3dr4eOWO/ac833bd8-ffda-4938-9ebc-b0f99ca25481.mp3",
  },
  {
    id: "pNInz6obpgDQGcFmaJgB",
    displayName: "Adam",
    gender: "male",
    accent: "American",
    age: "middle-aged",
    description:
      "A bright tenor pitch that immediately cuts through with unwavering certainty.",
    tags: ["dominant", "firm", "confident"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/d6905d7a-dd26-4187-bfff-1bd3a5ea7cac.mp3",
  },
  {
    id: "onwK4e9ZLuTAKqWW03F9",
    displayName: "Daniel",
    gender: "male",
    accent: "British",
    age: "middle-aged",
    description:
      "A strong voice perfect for delivering a professional broadcast or news story.",
    tags: ["steady", "formal", "professional"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/onwK4e9ZLuTAKqWW03F9/7eee0236-1a72-4b86-b303-5dcadc007ba9.mp3",
  },
  {
    id: "pqHfZKP75CvOlQylNhV4",
    displayName: "Bill",
    gender: "male",
    accent: "American",
    age: "older",
    description: "Friendly and comforting voice ready to narrate your stories.",
    tags: ["wise", "mature", "crisp"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/pqHfZKP75CvOlQylNhV4/d782b3ff-84ba-4029-848c-acf01285524d.mp3",
  },

  // ── Neutral voices ──
  {
    id: "SAz9YHcvj6GT2YYXdXww",
    displayName: "River",
    gender: "neutral",
    accent: "American",
    age: "middle-aged",
    description:
      "A relaxed, neutral voice ready for narrations or conversational projects.",
    tags: ["relaxed", "neutral", "calm"],
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/SAz9YHcvj6GT2YYXdXww/e6c95f0b-2227-491a-b3d7-2249240decb7.mp3",
  },
];

export const voiceIds: Set<string> = new Set(voices.map((v) => v.id));

export function getVoiceById(id: string): VoiceConfig | undefined {
  return voices.find((v) => v.id === id);
}
