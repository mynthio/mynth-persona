/**
 * Replace template placeholders in text
 *
 * Supported placeholders:
 * - {{user.name}} -> userName or "USER"
 * - {{persona.name}}, {{persona.1.name}} -> personaName
 */
export function replacePlaceholders(
  text: string,
  {
    userName,
    personaName,
  }: {
    userName?: string | null;
    personaName: string;
  }
): string {
  return text
    .replaceAll("{{user.name}}", userName || "USER")
    .replaceAll("{{persona.name}}", personaName)
    .replaceAll("{{persona.1.name}}", personaName);
}
