export type TextGenerationStreamObjectOptions<SchemaType = any> = {
  systemPrompt: string;
  onFinish: (object: SchemaType) => void;
  onError: (error: { error: unknown }) => void;
};
