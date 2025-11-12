export const personaExtractV1 = {
  id: "system.persona.extract.v1" as const,
  mode: "extract" as const,
  version: "v1" as const,
  label: "Persona data extraction (Phase 2 - Structured)",
  render: () => `Extract the character information into the specified fields, preserving all content and original wording without summarizing or stripping any details.`,
};
