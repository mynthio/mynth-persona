// Shared Sparks presets and pricing config (frontend + backend)

export type SparkPreset = {
  key: string;
  name: string;
  amount: number; // sparks amount
  priceUSD: number; // promotional price in USD
};

// Custom amount is disabled. Keep constant for reference if needed elsewhere.
export const CUSTOM_USD_PER_SPARK = 1.49 / 100; // $0.0149 per spark

export const SPARKS_PRESETS: Record<string, SparkPreset> = {
  // 3-pack offering: 100, 500, 1000
  p100: { key: "p100", name: "+100", amount: 100, priceUSD: 1.49 },
  p500: { key: "p500", name: "+500", amount: 500, priceUSD: 6.99 },
  p1000: { key: "p1000", name: "+1 000", amount: 1000, priceUSD: 9.99 },
};

export const getSparksPresetsList = (): SparkPreset[] =>
  Object.values(SPARKS_PRESETS);

export function resolveSparkCheckout(presetKey: string): {
  amount: number;
  priceUSD: number;
  description: string;
  isPreset: true;
  preset: SparkPreset;
} {
  const preset = SPARKS_PRESETS[presetKey];
  if (!preset) {
    throw new Error("INVALID_PRESET");
  }

  return {
    amount: preset.amount,
    priceUSD: preset.priceUSD,
    description: `Persona: ${preset.amount} sparks purchase (${preset.name} pack)`,
    isPreset: true,
    preset,
  };
}
