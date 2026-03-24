import "server-only";

import { type DialoguePart } from "./extract-dialogue-parts";
import { type ResolvedVoices } from "./resolve-voice-ids";

/**
 * Calls the ElevenLabs text-to-dialogue API to generate audio from dialogue parts.
 *
 * Uses POST https://api.elevenlabs.io/v1/text-to-dialogue with mp3_44100_128 output format.
 * Maps each part to the appropriate voice ID based on type (narrative/character).
 *
 * @returns Buffer containing the MP3 audio data
 */
export async function generateDialogueAudio(
  parts: DialoguePart[],
  voices: ResolvedVoices,
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const inputs = parts.map((part) => ({
    text: part.text,
    voice_id:
      part.type === "character"
        ? voices.characterVoiceId
        : voices.narrativeVoiceId,
  }));

  const response = await fetch(
    "https://api.elevenlabs.io/v1/text-to-dialogue?output_format=mp3_44100_128",
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs,
        model_id: "eleven_v3",
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
